import { useState, useMemo, useEffect } from "react";
import { Stack, Group, Title, Button, Text, ActionIcon, Loader, Center, Alert } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
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
  const [weekIndex, setWeekIndex] = useState(0);
  const isMobile = !useMediaQuery("(min-width: 768px)");

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
    setWeekIndex(0); // reset week when changing month
  }

  function nextMonth() {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
    setWeekIndex(0); // reset week when changing month
  }

  const weeks = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const weeks: (Date | null)[][] = [];
    let week: (Date | null)[] = [];

    // Pad start
    const firstCol = firstDay.getDay() === 0 ? 5 : firstDay.getDay() - 1;
    for (let i = 0; i < firstCol; i++) week.push(null);

    const d = new Date(firstDay);
    while (d <= lastDay) {
      const col = d.getDay() === 0 ? -1 : d.getDay() - 1;
      if (col === -1) {
        while (week.length < 6) week.push(null);
        if (week.some((c) => c !== null)) weeks.push(week);
        week = [];
        d.setDate(d.getDate() + 1);
        continue;
      }
      week.push(new Date(d));
      if (col === 5) {
        weeks.push(week);
        week = [];
      }
      d.setDate(d.getDate() + 1);
    }
    if (week.length > 0) {
      while (week.length < 6) week.push(null);
      weeks.push(week);
    }
    return weeks;
  }, [year, month]);

  // Align weekIndex to current week if we're viewing the current month
  useEffect(() => {
    if (year === today.getFullYear() && month === today.getMonth()) {
      const currentWeekIndex = weeks.findIndex((week) =>
        week.some((day) => day && day.toDateString() === today.toDateString())
      );
      if (currentWeekIndex !== -1) {
        setWeekIndex(currentWeekIndex);
      }
    }
  }, [year, month, weeks, today]);

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

      {isMobile ? (
        <Group gap="xs" justify="center">
          <ActionIcon variant="subtle" onClick={() => {
            if (weekIndex > 0) setWeekIndex(weekIndex - 1);
            else prevMonth();
          }} disabled={weekIndex === 0 && month === today.getMonth() && year === today.getFullYear()}>
            <IconChevronLeft size={18} />
          </ActionIcon>
          <Text fw={600} size="sm" maw={200} ta="center">
            Semaine {weekIndex + 1}
          </Text>
          <ActionIcon variant="subtle" onClick={() => {
            if (weekIndex < weeks.length - 1) setWeekIndex(weekIndex + 1);
            else nextMonth();
          }} disabled={weekIndex === weeks.length - 1 && month === 11 && year === today.getFullYear()}>
            <IconChevronRight size={18} />
          </ActionIcon>
        </Group>
      ) : (
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
      )}

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
          isMobile={isMobile}
          weekIndex={isMobile ? weekIndex : undefined}
          onWeekChange={isMobile ? setWeekIndex : undefined}
        />
      )}
    </Stack>
  );
}
