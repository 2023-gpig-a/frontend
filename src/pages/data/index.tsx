import { useEffect, useState } from "react";
import { Dmas, DmasAPI, DmasData, MockDmasAPI } from "../../api/dmas";
import { useQuery } from "@tanstack/react-query";
import {
  Label,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import Geonames from "geonames.js";
import centerOfMass from "@turf/center-of-mass";
import MarkerClusterGroup from "@changey/react-leaflet-markercluster";
import { debounce } from "lodash-es";
import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";
import { MapContainer, Marker, TileLayer, Popup, Polygon } from "react-leaflet";

import IconDrone from "../../assets/noun-drone-6835491.svg";
import IconPlant from "../../assets/noun-plant-387024.svg";
import L from "leaflet";
import dayjs from "dayjs";
import { DroneManagerAPI, MockDroneAPI, DroneManager } from "../../api/drones";

const geonames = Geonames({
  username: import.meta.env.VITE_GEONAMES_USERNAME,
  lan: "en",
  encoding: "JSON",
});

const Plants: DmasAPI =
  import.meta.env.VITE_USE_MOCK_DMAS === "true" ? MockDmasAPI : Dmas;

const historicalAtom = atom(false);
const mapSpeciesFilter = atom<string | null>(null);

function returnAllSpecies(returnData: DmasData[] | undefined) {
  const allSpecies = [];
  if (Array.isArray(returnData)) {
    for (const x of returnData) {
      allSpecies.push(x.species);
    }
  }
  return allSpecies;
}
function stringToColour(str: string) {
  // convert string to hex code
  let hash = 0;
  str.split("").forEach((char) => {
    hash = char.charCodeAt(0) + ((hash << 5) - hash);
  });
  let colour = "#";
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    colour += value.toString(16).padStart(2, "0");
  }
  return colour;
}

function isSpeciesInvasive(species: string) {
  return species === "Knotweed";
}

function DetectedPlantsTile() {
  const historical = useAtomValue(historicalAtom);
  const { data, isLoading } = useQuery({
    queryFn: () => Plants.getDmasData(historical ? 1000 : 1),
    queryKey: ["plants", historical],
    refetchInterval: 1000,
  });

  const setFilter = useSetAtom(mapSpeciesFilter);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-3xl font-bold mb-2">Species</h2>

      <div className="grid grid-cols-2 gap-4">
        {data?.map((species) => (
          <div
            key={species.species}
            className="border p-2 inline-block space-y-1"
          >
            <h3 className="text-3xl font-bold">{species.species}</h3>
            {isSpeciesInvasive(species.species) && (
              <p className="bg-red-700 text-white px-4 py-2 my-2 rounded inline-block">
                Invasive
              </p>
            )}
            <p>
              Count:{" "}
              {species.plant_growth_datum.reduce(
                (acc, item) => acc + item.count,
                0
              )}
            </p>
            <button
              className="bg-white text-green px-4 py-2 rounded"
              onClick={() => setFilter(species.species)}
            >
              Show on map
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function groupDataByDay(data: DmasData[]) {
  const grouped: Record<string, Record<string, number>> = {};
  for (const species of data) {
    for (const datum of species.plant_growth_datum) {
      const date = new Date(datum.date).toISOString().slice(0, 7);
      if (!grouped[date]) {
        grouped[date] = {};
      }
      if (typeof grouped[date][species.species] !== "number") {
        grouped[date][species.species] = 0;
      }
      grouped[date][species.species] += datum.count;
    }
  }
  return grouped;
}

function StatusOverTimeTile() {
  const historical = useAtomValue(historicalAtom);
  const returnData = useQuery({
    queryFn: () => Plants.getDmasData(historical ? 1000 : 1),
    queryKey: ["plants", historical],
    refetchInterval: 1000,
  });
  const allSpecies = returnAllSpecies(returnData.data);
  const processed = returnData.data
    ? Object.entries(groupDataByDay(returnData.data))
    : [];
  return (
    <div className="border p-2">
      <h2 className="text-3xl font-bold mb-2">Plant Status Over Time</h2>
      <ResponsiveContainer width={"100%"} height={500} className="bg-white">
        <LineChart
          data={(historical ? processed.slice(0, processed.length - 2) : processed).map(([year, data]) => ({ year, ...data }))}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year">
            <Label value="Time" offset={-5} position="insideBottom" />
          </XAxis>
          <YAxis
            label={{
              value: "Plant count",
              angle: -90,
              position: "insideLeft",
            }}
            domain={[0, "dataMax + 1"]}
          ></YAxis>
          <Tooltip />
          <Legend />

          {allSpecies.map((x) => (
            <Line
              type="monotone"
              dataKey={x}
              stroke={stringToColour(x)}
              strokeWidth={3}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function findUniquePlants(data: DmasData[]) {
  const result: Record<string, number> = {};
  const seenLatLongs = new Set<string>();
  for (const species of data) {
    for (const datum of species.plant_growth_datum) {
      const key = `${datum.latitude},${datum.longitude}`;
      if (seenLatLongs.has(key)) {
        continue;
      }
      seenLatLongs.add(key);
      if (!result[species.species]) {
        result[species.species] = 0;
      }
      result[species.species] += datum.count;
    }
  }
  return result;
}

function TotalsChartTile() {
  const historical = useAtomValue(historicalAtom);
  const returnData = useQuery({
    queryFn: () => Plants.getDmasData(historical ? 1000 : 1),
    queryKey: ["plants", historical],
    refetchInterval: 1000,
  });

  const totals = returnData.data ? findUniquePlants(returnData.data) : null;

  return (
    <div className="border p-2">
      <h2 className="text-3xl font-bold mb-2">Total Plants Found</h2>
      <ResponsiveContainer width={"100%"} height={500} className="bg-white">
        <BarChart data={returnData.data ? [totals] : []}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year">
            <Label value="Time" offset={-5} position="insideBottom" />
          </XAxis>
          <YAxis
            label={{
              value: "Plant count",
              angle: -90,
              position: "insideLeft",
            }}
            domain={[0, "dataMax + 1"]}
          ></YAxis>
          <Tooltip />
          <Legend />
          {totals &&
            Object.keys(totals).map((species) => (
              <Bar dataKey={species} fill={stringToColour(species)} />
            ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

const Drones: DroneManagerAPI =
  import.meta.env.VITE_USE_MOCK_DRONEMANAGER === "true"
    ? MockDroneAPI
    : DroneManager;

function MapTile() {
  const historical = useAtomValue(historicalAtom);
  const { data } = useQuery({
    queryFn: () => Plants.getDmasData(historical ? 1000 : 1),
    queryKey: ["plants", historical],
    refetchInterval: 1000,
  });
  const filter = useAtomValue(mapSpeciesFilter);

  const filtered = data?.filter((x) => x.species === filter);

  const { data: drones } = useQuery({
    queryFn: Drones.getDroneStatus,
    queryKey: ["droneStatus"],
    refetchInterval: 1000,
  });

  const centreY = 54.29285;
  const centreX = -0.5585194;

  return (
    <div>
      <h3 className="text-xl font-bold">Viewing {filter ?? "nothing"}</h3>
      <MapContainer
        center={[54.29285, -0.5585194]}
        zoom={15}
        style={{ width: "100%", maxWidth: "100vw", minHeight: "300px" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {!historical &&
          drones &&
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

        <MarkerClusterGroup>
          {filtered?.flatMap((species) => {
            return species.plant_growth_datum
              .sort((a, b) => b.date.localeCompare(a.date))
              .slice(0, 1000)
              .map((plant) => (
                <Marker
                  key={`${species}-${plant.latitude}-${plant.longitude}`}
                  position={[plant.latitude, plant.longitude]}
                  icon={L.icon({
                    iconUrl: IconPlant,
                    iconSize: [32, 32],
                    iconAnchor: [16, 32],
                  })}
                >
                  <Popup>
                    <table>
                      <tbody>
                        <tr>
                          <td>Species</td>
                          <td>{species.species}</td>
                        </tr>
                        <tr>
                          <td>Count</td>
                          <td>{plant.count}</td>
                        </tr>
                      </tbody>
                    </table>
                  </Popup>
                </Marker>
              ));
          })}
        </MarkerClusterGroup>
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
    </div>
  );
}

export default function DataPage() {
  const [historical, setHistorical] = useAtom(historicalAtom);
  const returnData = useQuery({
    queryFn: () => Plants.getDmasData(historical ? 1000 : 1),
    queryKey: ["plants", historical],
    refetchInterval: 1000,
  });

  const [myLocation, setMyLocation] = useState("");

  const updateLocation = debounce(async (latlng: [number, number]) => {
    const res = await geonames.findNearby({
      lat: latlng[1],
      lng: latlng[0],
      radius: 4,
    });
    const placeName = res.geonames?.[0]?.toponymName;
    setMyLocation(placeName ?? "Unknown");
  }, 250);

  useEffect(() => {
    if (!Array.isArray(returnData.data)) {
      return;
    }
    const fc = {
      type: "FeatureCollection",
      features: returnData.data
        .flatMap((species) =>
          species.plant_growth_datum.map((datum) => ({
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [datum.longitude, datum.latitude],
            },
          }))
        )
        .filter((x) => x.geometry.coordinates[0] && x.geometry.coordinates[1]),
    };
    if (fc.features.length === 0) {
      return;
    }
    const centre = centerOfMass(fc);
    updateLocation(centre.geometry.coordinates as [number, number]);
  }, [returnData.data, updateLocation]);

  return (
    <div>
      <h1 className="text-2xl font-bold">View Data</h1>
      <h2>Location: {myLocation}</h2>
      <label>
        <input
          type="checkbox"
          checked={historical}
          onChange={(e) => setHistorical(e.target.checked)}
        />
        Show historical data
      </label>
      <div className="grid grid-cols-2 gap-8 max-w-6xl mx-auto">
        <DetectedPlantsTile />
        <MapTile />
        <StatusOverTimeTile />
        <TotalsChartTile />
      </div>
    </div>
  );
}
