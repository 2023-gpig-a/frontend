import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Link } from "react-router-dom";
import {
  DroneManager,
  DroneManagerAPI,
  DroneStatus,
  MockDroneAPI,
} from "../../api/drones";
import { useQuery } from "@tanstack/react-query";
import L from "leaflet";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Ref, useRef } from "react";
dayjs.extend(relativeTime);

const Drones: DroneManagerAPI =
  import.meta.env.VITE_USE_MOCK_DRONEMANAGER === "true"
    ? MockDroneAPI
    : DroneManager;

const droneStatusToColor: Record<"idle" | "flying" | "unknown", string> = {
  idle: "green",
  flying: "blue",
  unknown: "red",
};

function DroneMap({
  drones,
  mapRef,
}: {
  drones: DroneStatus[];
  mapRef?: Ref<L.Map>;
}) {
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
      {drones.map((drone) => (
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
        <DroneMap drones={droneStatuses.data || []} mapRef={mapRef} />
      </div>
      <Link to="/data">
        <button className="bg-green-500 text-white p-1 rounded">
          View Data
        </button>
      </Link>
    </div>
  );
}
