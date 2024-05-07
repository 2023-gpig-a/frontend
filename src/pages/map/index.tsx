import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Link } from "react-router-dom";
import {
  DroneManager,
  DroneManagerAPI,
  MockDroneAPI,
} from "../../api/drones";
import { DmasAPI, Dmas, MockDmasAPI, PlantGrowthDatum } from "../../api/dmas";
import { useQuery } from "@tanstack/react-query";
import L from "leaflet";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Ref, useEffect, useReducer, useRef } from "react";
dayjs.extend(relativeTime);

const Drones: DroneManagerAPI =
  import.meta.env.VITE_USE_MOCK_DRONEMANAGER === "true"
    ? MockDroneAPI
    : DroneManager;

const DMAS: DmasAPI =
  import.meta.env.VITE_USE_MOCK_DMAS === "true" ? MockDmasAPI : Dmas;

const droneStatusToColor: Record<"idle" | "flying" | "unknown", string> = {
  idle: "green",
  flying: "blue",
  unknown: "red",
};

type PlantsState = {
  plants: Array<PlantGrowthDatum & { species: string }>;
};

function plantsReducer(
  state: PlantsState,
  action: PlantGrowthDatum & { species: string }
): PlantsState {
  const rec = state.plants.find(
    (x) => x.latitiude === action.latitiude && x.longitude === action.longitude
  );
  if (!rec) {
    return { plants: [...state.plants, action] };
  }
  rec.count += action.count;
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
        drones.map(async (drone) => {
          const plants = await DMAS.getDmasData(drone.lastSeen);
          for (const datum of plants) {
            for (const instance of datum.plantGrowth) {
              addPlants({ ...instance, species: datum.species });
            }
          }
        })
      );
    }
  }, [drones]);

  return (
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
      {(drones ?? []).map((drone) => (
        <Marker
          key={drone.id}
          position={drone.lastSeen}
          icon={L.divIcon({
            className: "drone-marker",
            html: `<div style="background-color: ${
              droneStatusToColor[drone.status]
            }; width: 48px; height: 48px; border-radius: 50%; color: white; display: flex; align-items: center; justify-content: center">${
              drone.id
            }</div>`,
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
      {seenPlants.plants.map((plant) => (
        <Marker
          key={`${plant.species}-${plant.latitiude}-${plant.longitude}`}
          position={[plant.latitiude, plant.longitude]}
          icon={L.divIcon({
            className: "plant-marker",
            html: `<div style="background-color: green; width: 48px; height: 48px; border-radius: 50%; color: white; display: flex; align-items: center; justify-content: center">${plant.count}</div>`,
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
      ))}
    </MapContainer>
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
            {droneStatuses.data?.map((drone) => (
              <li key={drone.id} className="block p-2 shadow-sm">
                <div>
                  {drone.id} - {drone.status}
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
