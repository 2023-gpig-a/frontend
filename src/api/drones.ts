import dayjs from "dayjs";

export interface DroneStatus {
  id: string;
  status: "idle" | "flying" | "unknown";
  battery: number;
  lastUpdate: Date;
  lastSeen: [number, number];
}

export interface DroneManagerAPI {
  getDroneStatus(): Promise<DroneStatus[]>;
}

export const DroneManager: DroneManagerAPI = {
  getDroneStatus: async () => {
    const response = await fetch(
      import.meta.env.VITE_DRONEMANAGER_ENDPOINT + "/drone_status",
    );
    return response.json();
  },
};

export const MockDroneAPI: DroneManagerAPI = {
  getDroneStatus: async () => {
    const center = [54.39, -0.937];
    return [
      {
        id: "1",
        status: "idle",
        battery: 100,
        lastUpdate: new Date(),
        lastSeen: [center[0] + 0.05, center[1] + 0.05],
      },
      {
        id: "2",
        status: "flying",
        battery: 87,
        lastUpdate: new Date(),
        lastSeen: [
          center[0] + Math.random() * 0.05,
          center[1] + Math.random() * 0.05,
        ],
      },
      {
        id: "3",
        status: "flying",
        battery: 87,
        lastUpdate: new Date(),
        lastSeen: [
          center[0] + Math.random() * 0.05,
          center[1] + Math.random() * 0.05,
        ],
      },
      {
        id: "4",
        status: "flying",
        battery: 87,
        lastUpdate: new Date(),
        lastSeen: [
          center[0] + Math.random() * 0.05,
          center[1] + Math.random() * 0.05,
        ],
      },
      {
        id: "5",
        status: "unknown",
        battery: 100,
        lastUpdate: dayjs().subtract(1, "hour").toDate(),
        lastSeen: [center[0] - 0.05, center[1] + 0.05],
      },
    ];
  },
};
