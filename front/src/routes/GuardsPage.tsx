import { useState, useMemo } from "react";
import { Stack, Group, Title, Button, Text, ActionIcon, Loader, Center, Alert } from "@mantine/core";
import { IconChevronLeft, IconChevronRight, IconAlertCircle } from "@tabler/icons-react";
import { useGuards, useGenerateGuards } from "@/features/guards/hooks";
import { GuardCalendar } from "@/features/guards/components/GuardCalendar";
import { useAuth } from "@/hooks/useAuth";
import type { Guard } from "@/features/guards/types";

const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

export function GuardsPage() {
  const today = useMemo(() => new Date(), []);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const { data: guards, isLoading } = useGuards();
  const generateGuards = useGenerateGuards();
  const { user } = useAuth();

  const guardsByDate = useMemo(() => {
    const map = new Map<string, Guard>();
    for (const g of guards ?? []) {
      map.set(g.date.substring(0, 10), g);
    }
    return map;
  }, [guards]);

  const hasCurrentYear = (guards ?? []).some(
    (g) => new Date(g.date).getFullYear() === year
  );

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  }

  function nextMonth() {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  }

  return (
    <Stack gap="md">
      <Group justify="space-between" wrap="nowrap">
        <Title order={2} ff="Anton, sans-serif">
          Planning des gardes
        </Title>
        {user?.role === "ADMIN" && (
          <Button
            size="sm"
            variant="light"
            loading={generateGuards.isPending}
            onClick={() => generateGuards.mutate(year)}
          >
            Générer {year}
          </Button>
        )}
      </Group>

      {!isLoading && !hasCurrentYear && (
        <Alert icon={<IconAlertCircle size={16} />} color="orange" variant="light">
          Aucun planning généré pour {year}.{" "}
          {user?.role === "ADMIN"
            ? "Cliquez sur « Générer » pour créer le planning de l'année."
            : "Demandez à un admin de générer le planning."}
        </Alert>
      )}

      <Group gap="xs">
        <ActionIcon variant="subtle" onClick={prevMonth}>
          <IconChevronLeft size={18} />
        </ActionIcon>
        <Text fw={600} size="lg" w={200} ta="center">
          {MONTHS[month]} {year}
        </Text>
        <ActionIcon variant="subtle" onClick={nextMonth}>
          <IconChevronRight size={18} />
        </ActionIcon>
      </Group>

      {isLoading ? (
        <Center py="xl">
          <Loader />
        </Center>
      ) : (
        <GuardCalendar
          year={year}
          month={month}
          guardsByDate={guardsByDate}
          currentUser={user}
        />
      )}
    </Stack>
  );
}
