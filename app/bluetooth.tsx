import { FlatList } from "react-native";

import { useBle } from "@/components/use-ble";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
// import { useBleExpoGo } from "@/components/use-ble2";
import { VStack } from "@/components/ui/vstack";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { Box } from "@/components/ui/box";
import { Device } from "react-native-ble-plx";
import { LinkIcon, SearchIcon } from "@/components/ui/icon";
import { HStack } from "@/components/ui/hstack";
import { Divider } from "@/components/ui/divider";
import { router } from "expo-router";
import { useConnectedDeviceStore, useCurrentUserStore } from "@/store";

export default function BluetoothScreen() {
  const {
    requestPermissions,
    scanForPeripherals,
    allDevices,
    connectToDevice,
  } = useBle();
  const connectedDevice = useConnectedDeviceStore(state => state.connectedDevice);
  const currentUser = useCurrentUserStore(state => state.currentUser);

  async function scanDevices() {
    const isPermissionsEnabled = await requestPermissions();

    if (isPermissionsEnabled) {
      scanForPeripherals();
    }
  }

  async function handleItemPress(item: Device) {
    try {
      await connectToDevice(item);

      router.navigate("/sequences");
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <VStack className="bg-background-0 flex-1 px-5 py-4">
      {!!currentUser && (
        <Heading size="2xl">Bem vindo(a), {currentUser}</Heading>
      )}

      <FlatList
        className="mt-4"
        data={allDevices}
        renderItem={({ item }) => (
          <ListItem
            item={item}
            onPress={handleItemPress}
            isConnected={item.id === connectedDevice?.id}
          />
        )}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <Divider className="my-4" />}
        ListEmptyComponent={
          <Text>Pressione o botão para escanear dispositivos</Text>
        }
        ListFooterComponent={<Box className="h-10" />}
      />

      <Button size="lg" className="mt-auto" onPress={scanDevices}>
        <ButtonIcon as={SearchIcon} className="mr-2" />
        <ButtonText>Escanear Dispositivos</ButtonText>
      </Button>
    </VStack>
  );
}

type ListItemProps = {
  item: Device;
  onPress: (item: Device) => Promise<void>;
  isConnected?: boolean;
};

function ListItem({ item, onPress, isConnected = false }: ListItemProps) {
  return (
    <HStack className="justify-between items-center">
      <VStack>
        <Text bold size="lg" underline={isConnected}>
          {item.name ?? "Desconhecido"}
        </Text>
        <Text size="xs">{item.id}</Text>
      </VStack>

      <Button
        onPress={() => onPress(item)}
        action="positive"
        size="lg"
        className="rounded-full p-3.5"
      >
        <ButtonIcon as={LinkIcon} />
      </Button>
    </HStack>
  );
}
