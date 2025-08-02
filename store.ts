import { create } from 'zustand';
import { createJSONStorage, persist } from 'expo-zustand-persist';
import AsynStorage from '@react-native-async-storage/async-storage';

type CurrentUserStore = {
  currentUser: string | null;
  setCurrentUser: (user: string | null) => void;
}

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
