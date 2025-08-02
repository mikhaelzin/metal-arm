import { useMemo, useState } from "react";
import { PermissionsAndroid, Platform } from "react-native";
import { BleManager, Device } from "react-native-ble-plx";

import * as ExpoDevice from "expo-device";
import { useConnectedDeviceStore } from "@/store";

interface IBle {
  requestPermissions: () => Promise<boolean>;
  scanForPeripherals: () => void;
  connectToDevice: (deviceId: Device) => Promise<void>;
  disconnectFromDevice: () => void;
  allDevices: Device[];
  sendSequenceToDevice: (sequence: string) => Promise<void>;
}

export function useBle(): IBle {
  const bleManager = useMemo(() => new BleManager(), []);
  const [allDevices, setAllDevices] = useState<Device[]>([]);
  const connectedDeviceStore = useConnectedDeviceStore();

  async function requestAndroid31Permissions() {
    const bluetoothScanPermission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      {
        title: "Location Permission",
        message: "Bluetooth Low Energy requires Location",
        buttonPositive: "OK",
      },
    );
    const bluetoothConnectPermission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      {
        title: "Location Permission",
        message: "Bluetooth Low Energy requires Location",
        buttonPositive: "OK",
      },
    );
    const fineLocationPermission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: "Location Permission",
        message: "Bluetooth Low Energy requires Location",
        buttonPositive: "OK",
      },
    );

    return (
      bluetoothScanPermission === "granted" &&
      bluetoothConnectPermission === "granted" &&
      fineLocationPermission === "granted"
    );
  }

  async function requestPermissions() {
    if (Platform.OS === "android") {
      if ((ExpoDevice.platformApiLevel ?? -1) < 31) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: "Location Permission",
            message: "Bluetooth Low Energy requires Location",
            buttonPositive: "OK",
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        const isAndroid31PermissionsGranted =
          await requestAndroid31Permissions();

        return isAndroid31PermissionsGranted;
      }
    } else {
      return true;
    }
  }

  function isDuplicateDevice(devices: Device[], nextDevice: Device) {
    return devices.findIndex((device) => nextDevice.id === device.id) > -1;
  }

  async function scanForPeripherals() {
    return bleManager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.log(JSON.stringify(error));
      }
      if (device) {
        setAllDevices((prevState: Device[]) => {
          if (!isDuplicateDevice(prevState, device)) {
            return [...prevState, device];
          }
          return prevState;
        });
      }
    });
  }

  async function connectToDevice(device: Device) {
    try {
      const deviceConnection = await bleManager.connectToDevice(device.id);
      connectedDeviceStore.setConnectedDevice(deviceConnection);
      await deviceConnection.discoverAllServicesAndCharacteristics();
      bleManager.stopDeviceScan();
    } catch (e) {
      console.log("FAILED TO CONNECT", e);
    }
  }

  function disconnectFromDevice() {
    if (connectedDeviceStore.connectedDevice) {
      bleManager.cancelDeviceConnection(connectedDeviceStore.connectedDevice.id);
      connectedDeviceStore.setConnectedDevice(null);
    }
  }

  async function sendSequenceToDevice(sequence: string) {
    try {
      if (connectedDeviceStore.connectedDevice) {
        await bleManager.writeCharacteristicWithResponseForDevice(
          connectedDeviceStore.connectedDevice.id,
          "6E400002-B5A3-F393-E0A9-E50E24DCCA9E", // TODO: Replace with actual service and characteristic IDs
          "6E400003-B5A3-F393-E0A9-E50E24DCCA9E", // TODO: Replace with actual service and characteristic IDs
          sequence,
        );
      }
    } catch (error) {
      console.error(error);
    }
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
