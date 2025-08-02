import { Button, ButtonText } from "@/components/ui/button";
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
} from "@/components/ui/form-control";
import { Heading } from "@/components/ui/heading";
import { Input, InputField } from "@/components/ui/input";
import { VStack } from "@/components/ui/vstack";
import { useEffect, useState } from "react";
import { router } from "expo-router";
import { useCurrentUserStore } from "@/store";

export default function LoginScreen() {
  const [user, setUser] = useState("");
  const [isInvalid, setIsInvalid] = useState(false);
  const currentUserStore = useCurrentUserStore();

  async function handleSubmit() {
    if (!user) {
      setIsInvalid(true);

      return;
    }

    try {
      currentUserStore.setCurrentUser(user);

      router.push("/bluetooth");
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    if (currentUserStore.currentUser) {
      router.replace("/bluetooth");
    }
  }, [currentUserStore.currentUser]);

  return (
    <VStack space="2xl" className="flex-1 justify-center bg-background-0 px-5">
      <Heading size="3xl">Login</Heading>

      <FormControl isInvalid={isInvalid}>
        <FormControlLabel>
          <FormControlLabelText>Nome</FormControlLabelText>
        </FormControlLabel>
        <Input size="lg" className="my-1">
          <InputField
            placeholder="John Doe"
            value={user}
            onChangeText={(text) => setUser(text)}
          />
        </Input>
      </FormControl>

      <Button className="" size="lg" onPress={handleSubmit}>
        <ButtonText>Entrar</ButtonText>
      </Button>
    </VStack>
  );
}
