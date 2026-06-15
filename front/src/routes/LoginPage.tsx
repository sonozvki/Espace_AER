import { Center, Button, Text, Stack } from "@mantine/core";
import { useNavigate } from "react-router-dom";

export function LoginPage() {
  const navigate = useNavigate();

  return (
    <Center h="100vh" bg="dark.7">
      <Stack align="center" gap="md">
        <Text ff="Anton, sans-serif" size="xl" c="epitech.4">
          Espace AER
        </Text>
        <Button onClick={() => navigate("/")}>
          Se connecter avec Microsoft
        </Button>
      </Stack>
    </Center>
  );
}
