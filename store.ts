import { Device } from "react-native-ble-plx";

import { create } from 'zustand';
import { createJSONStorage, persist } from 'expo-zustand-persist';
import AsynStorage from '@react-native-async-storage/async-storage';

type ConnectedDeviceStore = {
  connectedDevice: Device | null;
  setConnectedDevice: (device: Device | null) => void;
}

type CurrentUserStore = {
  currentUser: string | null;
  setCurrentUser: (user: string | null) => void;
}

export const useConnectedDeviceStore = create<ConnectedDeviceStore>(
  persist(
    (set) => ({
      connectedDevice: null,
      setConnectedDevice: (device: Device | null) => set({ connectedDevice: device }),
    }),
    {
      name: 'MetalArm.connectedBleDevice', // unique name for storage key
      storage: createJSONStorage(() => AsynStorage),
    }
  )
);

export const useCurrentUserStore = create<CurrentUserStore>(
  persist(
    (set) => ({
      currentUser: null,
      setCurrentUser: (user: string | null) => set({ currentUser: user }),
    }),
    {
      name: 'MetalArm.currentUser', // unique name for storage key
      storage: createJSONStorage(() => AsynStorage),
    }
  )
);
