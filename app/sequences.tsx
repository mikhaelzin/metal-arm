import 'react-native-get-random-values';
import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
} from "@/components/ui/actionsheet";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { Divider } from "@/components/ui/divider";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { AddIcon, TrashIcon } from "@/components/ui/icon";
import {
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
} from "@/components/ui/slider";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useBle } from "@/components/use-ble";
import { useState } from "react";
import { v4 as uuidv4 } from 'uuid';

type Movement = {
  movement: string;
  rotation: number;
}

type Sequence = {
  id: string;
  time: number;
  movements: Array<Movement>;
}

export default function SequencesScreen() {
  const [showMovementActionSheet, setShowMovementActionSheet] = useState(false);
  const [showTimeActionSheet, setShowTimeActionSheet] = useState(false);
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [activeSequenceId, setActiveSequenceId] = useState<string | null>(null);
  const { sendData, connectedDevice } = useBle();

  function handleSendSequence() {
    sendData(formatSequence());
  }

  function handleMovementSelected(movement: Movement) {
    setSequences((prevState) => prevState.map((sequence) => {
      if (sequence.id === activeSequenceId) {
        return { ...sequence, movements: [...sequence.movements, movement] };
      }

      return sequence;
    }));

    setShowMovementActionSheet(false);
  }

  function handleAddSequence() {
    if (sequences.length === 5) {
      return;
    }

    setShowTimeActionSheet(true);

    const sequenceId = uuidv4();
    setSequences((prevState) => [...prevState, { id: sequenceId, time: 0, movements: [] }]);
    setActiveSequenceId(sequenceId);
  }

  function handleTimeSelected(time: number) {
    setSequences((prevState) => prevState.map((sequence) => {
      if (sequence.id === activeSequenceId) {
        return { ...sequence, time };
      }

      return sequence;
    }));

    setShowTimeActionSheet(false);
  }

  function handleRemoveSequence(sequenceId: string) {
    setSequences((prevState) => prevState.filter((sequence) => sequence.id !== sequenceId));
  }

  function handleAddMovement(sequenceId: string) {
    setActiveSequenceId(sequenceId);
    setShowMovementActionSheet(true);
  }

  function formatSequence() {
    return sequences.reduce((acc, sequence) => {
      const prefix = `T${sequence.time}`;
      const movements = sequence.movements.map((movement) => `${movement.movement}${movement.rotation}`).join("-");

      acc.push(`${prefix}${movements}`);

      return acc;
    }, [] as string[]).join("-");
  }

  return (
    <VStack className="bg-background-0 flex-1 px-5 py-4">
      <Heading>Sequências no dispositivo {connectedDevice?.name ?? ""}</Heading>
      <Text>Selecione no máximo 5 sequencias</Text>

      <Divider className="my-4" />

      <Button onPress={handleAddSequence} action="positive">
        <ButtonText>Adicionar Nova Sequência</ButtonText>
      </Button>


      <MovementRotation
        isActionSheetOpen={showMovementActionSheet}
        onSelectMovement={handleMovementSelected}
      />

      <TimeInputActionSheet
        isActionSheetOpen={showTimeActionSheet}
        onTimeSelected={handleTimeSelected}
      />

      {!!sequences.length && (
        <VStack space="2xl" className="mt-4">
          <Heading>Sequências</Heading>

          {sequences.map((sequence, index) => (
            <VStack key={sequence.id}>
              <HStack key={sequence.id} className="justify-between items-center">
                <VStack key={sequence.id}>
                  <Text>Sequência {index + 1}</Text>
                  <Text>Tempo: {sequence.time}ms</Text>

                </VStack>


                <HStack space="sm">
                  <Button onPress={() => handleAddMovement(sequence.id)} action="positive" className="rounded-full p-3.5">
                    <ButtonIcon as={AddIcon} />
                  </Button>

                  <Button onPress={() => handleRemoveSequence(sequence.id)} action="negative" className="rounded-full p-3.5">
                    <ButtonIcon as={TrashIcon} />
                  </Button>
                </HStack>
              </HStack>

              <Text>Movimentos: {sequence.movements.map((movement) => `${movement.movement}-${movement.rotation}°`).join(", ")}</Text>
            </VStack>
          ))}
        </VStack>
      )}

      <Divider className="my-4" />

      {!!sequences.length && (
        <HStack space="2xl" className="justify-between items-center">
          <Text>Sequencia atual: {formatSequence()}</Text>
        </HStack>
      )}

      <Button
        action="positive"
        className="disabled:opacity-80 mt-auto pb-2"
        disabled={!sequences.length || sequences.some((sequence) => sequence.movements.length === 0)}
        onPress={handleSendSequence}
      >
        <ButtonText>Enviar sequência para dispositivo</ButtonText>
      </Button>
    </VStack>
  );
}

type MovementListProps = {
  onMovementSelected: (movement: string) => void;
  activeMovement: string;
};

const movementOptions = [
  "J1",
  "J2",
  "J3",
  "J4",
  "J5",
  "J6"
];

export function MovementList({ onMovementSelected, activeMovement }: MovementListProps) {
  return (
    <VStack space="2xl" className="mt-4">
      <Heading>Selecione um movimento</Heading>

      {Array.from(
        { length: Math.ceil(movementOptions.length / 5) },
        (_, index) => (
          <HStack key={index} space="sm" className="justify-between">
            {movementOptions.slice(index * 3, index * 3 + 3).map((movement) => (
              <Button
                key={movement}
                variant={activeMovement === movement ? "solid" : "outline"}
                onPress={() => onMovementSelected(movement)}
              >
                <ButtonText>{movement}</ButtonText>
              </Button>
            ))}
          </HStack>
        ),
      )}
    </VStack>
  );
}

type MovementRotationProps = {
  isActionSheetOpen: boolean;
  onSelectMovement: (movement: Movement) => void;
};

function MovementRotation({
  isActionSheetOpen,
  onSelectMovement,
}: MovementRotationProps) {
  const [rotation, setRotation] = useState(25);
  const [movement, setMovement] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  function handleClose() {
    if (!movement) {
      setError("Selecione um movimento");
      return;
    }

    onSelectMovement({ movement, rotation });
  }

  function handleSliderChange(value: number) {
    setRotation(value);
  }

  function handleMovementSelected(movement: string) {
    setMovement(movement);
    setError(null);
  }

  return (
    <Actionsheet isOpen={isActionSheetOpen} onClose={handleClose}>
      <ActionsheetBackdrop />
      <ActionsheetContent>
        <ActionsheetDragIndicatorWrapper>
          <ActionsheetDragIndicator />
        </ActionsheetDragIndicatorWrapper>


        <VStack className="w-full pt-5" space="4xl">
          <MovementList onMovementSelected={handleMovementSelected} activeMovement={movement} />

          <Divider className="my-4" />

          <HStack space="2xl" className="justify-between items-center">
            <Heading>Selecione uma Rotação</Heading>
            <Text>Rotação atual: {rotation}°</Text>
          </HStack>
          <Slider
            minValue={0}
            maxValue={120}
            onChange={handleSliderChange}
            value={rotation}
            defaultValue={rotation}
            step={5}
          >
            <SliderTrack>
              <SliderFilledTrack />
            </SliderTrack>
            <SliderThumb />
          </Slider>

          <Button action="positive" onPress={handleClose}>
            <ButtonText>Confirmar</ButtonText>
          </Button>

          {!!error && <Text className="text-red-500">{error}</Text>}
        </VStack>
      </ActionsheetContent>
    </Actionsheet>
  );
}

type TimeInputProps = {
  onTimeSelected: (time: number) => void;
  isActionSheetOpen: boolean;
};

function TimeInputActionSheet({ onTimeSelected, isActionSheetOpen }: TimeInputProps) {
  const [time, setTime] = useState(250);

  function handleSliderChange(value: number) {
    setTime(value);
  }

  function handleClose() {
    onTimeSelected(time);
  }

  return (
    <Actionsheet isOpen={isActionSheetOpen} onClose={handleClose}>
      <ActionsheetBackdrop />
      <ActionsheetContent>
        <ActionsheetDragIndicatorWrapper>
          <ActionsheetDragIndicator />
        </ActionsheetDragIndicatorWrapper>

        <VStack className="w-full pt-5" space="4xl">

          <VStack space="2xl" className="justify-between items-center">
            <Heading>Selecione um tempo em milissegundos</Heading>
            <Text>Tempo atual: {time}ms</Text>
          </VStack>
          <Slider
            minValue={500}
            maxValue={3000}
            onChange={handleSliderChange}
            value={time}
            defaultValue={time}
            step={50}
          >
            <SliderTrack>
              <SliderFilledTrack />
            </SliderTrack>
            <SliderThumb />
          </Slider>

          <Button action="positive" onPress={handleClose}>
            <ButtonText>Confirmar</ButtonText>
          </Button>

        </VStack>
      </ActionsheetContent>
    </Actionsheet>
  );
}
