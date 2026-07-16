import { Stack, Title, Text, Button } from "@mantine/core";
import { useNavigate } from "react-router-dom";

export function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <Stack align="center" justify="center" h="70vh" gap="md">
      <Title order={1} ff="Anton, sans-serif" style={{ fontSize: "6rem", lineHeight: 1 }}>
        :)
      </Title>
      <Text c="dimmed" size="lg">Petit coquin t'essaies d'aller où?</Text>
      <Button variant="light" onClick={() => navigate("/dashboard")}>
        Aller casse toi
      </Button>
    </Stack>
  );
}
