import { FlatList } from "react-native";

import { useBle } from "@/components/use-ble";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { VStack } from "@/components/ui/vstack";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { Box } from "@/components/ui/box";
import { BluetoothDevice } from "react-native-bluetooth-classic";
import { LinkIcon, SearchIcon, AlertCircleIcon } from "@/components/ui/icon";
import { HStack } from "@/components/ui/hstack";
import { Divider } from "@/components/ui/divider";
import { router } from "expo-router";
import { useCurrentUserStore } from "@/store";
import { usePostHog } from "posthog-react-native";

export default function BluetoothScreen() {
  const {
    requestPermissions,
    getPairedDevices,
    connectToDevice,
    pairedDevices,
    connectedDevice,
    isBluetoothEnabled,
    isConnecting,
    error,
    clearError,
  } = useBle();
  const currentUser = useCurrentUserStore(state => state.currentUser);
  const posthog = usePostHog();

  async function scanDevices() {
    const isPermissionsEnabled = await requestPermissions();

    if (isPermissionsEnabled) {
      getPairedDevices();
    }
  }

  async function handleItemPress(item: BluetoothDevice) {
    try {
      console.log('Attempting to connect to:', item.name, item.address);
      const success = await connectToDevice(item);

      if (success) {
        console.log('Connection successful, navigating to sequences');
        router.navigate("/sequences");
      } else {
        console.log('Connection failed');
      }
    } catch (error) {
      console.error('Connection error:', error);
      posthog.capture('connection_error', {
        error: error as string,
      });
    }
  }

  return (
    <VStack className="bg-background-0 flex-1 px-5 py-4">
      {!!currentUser && (
        <Heading size="2xl">Bem vindo(a), {currentUser}</Heading>
      )}

      {/* Debug Information */}
      <Box className="bg-blue-50 p-4 rounded-lg mb-4">
        <Text bold size="sm" className="text-blue-800 mb-2">Debug Info:</Text>
        <Text size="xs" className="text-blue-700">Bluetooth Enabled: {isBluetoothEnabled ? 'Yes' : 'No'}</Text>
        <Text size="xs" className="text-blue-700">Connected Device: {connectedDevice?.name || 'None'}</Text>
        <Text size="xs" className="text-blue-700">Paired Devices: {pairedDevices.length}</Text>
        <Text size="xs" className="text-blue-700">Connecting: {isConnecting ? 'Yes' : 'No'}</Text>
      </Box>

      {/* Error Display */}
      {error && (
        <Box className="bg-red-50 p-4 rounded-lg mb-4 border border-red-200">
          <HStack className="items-center mb-2">
            <AlertCircleIcon className="text-red-500 mr-2" />
            <Text bold size="sm" className="text-red-800">Connection Error</Text>
          </HStack>
          <Text size="xs" className="text-red-700 mb-2">{error}</Text>
          <Button size="sm" variant="outline" onPress={clearError}>
            <ButtonText>Dismiss</ButtonText>
          </Button>
        </Box>
      )}

      <FlatList
        className="mt-4"
        data={pairedDevices}
        renderItem={({ item }) => (
          <ListItem
            item={item}
            onPress={handleItemPress}
            isConnected={item.id === connectedDevice?.id}
            isConnecting={isConnecting}
          />
        )}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <Divider className="my-4" />}
        ListEmptyComponent={
          <Box className="items-center py-8">
            <Text className="text-center mb-2">No paired devices found</Text>
            <Text size="xs" className="text-center text-gray-500">
              Make sure your Arduino Bluetooth module is paired with your device first
            </Text>
          </Box>
        }
        ListFooterComponent={<Box className="h-10" />}
      />

      <Button size="lg" className="mt-auto" onPress={scanDevices} disabled={isConnecting}>
        <ButtonIcon as={SearchIcon} className="mr-2" />
        <ButtonText>
          {isConnecting ? 'Connecting...' : 'Escanear Dispositivos'}
        </ButtonText>
      </Button>
    </VStack>
  );
}

type ListItemProps = {
  item: BluetoothDevice;
  onPress: (item: BluetoothDevice) => Promise<void>;
  isConnected?: boolean;
  isConnecting?: boolean;
};

function ListItem({ item, onPress, isConnected = false, isConnecting = false }: ListItemProps) {
  return (
    <HStack className="justify-between items-center">
      <VStack className="flex-1">
        <Text bold size="lg" underline={isConnected}>
          {item.name ?? "Desconhecido"}
        </Text>
        <Text size="xs" className="text-gray-500">{item.address}</Text>
        <Text size="xs" className="text-gray-400">ID: {item.id}</Text>
        {isConnected && (
          <Text size="xs" className="text-green-600 mt-1">✓ Connected</Text>
        )}
      </VStack>

      <Button
        onPress={() => onPress(item)}
        action={isConnected ? "negative" : "positive"}
        size="lg"
        className="rounded-full p-3.5"
        disabled={isConnecting}
      >
        <ButtonIcon as={LinkIcon} />
      </Button>
    </HStack>
  );
}
