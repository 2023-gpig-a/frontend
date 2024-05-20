import {
  Circle,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMapEvent,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";
import MarkerClusterGroup from "@changey/react-leaflet-markercluster";
import { Link } from "react-router-dom";
import { DroneManager, DroneManagerAPI, MockDroneAPI } from "../../api/drones";
import { DmasAPI, Dmas, MockDmasAPI, PlantGrowthDatum } from "../../api/dmas";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Ref, useEffect, useReducer, useRef, useState } from "react";
import L from "leaflet";
import dayjs from "dayjs";

import IconDrone from "../../assets/noun-drone-6835491.svg";
import IconWeed from "../../assets/noun-leaf-1747497.svg";
import IconRose from "../../assets/noun-rose-2554501.svg";
import IconPlant from "../../assets/noun-plant-387024.svg";

import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

const METRES_PER_DEGREE_LAT = 111_111;

const Drones: DroneManagerAPI =
  import.meta.env.VITE_USE_MOCK_DRONEMANAGER === "true"
    ? MockDroneAPI
    : DroneManager;

const DMAS: DmasAPI =
  import.meta.env.VITE_USE_MOCK_DMAS === "true" ? MockDmasAPI : Dmas;

const plantSpeciestoIcon: Record<string, string> = {
  knotweed: IconWeed,
  rose: IconRose,
};

type PlantsState = {
  plants: Array<PlantGrowthDatum & { species: string }>;
};

function MoveableCircle(props: {
  centre: [number, number];
  radius: number;
  onMove: (centre: [number, number], radius: number) => void;
  onClick?: () => void;
}) {
  useMapEvent("mousemove", (e) => {
    props.onMove([e.latlng.lat, e.latlng.lng], props.radius);
  });
  return (
    <Circle
      center={props.centre}
      radius={props.radius}
      eventHandlers={{
        mousedown: (e) => {
          e.originalEvent.preventDefault();
          props.onClick?.();
        },
      }}
    />
  );
}

function plantsReducer(
  state: PlantsState,
  action: PlantGrowthDatum & { species: string }
): PlantsState {
  const rec = state.plants.find(
    (x) => x.latitude === action.latitude && x.longitude === action.longitude
  );
  if (!rec) {
    return { plants: [...state.plants, action] };
  }
  rec.count = action.count;
  return { plants: state.plants };
}

function DroneMap({ mapRef }: { mapRef?: Ref<L.Map> }) {
  const [seenPlants, addPlants] = useReducer(plantsReducer, { plants: [] });
  const { data: drones } = useQuery({
    queryFn: Drones.getDroneStatus,
    queryKey: ["droneStatus"],
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (drones) {
      Promise.all(
        Object.values(drones).map(async (drone) => {
          const plants = await DMAS.getDmasData(drone.lastSeen, 150, 10);
          for (const datum of plants) {
            for (const instance of datum.plant_growth_datum) {
              addPlants({ ...instance, species: datum.species });
            }
          }
        })
      );
    }
  }, [drones]);

  const [isDirecting, setDirecting] = useState(false);
  const [directCentre, setDirectCentre] = useState<[number, number]>([
    54.39, -0.397,
  ]);
  const [directRadiusMetres, setDirectRadiusMetres] = useState(150);
  const doDirectDrone = useMutation({
    mutationFn: (args: { lat: number; lon: number; radius: number }) => {
      return Drones.droneDispatchCircle(
        args.lat,
        args.lon,
        args.radius / METRES_PER_DEGREE_LAT
      );
    },
  });

  return (
    <>
      <MapContainer
        center={[54.39, -0.937]}
        zoom={12}
        style={{ width: "100%", maxWidth: "100vw", minHeight: "600px" }}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {isDirecting && (
          <MoveableCircle
            centre={directCentre}
            radius={directRadiusMetres}
            onMove={(centre, radius) => {
              setDirectCentre(centre);
              setDirectRadiusMetres(radius);
            }}
            onClick={() => {
              setDirecting(false);
              doDirectDrone.mutate({
                lat: directCentre[0],
                lon: directCentre[1],
                radius: directRadiusMetres,
              });
            }}
          />
        )}
        {doDirectDrone.isPending && (
          <Circle
            center={directCentre}
            radius={directRadiusMetres}
            pathOptions={{ color: "red" }}
          />
        )}
        {drones &&
          Object.entries(drones).map(([id, drone]) => (
            <Marker
              key={id}
              position={drone.lastSeen}
              icon={L.icon({
                iconUrl: IconDrone,
                iconSize: [64, 64],
                iconAnchor: [32, 32],
              })}
            >
              <Popup>
                <table>
                  <tbody>
                    <tr>
                      <td>Status</td>
                      <td>{drone.status}</td>
                    </tr>
                    <tr>
                      <td>Last Seen</td>
                      <td>{dayjs(drone.lastUpdate).fromNow()}</td>
                    </tr>
                  </tbody>
                </table>
              </Popup>
            </Marker>
          ))}

        <MarkerClusterGroup >
          {seenPlants.plants.map((plant) => {
            return (
              <Marker
                key={`${plant.species}-${plant.latitude}-${plant.longitude}`}
                position={[plant.latitude, plant.longitude]}
                icon={L.icon({
                  iconUrl: plantSpeciestoIcon[plant.species] ?? IconPlant,
                  iconSize: [32, 32],
                  iconAnchor: [16, 32],
                })}
              >
                <Popup>
                  <table>
                    <tbody>
                      <tr>
                        <td>Species</td>
                        <td>{plant.species}</td>
                      </tr>
                      <tr>
                        <td>Count</td>
                        <td>{plant.count}</td>
                      </tr>
                    </tbody>
                  </table>
                </Popup>
              </Marker>
            );
          })}
        </MarkerClusterGroup>
      </MapContainer>
      <button onClick={() => setDirecting(!isDirecting)}>Direct Drones</button>
      {isDirecting && (
        <div>
          <label>
            Radius
            <input
              type="range"
              min={50}
              max={1000}
              value={directRadiusMetres}
              onChange={(e) => setDirectRadiusMetres(parseInt(e.target.value))}
            />
            {directRadiusMetres}m
          </label>
        </div>
      )}
    </>
  );
}

export default function MapPage() {
  const droneStatuses = useQuery({
    queryFn: Drones.getDroneStatus,
    queryKey: ["droneStatus"],
    refetchInterval: 5000,
  });
  const mapRef = useRef<L.Map>(null);

  console.log(droneStatuses.data);

  return (
    <div className="grid grid-cols-2 gap-1">
      <div>
        <h1 className="text-2xl font-bold">Drone Statuses</h1>
        {droneStatuses.isLoading && <div>Loading...</div>}
        {droneStatuses.isError && (
          <div>Error: {String(droneStatuses.error)}</div>
        )}
        {droneStatuses.isSuccess && (
          <ul className="space-y-1">
            {droneStatuses.data &&
              Object.entries(droneStatuses.data).map(([id, drone]) => (
                <li key={id} className="block p-2 shadow-sm">
                  <div>
                    {id} - {drone.status}
                  </div>
                  <div>Last seen {dayjs(drone.lastUpdate).fromNow()}</div>
                  <button
                    className="bg-blue-500 text-white p-1 rounded inline-block"
                    onClick={() => mapRef.current?.panTo(drone.lastSeen)}
                  >
                    Highlight
                  </button>
                </li>
              ))}
          </ul>
        )}
      </div>
      <div>
        <DroneMap mapRef={mapRef} />
      </div>
      <Link to="/data">
        <button className="bg-green-500 text-white p-1 rounded">
          View Data
        </button>
      </Link>
    </div>
  );
}
