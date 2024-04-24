// given a range of cooridinates,
// DMAS api will return all data in location range

export interface DmasData {
    species: string;
    quantityOnDates: Array<[Date, number]>;
}

export interface DmasAPI {
    getDmasData(): Promise<DmasData[]>;
}

export const MockDmasAPI: DmasAPI = {
    getDmasData: async () => {
        return [
            {
                species: "Rose",
                quantityOnDates: [[new Date(2022, 1, 10),50],[new Date(2023, 1, 10),40],[new Date(2024, 1, 10),20]]
            },
            {
                species: "Janpanese Knotweed",
                quantityOnDates: [[new Date(2022, 1, 10),0],[new Date(2023, 1, 10),10],[new Date(2024, 1, 10),60]]
            },
            {
                species: "Sweet Chestnut",
                quantityOnDates: [[new Date(2022, 1, 10),10],[new Date(2023, 1, 10),12],[new Date(2024, 1, 10),20]]
            },
            {
                species: "Bracken",
                quantityOnDates: [[new Date(2022, 1, 10),20],[new Date(2023, 1, 10),20],[new Date(2024, 1, 10),15]]
            },
        ];
    },
};