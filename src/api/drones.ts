import dayjs from "dayjs";

export interface DroneStatus {
  status: "idle" | "flying" | "unknown";
  battery: number;
  lastUpdate: Date;
  lastSeen: [number, number];
}

export interface DroneManagerAPI {
  droneDispatchCircle(latitude: number, longitude: number, radiusDegrees: number): Promise<void>;
  getDroneStatus(): Promise<Record<string, DroneStatus>>;
}

export const DroneManager: DroneManagerAPI = {
  getDroneStatus: async () => {
    const response = await fetch(
      import.meta.env.VITE_DRONEMANAGER_ENDPOINT + "/drone_status",
    );
    return await response.json();
  },
  droneDispatchCircle: async (latitude: number, longitude: number, radiusDegrees: number) => {
    await fetch(
      import.meta.env.VITE_DRONEMANAGER_ENDPOINT + "/drone_dispatch/circle",
      {
        method: "POST",
        body: JSON.stringify({ lat: latitude, lon: longitude, radius: radiusDegrees }),
        headers: {
          "Content-Type": "application/json",
        }
      },
    );
  }
};

export const MockDroneAPI: DroneManagerAPI = {
  getDroneStatus: async () => {
    const center = [54.39, -0.937];
    return {
      "1": {
        status: "idle",
        battery: 100,
        lastUpdate: new Date(),
        lastSeen: [center[0] + 0.05, center[1] + 0.05],
      },
      "2": {
        status: "flying",
        battery: 87,
        lastUpdate: new Date(),
        lastSeen: [
          center[0] + Math.random() * 0.05,
          center[1] + Math.random() * 0.05,
        ],
      },
      "3": {
        status: "flying",
        battery: 87,
        lastUpdate: new Date(),
        lastSeen: [
          center[0] + Math.random() * 0.05,
          center[1] + Math.random() * 0.05,
        ],
      },
      "4": {
        status: "flying",
        battery: 87,
        lastUpdate: new Date(),
        lastSeen: [
          center[0] + Math.random() * 0.05,
          center[1] + Math.random() * 0.05,
        ],
      },
      "5": {
        status: "unknown",
        battery: 100,
        lastUpdate: dayjs().subtract(1, "hour").toDate(),
        lastSeen: [center[0] - 0.05, center[1] + 0.05],
      },
    };
  },
  droneDispatchCircle: async (lat, lng, rad) => {
    console.log(`Dispatching drone to ${lat}, ${lng} with radius ${rad}`);
  },
};
