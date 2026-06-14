import { Button, Center, Stack, Text, Title } from "@mantine/core";

export function LoginPage() {
  return (
    <Center h="100vh" bg="dark.7">
      <Stack align="center" gap="xl">
        <Title ff="Anton, sans-serif" c="epitech.4" order={1}>
          Espace AER
        </Title>
        <Text c="dimmed" ta="center" maw={360}>
          Plateforme interne des Assistants Epitech Régionaux. Connexion réservée aux AERs autorisés.
        </Text>
        <Button
          component="a"
          href="/api/auth/login"
          size="md"
          leftSection={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.5 2C6.26 2 2 6.26 2 11.5S6.26 21 11.5 21c2.38 0 4.57-.85 6.27-2.26L20 21l1-1-2.26-2.23C20.15 16.07 21 13.88 21 11.5 21 6.26 16.74 2 11.5 2zm0 2C15.64 4 19 7.36 19 11.5S15.64 19 11.5 19 4 15.64 4 11.5 7.36 4 11.5 4z" />
            </svg>
          }
        >
          Se connecter avec Microsoft
        </Button>
      </Stack>
    </Center>
  );
}
