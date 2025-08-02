import { useCallback, useEffect,  useState } from "react";
import { PermissionsAndroid, Platform } from "react-native";
import RNBluetoothClassic, {
  BluetoothEventSubscription,
} from 'react-native-bluetooth-classic';
import BluetoothDevice from 'react-native-bluetooth-classic/lib/BluetoothDevice';

import { usePostHog } from "posthog-react-native";

interface UseBluetoothClassicReturn {
  // State
  isBluetoothEnabled: boolean;
  pairedDevices: BluetoothDevice[];
  connectedDevice: BluetoothDevice | null;
  isConnecting: boolean;
  isScanning: boolean;
  error: string | null;

  // Actions
  requestPermissions: () => Promise<boolean>;
  enableBluetooth: () => Promise<boolean>;
  getPairedDevices: () => Promise<void>;
  connectToDevice: (device: BluetoothDevice) => Promise<boolean>;
  disconnectFromDevice: () => Promise<void>;
  sendData: (data: string) => Promise<boolean>;
  clearError: () => void;
}

export function useBle(): UseBluetoothClassicReturn {
  const [isBluetoothEnabled, setIsBluetoothEnabled] = useState<boolean>(false);
  const [pairedDevices, setPairedDevices] = useState<BluetoothDevice[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<BluetoothDevice | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const posthog = usePostHog()

  // Event subscriptions
  const [bluetoothStateSubscription, setBluetoothStateSubscription] =
    useState<BluetoothEventSubscription | null>(null);
  const [deviceConnectedSubscription, setDeviceConnectedSubscription] =
    useState<BluetoothEventSubscription | null>(null);
  const [deviceDisconnectedSubscription, setDeviceDisconnectedSubscription] =
    useState<BluetoothEventSubscription | null>(null);

  // Request Bluetooth permissions (Android)
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'android') {
        const apiLevel = Platform.Version;

        if (apiLevel >= 31) {
          // Android 12+ permissions
          const permissions = [
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          ];

          const granted = await PermissionsAndroid.requestMultiple(permissions);

          return Object.values(granted).every(
            permission => permission === PermissionsAndroid.RESULTS.GRANTED
          );
        } else {
          // Android < 12 permissions
          const permissions = [
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          ];

          const granted = await PermissionsAndroid.requestMultiple(permissions);

          return Object.values(granted).every(
            permission => permission === PermissionsAndroid.RESULTS.GRANTED
          );
        }
      }
      return true; // iOS doesn't require explicit permissions for Bluetooth Classic
    } catch (err) {
      setError(`Permission request failed: ${err}`);
      posthog.capture('permission_request_failed', {
        error: err as string,
      });
      return false;
    }
  }, []);

  // Enable Bluetooth
  const enableBluetooth = useCallback(async (): Promise<boolean> => {
    try {
      const enabled = await RNBluetoothClassic.requestBluetoothEnabled();
      setIsBluetoothEnabled(enabled);
      return enabled;
    } catch (err) {
      setError(`Failed to enable Bluetooth: ${err}`);
      posthog.capture('bluetooth_enable_failed', {
        error: err as string,
      });
      return false;
    }
  }, []);

  // Check Bluetooth state
  const checkBluetoothState = useCallback(async () => {
    try {
      const enabled = await RNBluetoothClassic.isBluetoothEnabled();
      setIsBluetoothEnabled(enabled);
    } catch (err) {
      setError(`Failed to check Bluetooth state: ${err}`);
      posthog.capture('bluetooth_state_check_failed', {
        error: err as string,
      });
    }
  }, []);

  // Get paired devices
  const getPairedDevices = useCallback(async (): Promise<void> => {
    try {
      setIsScanning(true);
      setError(null);

      const devices = await RNBluetoothClassic.getBondedDevices();
      setPairedDevices(devices);
      posthog.capture('paired_devices_fetched', {
        devices: devices.length,
      });
    } catch (err) {
      setError(`Failed to get paired devices: ${err}`);
      posthog.capture('paired_devices_fetch_failed', {
        error: err as string,
      });
    } finally {
      setIsScanning(false);
    }
  }, []);

  // Connect to device
  const connectToDevice = useCallback(async (
    device: BluetoothDevice
  ): Promise<boolean> => {
    try {
      setIsConnecting(true);
      setError(null);

      console.log('Attempting to connect to device:', device.name, device.address);

      // Disconnect from current device if connected
      if (connectedDevice) {
        await disconnectFromDevice();
      }

      // Arduino-compatible connection settings
      const connectionConfig = {
        connectorType: 'rfcomm',
        DELIMITER: '\n',
        DEVICE_CHARSET: Platform.OS === 'ios' ? 1536 : 'utf-8',
        // Arduino HC-05/HC-06 compatible settings
        CONNECTION_TIMEOUT: 15000, // Increased timeout for Arduino modules
        READ_TIMEOUT: 2000,        // Increased read timeout
        WRITE_TIMEOUT: 2000,       // Increased write timeout
        // Additional Arduino-specific settings
        SECURE_SOCKET: false,      // Most Arduino modules don't use secure sockets
        UUID: '00001101-0000-1000-8000-00805F9B34FB', // Standard SPP UUID
      };

      console.log('Connection config:', connectionConfig);

      const connected = await device.connect(connectionConfig);

      if (connected) {
        console.log('Successfully connected to device:', device.name);
        setConnectedDevice(device);

        // Test the connection by sending a simple command
        try {
          await device.write('AT\n');
          console.log('Connection test successful');
        } catch (testErr) {
          console.log('Connection test failed, but device is connected:', testErr);
          posthog.capture('connection_test_failed', {
            error: testErr as string,
            deviceName: device.name,
            deviceAddress: device.address,
          });
        }

        return true;
      } else {
        setError('Failed to connect to device - connection returned false');
        posthog.capture('connection_failed', {
          error: 'Failed to connect to device - connection returned false',
          deviceName: device.name,
          deviceAddress: device.address,
        });
        return false;
      }
    } catch (err) {
      const errorMsg = `Connection failed: ${err}`;
      console.error(errorMsg);
      setError(errorMsg);
      posthog.capture('connection_failed', {
        error: err as string,
        deviceName: device.name,
        deviceAddress: device.address,
      });
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, [connectedDevice]);

  // Disconnect from device
  const disconnectFromDevice = useCallback(async (): Promise<void> => {
    try {
      if (connectedDevice) {
        await connectedDevice.disconnect();
        setConnectedDevice(null);
      }
    } catch (err) {
      setError(`Disconnection failed: ${err}`);
      posthog.capture('disconnection_failed', {
        error: err as string,
      });
    }
  }, [connectedDevice]);

  // Send data to connected device
  const sendData = useCallback(async (data: string): Promise<boolean> => {
    try {
      if (!connectedDevice) {
        setError('No device connected');
        posthog.capture('no_device_connected', {
          error: 'No device connected',
        });
        return false;
      }

      const isConnected = await connectedDevice.isConnected();
      if (!isConnected) {
        setError('Device is not connected');
        setConnectedDevice(null);
        posthog.capture('device_not_connected', {
          error: 'Device is not connected',
        });
        return false;
      }

      // Format data for Arduino - ensure proper line ending
      let formattedData = data;
      if (!data.endsWith('\n')) {
        formattedData = data + '\n';
      }

      console.log('Sending data to Arduino:', JSON.stringify(formattedData));
      console.log('Raw data length:', formattedData.length);

      // Send data with retry logic for Arduino modules
      let retries = 3;
      let lastError;

      while (retries > 0) {
        try {
          await connectedDevice.write(formattedData);
          console.log('Data sent successfully to Arduino');
          return true;
        } catch (writeErr) {
          lastError = writeErr;
          console.log(`Write attempt ${4 - retries} failed:`, writeErr);
          retries--;
          posthog.capture('send_data_failed', {
            error: writeErr as string,
            dataLength: data.length,
          });

          if (retries > 0) {
            // Wait a bit before retrying
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      }

      // All retries failed
      throw lastError;

    } catch (err) {
      const errorMsg = `Failed to send data: ${err}`;
      setError(errorMsg);
      console.error('Send data error:', err);
      posthog.capture('send_data_failed', {
        error: err as string,
        dataLength: data.length,
      });
      return false;
    }
  }, [connectedDevice]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Setup event listeners
  useEffect(() => {
    const setupEventListeners = async () => {
      try {
        // Bluetooth state change listener
        const stateSubscription = RNBluetoothClassic.onBluetoothEnabled(
          (event) => {
            setIsBluetoothEnabled(event.enabled);
            if (!event.enabled) {
              setConnectedDevice(null);
              setPairedDevices([]);
            }
          }
        );
        setBluetoothStateSubscription(stateSubscription);

        // Device connected listener
        const connectedSubscription = RNBluetoothClassic.onDeviceConnected(
          (event) => {
            // Convert BluetoothNativeDevice to BluetoothDevice
            const device = new BluetoothDevice(event.device, RNBluetoothClassic);
            setConnectedDevice(device);
          }
        );
        setDeviceConnectedSubscription(connectedSubscription);

        // Device disconnected listener
        const disconnectedSubscription = RNBluetoothClassic.onDeviceDisconnected(
          (event) => {
            if (connectedDevice?.address === event.device.address) {
              setConnectedDevice(null);
            }
          }
        );
        setDeviceDisconnectedSubscription(disconnectedSubscription);



        // Initial Bluetooth state check
        await checkBluetoothState();
      } catch (err) {
        setError(`Failed to setup event listeners: ${err}`);
        posthog.capture('setup_event_listeners_failed', {
          error: err as string,
        });
      }
    };

    setupEventListeners();

    // Cleanup function
    return () => {
      bluetoothStateSubscription?.remove();
      deviceConnectedSubscription?.remove();
      deviceDisconnectedSubscription?.remove();
    };
  }, []);

  // Auto-disconnect on unmount
  useEffect(() => {
    return () => {
      if (connectedDevice) {
        connectedDevice.disconnect().catch(console.error);
      }
    };
  }, [connectedDevice]);

  return {
    // State
    isBluetoothEnabled,
    pairedDevices,
    connectedDevice,
    isConnecting,
    isScanning,
    error,

    // Actions
    requestPermissions,
    enableBluetooth,
    getPairedDevices,
    connectToDevice,
    disconnectFromDevice,
    sendData,
    clearError,
  };
}
