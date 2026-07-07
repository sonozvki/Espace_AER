import { Center, Button, Text, Stack } from "@mantine/core";
import { BASE_URL } from "@/lib/api";

export function LoginPage() {
  return (
    <Center h="100vh" bg="var(--epi-bg)">
      <Stack align="center" gap="md">
        <Text ff="Anton, sans-serif" size="xl" c="epitech.4">
          Espace AER
        </Text>
        <Button component="a" href={`${BASE_URL}/auth/login`}>
          Se connecter avec Microsoft
        </Button>
      </Stack>
    </Center>
  );
}
