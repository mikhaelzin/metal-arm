import { useConnectedDeviceStore } from "@/store";
import { useState } from "react";
import { BleManager, Device, NativeDevice } from "react-native-ble-plx";

interface IBle {
  requestPermissions: () => Promise<boolean>;
  scanForPeripherals: () => void;
  connectToDevice: (deviceId: Device) => Promise<void>;
  disconnectFromDevice: () => void;
  allDevices: Device[];
  sendSequenceToDevice: (sequence: string) => Promise<void>;
}

function createMockedDevice(id: string, name: string) {
  const nativeDevice = {} as NativeDevice;
  return new Device(
    {
      ...nativeDevice,
      id: id,
      name: name,
    },
    {} as BleManager,
  );
}

export function useBleExpoGo(): IBle {
  const [allDevices, setAllDevices] = useState<Device[]>([]);
  const setConnectedDevice = useConnectedDeviceStore(state => state.setConnectedDevice);

  async function requestPermissions() {
    return true;
  }

  async function scanForPeripherals() {
    setAllDevices([
      createMockedDevice("1", "Device 1"),
      createMockedDevice("2", "Device 2"),
      createMockedDevice("3", "Device 3"),
      createMockedDevice("4", "Device 4"),
      createMockedDevice("5", "Device 5"),
      createMockedDevice("6", "Device 6"),
      createMockedDevice("7", "Device 7"),
      createMockedDevice("8", "Device 8"),
      createMockedDevice("9", "Device 9"),
      createMockedDevice("10", "Device 10"),
      createMockedDevice("11", "Device 11"),
      createMockedDevice("12", "Device 12"),
      createMockedDevice("13", "Device 13"),
      createMockedDevice("14", "Device 14"),
      createMockedDevice("15", "Device 15"),
      createMockedDevice("16", "Device 16"),
      createMockedDevice("17", "Device 17"),
      createMockedDevice("18", "Device 18"),
      createMockedDevice("19", "Device 19"),
      createMockedDevice("20", "Device 20"),
    ]);
    console.log("SCANNING");
  }

  async function connectToDevice(device: Device) {
    setConnectedDevice(device);
  }

  function disconnectFromDevice() {
    setConnectedDevice(null);
  }

  async function sendSequenceToDevice(sequence: string) {
    console.log("SENDING SEQUENCE", sequence);
  }

  return {
    scanForPeripherals,
    requestPermissions,
    connectToDevice,
    allDevices,
    disconnectFromDevice,
    sendSequenceToDevice,
  };
}
