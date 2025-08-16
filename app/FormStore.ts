// store/formStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
// If using Expo, uncomment the next line:
// import AsyncStorage from "@react-native-async-storage/async-storage";

type VehicleType = "Cars" | "Vans" | "Bikes" | "Buses";
export type DaySlot = { day: string; enabled: boolean; startTime: string; endTime: string };

export type State = {
  name: string;
  address: string;
  location: string; // stringified JSON
  pricing: string;
  description: string;
  vehicleCounts: Record<VehicleType, string>;
  timeSlots: DaySlot[];
  setField: <K extends keyof State>(key: K, value: State[K]) => void;
  setVehicleCounts: (v: Record<VehicleType, string>) => void;
};

// Default 7-day template
const defaultSlots: DaySlot[] = [
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
].map((day) => ({ day, enabled: false, startTime: "", endTime: "" }));

export const useParkingFormStore = create<State>()(
  persist(
    (set) => ({
      name: "",
      address: "",
      location: "",
      pricing: "",
      description: "",
      vehicleCounts: { Cars: "0", Vans: "0", Bikes: "0", Buses: "0" },
      timeSlots: defaultSlots,
      setField: (key, value) => set(() => ({ [key]: value } as Pick<State, typeof key>)),
      setVehicleCounts: (v) => set(() => ({ vehicleCounts: v })),
    }),
    {
      name: "parkmate-form",
      // If you want persistence across app restarts in Expo, enable storage:
      // storage: createJSONStorage(() => AsyncStorage),
      // You can also save only a subset:
      // partialize: (state) => ({ timeSlots: state.timeSlots, vehicleCounts: state.vehicleCounts }),
    }
  )
);
