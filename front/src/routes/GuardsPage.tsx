import { useState, useMemo } from "react";
import { Stack, Group, Title, Button, Text, ActionIcon, Loader, Center, Alert } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { IconChevronLeft, IconChevronRight, IconAlertCircle } from "@tabler/icons-react";
import { useGuards, useGenerateGuards } from "@/features/guards/hooks";
import { GuardCalendar, buildWeeks } from "@/features/guards/components/GuardCalendar";
import { useAuth } from "@/hooks/useAuth";
import type { Guard } from "@/features/guards/types";

const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

/** Index de la semaine contenant le jour (local) `date`, 0 si absent du mois. */
function weekIndexOf(weeks: (Date | null)[][], date: Date) {
  const key = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const idx = weeks.findIndex((w) => w.some((day) => day?.getTime() === key));
  return idx === -1 ? 0 : idx;
}

/** "9 – 15 nov." à partir des jours non vides de la semaine */
function weekRangeLabel(week: (Date | null)[] | undefined) {
  const days = (week ?? []).filter((d): d is Date => d !== null);
  if (days.length === 0) return "";
  const fmt = (d: Date, withMonth: boolean) =>
    d.toLocaleDateString("fr-FR", { day: "numeric", ...(withMonth ? { month: "short" } : {}), timeZone: "UTC" });
  const first = days[0]!;
  const last = days[days.length - 1]!;
  if (first.getTime() === last.getTime()) return fmt(first, true);
  return `${fmt(first, first.getUTCMonth() !== last.getUTCMonth())} – ${fmt(last, true)}`;
}

export function GuardsPage() {
  const today = useMemo(() => new Date(), []);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  // Sur mobile, on ouvre directement la semaine en cours
  const [weekIndex, setWeekIndex] = useState(() =>
    weekIndexOf(buildWeeks(today.getFullYear(), today.getMonth()), today)
  );
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

  const weeks = useMemo(() => buildWeeks(year, month), [year, month]);
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();
  const isCurrentWeek = isCurrentMonth && weekIndex === weekIndexOf(weeks, today);

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
    setWeekIndex(0);
  }

  function nextMonth() {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
    setWeekIndex(0);
  }

  function prevWeek() {
    if (weekIndex > 0) return setWeekIndex(weekIndex - 1);
    // Mois précédent, en arrivant sur sa dernière semaine
    const y = month === 0 ? year - 1 : year;
    const m = month === 0 ? 11 : month - 1;
    setYear(y);
    setMonth(m);
    setWeekIndex(buildWeeks(y, m).length - 1);
  }

  function nextWeek() {
    if (weekIndex < weeks.length - 1) return setWeekIndex(weekIndex + 1);
    nextMonth();
  }

  function goToCurrentWeek() {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
    setWeekIndex(weekIndexOf(buildWeeks(today.getFullYear(), today.getMonth()), today));
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

      {isMobile ? (
        <Stack gap={4} align="center">
          <Group gap="xs" justify="center" wrap="nowrap">
            <ActionIcon variant="subtle" onClick={prevWeek} aria-label="Semaine précédente">
              <IconChevronLeft size={18} />
            </ActionIcon>
            <Text fw={600} size="sm" miw={150} ta="center">
              {weekRangeLabel(weeks[weekIndex])} {year !== today.getFullYear() ? year : ""}
            </Text>
            <ActionIcon variant="subtle" onClick={nextWeek} aria-label="Semaine suivante">
              <IconChevronRight size={18} />
            </ActionIcon>
          </Group>
          {!isCurrentWeek && (
            <Button size="compact-xs" variant="subtle" onClick={goToCurrentWeek}>
              Revenir à cette semaine
            </Button>
          )}
        </Stack>
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
