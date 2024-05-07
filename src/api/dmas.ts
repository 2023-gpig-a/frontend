// given a range of cooridinates,
// DMAS api will return all data in location range

export interface PlantGrowthDatum {
  date: Date;
  longitude: number;
  latitiude: number;
  count: number;
}

export interface DmasData {
  species: string;
  plantGrowth: PlantGrowthDatum[];
}

export interface DmasAPI {
  getDmasData(latLon?: [number, number], scanRange?: number, dayRange?: number): Promise<DmasData[]>;
}

export const Dmas: DmasAPI = {
  getDmasData: async (latLon, scanRange, dayRange) => {
    const queryParams = new URLSearchParams();
    if (scanRange) {
      queryParams.append("scan_range", scanRange.toString());
    }
    if (dayRange) {
      queryParams.append("day_range", dayRange.toString());
    }
    if (latLon) {
      queryParams.append('center_lat', latLon[0].toString());
      queryParams.append('center_lon', latLon[1].toString());
    }
    const response = await fetch(
      import.meta.env.VITE_DMAS_ENDPOINT + "/track_growth?" + queryParams.toString()
    );
    return (await response.json()).plant_growth_data;
  },
};

export const MockDmasAPI: DmasAPI = {
  getDmasData: async () => {
    return [
      {
        species: "Rose",
        plantGrowth: [
          {
            date: new Date(2022, 1, 10),
            longitude: -0.06664746,
            latitiude: -0.06236538,
            count: 10,
          },
          {
            date: new Date(2022, 1, 10),
            longitude: -0.04116847,
            latitiude: -0.06236538,
            count: 15,
          },
          {
            date: new Date(2022, 1, 10),
            longitude: -0.05116847,
            latitiude: -0.06236538,
            count: 25,
          },
          {
            date: new Date(2023, 1, 10),
            longitude: -0.06664746,
            latitiude: -0.06236538,
            count: 10,
          },
          {
            date: new Date(2023, 1, 10),
            longitude: -0.04116847,
            latitiude: -0.06236538,
            count: 10,
          },
          {
            date: new Date(2023, 1, 10),
            longitude: -0.05116847,
            latitiude: -0.06236538,
            count: 20,
          },
          {
            date: new Date(2024, 1, 10),
            longitude: -0.06664746,
            latitiude: -0.06236538,
            count: 6,
          },
          {
            date: new Date(2024, 1, 10),
            longitude: -0.04116847,
            latitiude: -0.06236538,
            count: 6,
          },
          {
            date: new Date(2024, 1, 10),
            longitude: -0.05116847,
            latitiude: -0.06236538,
            count: 12,
          },
        ],
      },
      {
        species: "Japanese Knotweed",
        plantGrowth: [
          {
            date: new Date(2022, 1, 10),
            longitude: -0.06664746,
            latitiude: -0.06236538,
            count: 1,
          },
          {
            date: new Date(2022, 1, 10),
            longitude: -0.04116847,
            latitiude: -0.06236538,
            count: 5,
          },
          {
            date: new Date(2022, 1, 10),
            longitude: -0.05116847,
            latitiude: -0.06236538,
            count: 3,
          },
          {
            date: new Date(2023, 1, 10),
            longitude: -0.06664746,
            latitiude: -0.06236538,
            count: 10,
          },
          {
            date: new Date(2023, 1, 10),
            longitude: -0.04116847,
            latitiude: -0.06236538,
            count: 12,
          },
          {
            date: new Date(2023, 1, 10),
            longitude: -0.05116847,
            latitiude: -0.06236538,
            count: 15,
          },
          {
            date: new Date(2024, 1, 10),
            longitude: -0.06664746,
            latitiude: -0.06236538,
            count: 21,
          },
          {
            date: new Date(2024, 1, 10),
            longitude: -0.04116847,
            latitiude: -0.06236538,
            count: 24,
          },
          {
            date: new Date(2024, 1, 10),
            longitude: -0.05116847,
            latitiude: -0.06236538,
            count: 30,
          },
        ],
      },
      {
        species: "Sweet Chestnut",
        plantGrowth: [
          {
            date: new Date(2022, 1, 10),
            longitude: -0.06664746,
            latitiude: -0.06236538,
            count: 2,
          },
          {
            date: new Date(2022, 1, 10),
            longitude: -0.04116847,
            latitiude: -0.06236538,
            count: 2,
          },
          {
            date: new Date(2022, 1, 10),
            longitude: -0.05116847,
            latitiude: -0.06236538,
            count: 3,
          },
          {
            date: new Date(2023, 1, 10),
            longitude: -0.06664746,
            latitiude: -0.06236538,
            count: 5,
          },
          {
            date: new Date(2023, 1, 10),
            longitude: -0.04116847,
            latitiude: -0.06236538,
            count: 4,
          },
          {
            date: new Date(2023, 1, 10),
            longitude: -0.05116847,
            latitiude: -0.06236538,
            count: 1,
          },
          {
            date: new Date(2024, 1, 10),
            longitude: -0.06664746,
            latitiude: -0.06236538,
            count: 10,
          },
          {
            date: new Date(2024, 1, 10),
            longitude: -0.04116847,
            latitiude: -0.06236538,
            count: 4,
          },
          {
            date: new Date(2024, 1, 10),
            longitude: -0.05116847,
            latitiude: -0.06236538,
            count: 5,
          },
        ],
      },
      {
        species: "Bracken",
        plantGrowth: [
          {
            date: new Date(2022, 1, 10),
            longitude: -0.06664746,
            latitiude: -0.06236538,
            count: 6,
          },
          {
            date: new Date(2022, 1, 10),
            longitude: -0.04116847,
            latitiude: -0.06236538,
            count: 5,
          },
          {
            date: new Date(2022, 1, 10),
            longitude: -0.05116847,
            latitiude: -0.06236538,
            count: 5,
          },
          {
            date: new Date(2023, 1, 10),
            longitude: -0.06664746,
            latitiude: -0.06236538,
            count: 6,
          },
          {
            date: new Date(2023, 1, 10),
            longitude: -0.04116847,
            latitiude: -0.06236538,
            count: 5,
          },
          {
            date: new Date(2023, 1, 10),
            longitude: -0.05116847,
            latitiude: -0.06236538,
            count: 5,
          },
          {
            date: new Date(2024, 1, 10),
            longitude: -0.06664746,
            latitiude: -0.06236538,
            count: 6,
          },
          {
            date: new Date(2024, 1, 10),
            longitude: -0.04116847,
            latitiude: -0.06236538,
            count: 5,
          },
          {
            date: new Date(2024, 1, 10),
            longitude: -0.05116847,
            latitiude: -0.06236538,
            count: 8,
          },
        ],
      },
    ];
  },
};

// export interface DmasData {
//     species: string;
//     quantityOnDates: Array<[Date, number]>;
// }

// export interface DmasAPI {
//     getDmasData(): Promise<DmasData[]>;
// }

// export const MockDmasAPI: DmasAPI = {
//     getDmasData: async () => {
//         return [
//             {
//                 species: "Rose",
//                 quantityOnDates: [[new Date(2022, 1, 10),50],[new Date(2023, 1, 10),40],[new Date(2024, 1, 10),20]]
//             },
//             {
//                 species: "Janpanese Knotweed",
//                 quantityOnDates: [[new Date(2022, 1, 10),0],[new Date(2023, 1, 10),10],[new Date(2024, 1, 10),60]]
//             },
//             {
//                 species: "Sweet Chestnut",
//                 quantityOnDates: [[new Date(2022, 1, 10),10],[new Date(2023, 1, 10),12],[new Date(2024, 1, 10),20]]
//             },
//             {
//                 species: "Bracken",
//                 quantityOnDates: [[new Date(2022, 1, 10),20],[new Date(2023, 1, 10),20],[new Date(2024, 1, 10),15]]
//             },
//         ];
//     },
// };
