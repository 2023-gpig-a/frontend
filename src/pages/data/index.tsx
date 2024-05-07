import { SetStateAction, useState } from "react";
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

// TODO replace this with a real implementation
const Plants: DmasAPI = 
    import.meta.env.VITE_USE_MOCK_DMAS === "true"
        ? MockDmasAPI
        : Dmas;

function formatData(dataArray: DmasData[] | undefined) {
  const plantTotalsByYear = new Map<number, Record<string, number>>();
  if (Array.isArray(dataArray)) {
    for (const x of dataArray) {
      for (const y of x.plantGrowth) {
        const year = y.date.getFullYear();
        if (!plantTotalsByYear.has(year)) {
          plantTotalsByYear.set(year, {});
        }
        plantTotalsByYear.get(year)![x.species] = 0;
        plantTotalsByYear.get(year)![x.species] += y.count;
      }
    }
  }
  const plantTotalsArray = Array.from(plantTotalsByYear.entries()).map(
    ([year, totals]) => ({ year, ...totals }),
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
    queryFn: Plants.getDmasData,
    queryKey: ["species"],
  });

  const [myLocation, setMyLocation] = useState("York");

  const handleChange = (event: {
    target: { value: SetStateAction<string> };
  }) => {
    setMyLocation(event.target.value);
  };

  const chartData = formatData(returnData.data);
  const allSpecies = returnAllSpecies(returnData.data);

  return (
    <div>
      <h1 className="text-2xl font-bold">View Data</h1>
      <form>
        <select value={myLocation} onChange={handleChange}>
          <option value="York">York</option>
          <option value="Leeds">Leeds</option>
          <option value="London">London</option>
        </select>
      </form>
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
