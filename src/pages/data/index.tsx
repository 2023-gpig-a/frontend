import { SetStateAction, useState } from "react";
import { DmasAPI, MockDmasAPI } from "../../api/dmas";
import ReactDOM from "react-dom";


// TODO replace this with a real implementation
const Plants: DmasAPI = MockDmasAPI;
function formatDataBarChart(data: any){
    console.log(Plants.getDmasData());
}
//add year to form
export default function DataPage(this: any) {
    const [myLocation, setMyLocation] = useState("York");

  const handleChange = (event: { target: { value: SetStateAction<string>; }; }) => {
    setMyLocation(event.target.value)
  }
  console.log(myLocation)
  formatDataBarChart(Plants);
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
        </div>
    )
    
    
}
