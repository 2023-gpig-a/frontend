import { SetStateAction, useState } from "react";
import { DmasAPI, DmasData, MockDmasAPI } from "../../api/dmas";
import { useQuery } from "@tanstack/react-query";
import { Label, BarChart,LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Bar, Rectangle } from 'recharts';
import { forEachChild } from "typescript";


// TODO replace this with a real implementation
const Plants: DmasAPI = MockDmasAPI;

function formatData(){
    const dataArray = useQuery({
        queryFn: Plants.getDmasData,
        queryKey: ["species"],
    });
    const plantTotalsByYear = new Map<number, Record<string, number>>();
    if (dataArray.data != undefined){
        for(const x of dataArray.data){
            for(const y of x.plantGrowth) {
                const year = y.date.getFullYear();
                if (!plantTotalsByYear.has(year)) {
                    plantTotalsByYear.set(year, {});
                }
               plantTotalsByYear.get(year)![x.species] = 0;
               plantTotalsByYear.get(year)![x.species] += y.count; 
            } 
        }
    }
    const plantTotalsArray = Array.from(plantTotalsByYear.entries())
        .map(([year, totals]) => ({ year, ...totals }));
    return plantTotalsArray   
    }

function returnAllSpecies() {
    const allSpecies = [];
    const returnData = useQuery({
        queryFn: Plants.getDmasData,
        queryKey: ["species"],
      })
      if(returnData.data != undefined){
        for (const x of returnData.data) {
            allSpecies.push(x.species)
          }
      }
      return allSpecies;
}
function stringToColour(str: string){
    let hash = 0;
    str.split('').forEach(char => {
      hash = char.charCodeAt(0) + ((hash << 5) - hash)
    })
    let colour = '#'
    for (let i = 0; i < 3; i++) {
      const value = (hash >> (i * 8)) & 0xff
      colour += value.toString(16).padStart(2, '0')
    }
    return colour
}
//add year to form
export default function DataPage(this: any) {
    const [myLocation, setMyLocation] = useState("York");

  const handleChange = (event: { target: { value: SetStateAction<string>; }; }) => {
    setMyLocation(event.target.value)
  }
  
  const chartData = formatData();
  const allSpecies = returnAllSpecies();
  
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
            <ResponsiveContainer width={"50%"} height={500} >
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
                <XAxis dataKey="year" >
                <Label value="Time" offset={-5} position="insideBottom" />
                </XAxis>
                <YAxis label={{ value: 'Plant count', angle: -90, position: 'insideLeft' }}>   
                </YAxis>
                <Tooltip />
                <Legend />
                
                {
                allSpecies.map((x) => (
                    <Line type="monotone" dataKey={x} stroke={stringToColour(x)} />
                ))}
                
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
    
    
}
