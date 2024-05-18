import { useCallback, useEffect, useState } from "react";
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
} from "recharts";
import Geonames from "geonames.js";
import centerOfMass from "@turf/center-of-mass";
import { debounce } from "lodash-es";

const geonames = Geonames({
  username: import.meta.env.VITE_GEONAMES_USERNAME,
  lan: "en",
  encoding: "JSON",
});

const Plants: DmasAPI =
  import.meta.env.VITE_USE_MOCK_DMAS === "true" ? MockDmasAPI : Dmas;

function formatData(dataArray: DmasData[] | undefined) {
  const plantTotalsByYear = new Map<number, Record<string, number>>();
  if (Array.isArray(dataArray)) {
    for (const x of dataArray) {
      for (const y of x.plant_growth_datum) {
        const year = new Date(y.date).getFullYear();
        if (!plantTotalsByYear.has(year)) {
          plantTotalsByYear.set(year, {});
        }
        plantTotalsByYear.get(year)![x.species] = 0;
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
//add year to form
export default function DataPage() {
  const returnData = useQuery({
    queryFn: () => Plants.getDmasData(),
    queryKey: ["species"],
  });

  const [myLocation, setMyLocation] = useState("");

  const updateLocation = useCallback(
    debounce(async (latlng: [number, number]) => {
      const res = await geonames.findNearby({
        lat: latlng[1],
        lng: latlng[0],
        radius: 4,
      });
      const placeName = res.geonames?.[0]?.toponymName;
      setMyLocation(placeName ?? "Unknown");
    }, 250),
    []
  );

  useEffect(() => {
    if (!Array.isArray(returnData.data)) {
      return;
    }
    const fc = {
      type: "FeatureCollection",
      features: returnData.data.flatMap((species) =>
        species.plant_growth_datum.map((datum) => ({
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [datum.longitude, datum.latitude],
          },
        }))
      ).filter(x => x.geometry.coordinates[0] && x.geometry.coordinates[1]),
    };
    if (fc.features.length === 0) {
      return;
    }
    const centre = centerOfMass(fc);
    updateLocation(centre.geometry.coordinates as [number, number]);
  }, [returnData.data, updateLocation]);

  const chartData = formatData(returnData.data);
  const allSpecies = returnAllSpecies(returnData.data);

  return (
    <div>
      <h1 className="text-2xl font-bold">View Data</h1>
      <h2>Location: {myLocation}</h2>
      <div>
        <h2 className="grid grid-cols-2 gap-1">Plant Status Over Time</h2>
        <ResponsiveContainer width={"50%"} height={500}>
          <LineChart
            data={chartData}
            margin={{
              top: 5,
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
            ></YAxis>
            <Tooltip />
            <Legend />

            {allSpecies.map((x) => (
              <Line type="monotone" dataKey={x} stroke={stringToColour(x)} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
