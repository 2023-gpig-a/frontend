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
import { atom, useAtomValue, useSetAtom } from "jotai";
import { MapContainer, Marker, TileLayer, Popup } from "react-leaflet";

import IconPlant from "../../assets/noun-plant-387024.svg";
import L from "leaflet";

const geonames = Geonames({
  username: import.meta.env.VITE_GEONAMES_USERNAME,
  lan: "en",
  encoding: "JSON",
});

const Plants: DmasAPI =
  import.meta.env.VITE_USE_MOCK_DMAS === "true" ? MockDmasAPI : Dmas;

const mapSpeciesFilter = atom<string | null>(null);

function formatData(dataArray: DmasData[] | undefined) {
  const plantTotalsByYear = new Map<number, Record<string, number>>();
  if (Array.isArray(dataArray)) {
    for (const x of dataArray) {
      for (const y of x.plant_growth_datum) {
        const year = new Date(y.date).getFullYear();
        if (!plantTotalsByYear.has(year)) {
          plantTotalsByYear.set(year, {});
        }
        if (typeof plantTotalsByYear.get(year)![x.species] !== "number") {
          plantTotalsByYear.get(year)![x.species] = 0;
        }
        plantTotalsByYear.get(year)![x.species] += y.count;
      }
    }
  }
  const plantTotalsArray = Array.from(plantTotalsByYear.entries()).map(
    ([year, totals]) => ({ year, ...totals })
  );
  return plantTotalsArray;
}

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
  const { data, isLoading } = useQuery({
    queryFn: () => Plants.getDmasData(),
    queryKey: ["plants"],
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

function StatusOverTimeTile() {
  const returnData = useQuery({
    queryFn: () => Plants.getDmasData(),
    queryKey: ["plants"],
  });
  const chartData = formatData(returnData.data);
  const allSpecies = returnAllSpecies(returnData.data);
  return (
    <div className="border p-2">
      <h2 className="text-3xl font-bold mb-2">Plant Status Over Time</h2>
      <ResponsiveContainer width={"100%"} height={500} className="bg-white">
        <LineChart
          data={chartData}
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
            <Line type="monotone" dataKey={x} stroke={stringToColour(x)} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function TotalsChartTile() {
  const returnData = useQuery({
    queryFn: () => Plants.getDmasData(),
    queryKey: ["plants"],
  });

  const speciesTotals: Record<string, number> = {};
  if (Array.isArray(returnData.data)) {
    for (const species of returnData.data) {
      speciesTotals[species.species] = species.plant_growth_datum.reduce(
        (acc, item) => acc + item.count,
        0
      );
    }
  }

  return (
    <div className="border p-2">
      <h2 className="text-3xl font-bold mb-2">Total Plants Found</h2>
      <ResponsiveContainer width={"100%"} height={500} className="bg-white">
        <BarChart data={[speciesTotals]}>
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
          {Object.keys(speciesTotals).map((species) => (
            <Bar dataKey={species} fill={stringToColour(species)} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function MapTile() {
  const { data } = useQuery({
    queryFn: () => Plants.getDmasData(),
    queryKey: ["plants"],
  });
  const filter = useAtomValue(mapSpeciesFilter);

  const filtered = data?.filter((x) => x.species === filter);

  return (
    <div>
      <h3 className="text-xl font-bold">Viewing {filter ?? "nothing"}</h3>
      <MapContainer
        center={[54.39, -0.937]}
        zoom={12}
        style={{ width: "100%", maxWidth: "100vw", minHeight: "300px" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MarkerClusterGroup>
          {filtered?.flatMap((species) => {
            return species.plant_growth_datum.map((plant) => (
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
      </MapContainer>
    </div>
  );
}

export default function DataPage() {
  const returnData = useQuery({
    queryFn: () => Plants.getDmasData(),
    queryKey: ["plants"],
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
      <div className="grid grid-cols-2 gap-8 max-w-6xl mx-auto">
        <DetectedPlantsTile />
        <MapTile />
        <StatusOverTimeTile />
        <TotalsChartTile />
      </div>
    </div>
  );
}
