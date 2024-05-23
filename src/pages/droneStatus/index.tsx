import {
  Circle,
  MapContainer,
  Marker,
  Polygon,
  Popup,
  TileLayer,
  useMapEvent,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";
import { Link } from "react-router-dom";
import { DroneManager, DroneManagerAPI, MockDroneAPI } from "../../api/drones";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Ref, useRef, useState } from "react";
import L from "leaflet";
import dayjs from "dayjs";

import IconDrone from "../../assets/noun-drone-6835491.svg";

import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

const METRES_PER_DEGREE_LAT = 111_111;

const Drones: DroneManagerAPI =
  import.meta.env.VITE_USE_MOCK_DRONEMANAGER === "true"
    ? MockDroneAPI
    : DroneManager;

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

function DroneMap({ mapRef }: { mapRef?: Ref<L.Map> }) {
  const { data: drones } = useQuery({
    queryFn: Drones.getDroneStatus,
    queryKey: ["droneStatus"],
    refetchInterval: 1000,
  });

  const [isDirecting, setDirecting] = useState(false);
  const [directCentre, setDirectCentre] = useState<[number, number]>([
    54.29285, -0.397,
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

  const centreY = 54.29285;
  const centreX = -0.5585194;

  return (
    <>
      <MapContainer
        center={[centreY, centreX]}
        zoom={15}
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
              console.log(directCentre);
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
        <Polygon
          positions={[
            [
              [90, -180],
              [90, 180],
              [-90, 180],
              [-90, -180],
            ],
            [
              [centreY - 0.00459797, centreX - 0.00429797],
              [centreY - 0.00459797, centreX + 0.00459797],
              [centreY + 0.00459797, centreX + 0.00459797],
              [centreY + 0.00459797, centreX - 0.00429797],
            ],
          ]}
          fill
          fillColor="red"
        />
      </MapContainer>
      <button
        onClick={() => setDirecting(!isDirecting)}
        className="bg-white text-green py-2 px-4 rounded font-bold"
      >
        Direct Drones
      </button>
      {isDirecting && (
        <div>
          <label>
            Radius
            <input
              type="range"
              min={25}
              max={275}
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
        <button className="bg-white text-green py-2 px-4 rounded font-bold">
          View Data
        </button>
      </Link>
    </div>
  );
}
