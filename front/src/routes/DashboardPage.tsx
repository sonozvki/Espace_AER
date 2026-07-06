import { useMemo } from "react";
import {
  Stack,
  Group,
  Title,
  Text,
  Paper,
  Badge,
  Box,
  Loader,
  Center,
  ThemeIcon,
  SimpleGrid,
  Divider,
} from "@mantine/core";
import {
  IconShield,
  IconCheckbox,
  IconCalendarEvent,
  IconUserOff,
} from "@tabler/icons-react";
import { useAuth } from "@/hooks/useAuth";
import { useGuards } from "@/features/guards/hooks";
import { useAbsences } from "@/features/absences/hooks";
import { useActionItems } from "@/features/action-items/hooks";
import { EpitechPanel } from "@/features/epitech/components/EpitechPanel";
import { STATUS_COLORS, STATUS_LABELS } from "@/features/action-items/types";
import type { Guard } from "@/features/guards/types";
import type { Absence } from "@/features/absences/types";
import type { ActionItem } from "@/features/action-items/types";

const DAYS_FR = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const MONTHS_FR = [
  "janv.", "févr.", "mars", "avr.", "mai", "juin",
  "juil.", "août", "sept.", "oct.", "nov.", "déc.",
];

function formatGuardDate(iso: string) {
  const d = new Date(iso);
  return `${DAYS_FR[d.getDay()]} ${d.getDate()} ${MONTHS_FR[d.getMonth()]}`;
}

function getWeekBounds() {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { monday, sunday };
}

function isThisWeek(iso: string) {
  const { monday, sunday } = getWeekBounds();
  const d = new Date(iso);
  return d >= monday && d <= sunday;
}

function isUpcoming(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const limit = new Date(now);
  limit.setDate(now.getDate() + 30);
  return d >= now && d <= limit;
}

function GuardCard({ guard }: { guard: Guard }) {
  const d = new Date(guard.date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isToday = d.getTime() === today.getTime();

  return (
    <Paper
      p="sm"
      withBorder
      style={{
        borderColor: isToday
          ? "var(--mantine-color-epitech-4)"
          : "var(--epi-border)",
        borderLeftWidth: isToday ? 3 : 1,
      }}
    >
      <Group gap="sm">
        <ThemeIcon
          size="md"
          variant="light"
          color={isToday ? "epitech" : "gray"}
        >
          <IconShield size={14} />
        </ThemeIcon>
        <Stack gap={0}>
          <Text size="sm" fw={isToday ? 700 : 500}>
            {formatGuardDate(guard.date)}
            {isToday && (
              <Badge size="xs" color="epitech" variant="filled" ml="xs">
                Aujourd'hui
              </Badge>
            )}
          </Text>
        </Stack>
      </Group>
    </Paper>
  );
}

function formatAbsenceDate(iso: string) {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${d.getFullYear()}`;
}

function AbsenceRow({ absence }: { absence: Absence }) {
  const d = new Date(absence.date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isToday = d.getTime() === today.getTime();

  return (
    <Paper
      p="sm"
      withBorder
      style={{
        borderColor: isToday ? "var(--mantine-color-red-5)" : "var(--epi-border)",
        borderLeftWidth: isToday ? 3 : 1,
      }}
    >
      <Group gap="sm">
        <ThemeIcon size="md" variant="light" color="red">
          <IconUserOff size={14} />
        </ThemeIcon>
        <Text size="sm" fw={isToday ? 700 : 500}>
          {absence.user.name.split(" ")[0]} absent : {formatAbsenceDate(absence.date)}
          {isToday && (
            <Badge size="xs" color="red" variant="filled" ml="xs">
              Aujourd'hui
            </Badge>
          )}
        </Text>
      </Group>
    </Paper>
  );
}

function ActionRow({ item }: { item: ActionItem }) {
  return (
    <Box
      p="xs"
      style={{
        borderRadius: 6,
        backgroundColor: "var(--mantine-color-dark-5)",
        borderLeft: `2px solid var(--mantine-color-${STATUS_COLORS[item.status]}-5)`,
      }}
    >
      <Group justify="space-between" wrap="nowrap">
        <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
          <Text size="sm" truncate>
            {item.content}
          </Text>
          <Text size="xs" c="dimmed" truncate>
            {item.memo.title}
          </Text>
        </Stack>
        <Badge size="xs" color={STATUS_COLORS[item.status]} variant="light" style={{ flexShrink: 0 }}>
          {STATUS_LABELS[item.status]}
        </Badge>
      </Group>
    </Box>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const { data: guards, isLoading: guardsLoading } = useGuards();
  const { data: absences, isLoading: absencesLoading } = useAbsences();
  const { data: actionItems, isLoading: actionsLoading } = useActionItems();

  const upcomingAbsences = useMemo<Absence[]>(() => {
    if (!absences) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return absences
      .filter((a) => new Date(a.date) >= today)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 8);
  }, [absences]);

  const myUpcomingGuards = useMemo<Guard[]>(() => {
    if (!guards || !user) return [];
    return guards
      .filter((g) => g.aerId === user.id && isUpcoming(g.date))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 8);
  }, [guards, user]);

  const myWeekActions = useMemo<ActionItem[]>(() => {
    if (!actionItems || !user) return [];
    return actionItems.filter(
      (a) =>
        a.assigneeId === user.id &&
        a.status !== "DONE" &&
        a.status !== "CANCELLED" &&
        (a.deadline ? isThisWeek(a.deadline) : isThisWeek(a.createdAt))
    );
  }, [actionItems, user]);

  const allMyPendingActions = useMemo<ActionItem[]>(() => {
    if (!actionItems || !user) return [];
    return actionItems.filter(
      (a) =>
        a.assigneeId === user.id &&
        (a.status === "PENDING" || a.status === "IN_PROGRESS")
    );
  }, [actionItems, user]);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";

  return (
    <Stack gap="xl">
      {/* En-tête */}
      <Box
        p="xl"
        style={{
          background: "linear-gradient(135deg, var(--mantine-color-epitech-9) 0%, var(--mantine-color-dark-6) 100%)",
          borderRadius: 12,
          border: "1px solid var(--epi-border)",
        }}
      >
        <Text size="sm" c="dimmed" tt="uppercase" style={{ letterSpacing: "0.1em" }}>
          Espace AER
        </Text>
        <Title order={1} ff="Anton, sans-serif" mt={4}>
          {greeting}, {user?.name?.split(" ")[0] ?? ":"}
        </Title>
        <Text c="dimmed" mt={4}>
          {new Date().toLocaleDateString("fr-FR", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </Text>

        {/* Stats rapides */}
        <SimpleGrid cols={{ base: 2, sm: 3 }} mt="lg" spacing="sm">
          <StatChip
            icon={<IconShield size={16} />}
            label="Gardes à venir"
            value={guardsLoading ? "…" : String(myUpcomingGuards.length)}
          />
          <StatChip
            icon={<IconCheckbox size={16} />}
            label="Actions cette semaine"
            value={actionsLoading ? "…" : String(myWeekActions.length)}
          />
          <StatChip
            icon={<IconCalendarEvent size={16} />}
            label="Actions en cours"
            value={actionsLoading ? "…" : String(allMyPendingActions.length)}
          />
        </SimpleGrid>
      </Box>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        {/* Gardes à venir */}
        <Paper p="md" withBorder style={{ borderColor: "var(--epi-border)" }}>
          <Group mb="md">
            <ThemeIcon variant="light" color="epitech">
              <IconShield size={16} />
            </ThemeIcon>
            <Text fw={700} ff="Anton, sans-serif" size="lg">
              Mes prochaines gardes
            </Text>
          </Group>
          <Divider mb="md" />
          {guardsLoading ? (
            <Center py="md">
              <Loader size="sm" />
            </Center>
          ) : myUpcomingGuards.length === 0 ? (
            <Text size="sm" c="dimmed" ta="center" py="md">
              Aucune garde à venir (30 jours)
            </Text>
          ) : (
            <Stack gap="xs">
              {myUpcomingGuards.map((g) => (
                <GuardCard key={g.id} guard={g} />
              ))}
            </Stack>
          )}
        </Paper>

        {/* Actions de la semaine */}
        <Paper p="md" withBorder style={{ borderColor: "var(--epi-border)" }}>
          <Group mb="md">
            <ThemeIcon variant="light" color="epitech">
              <IconCheckbox size={16} />
            </ThemeIcon>
            <Text fw={700} ff="Anton, sans-serif" size="lg">
              Mes actions cette semaine
            </Text>
          </Group>
          <Divider mb="md" />
          {actionsLoading ? (
            <Center py="md">
              <Loader size="sm" />
            </Center>
          ) : myWeekActions.length === 0 ? (
            <Stack gap="xs">
              <Text size="sm" c="dimmed" ta="center" py="md">
                Aucune action assignée cette semaine
              </Text>
              {allMyPendingActions.length > 0 && (
                <>
                  <Divider label="Toutes mes actions en cours" labelPosition="center" />
                  {allMyPendingActions.slice(0, 5).map((a) => (
                    <ActionRow key={a.id} item={a} />
                  ))}
                </>
              )}
            </Stack>
          ) : (
            <Stack gap="xs">
              {myWeekActions.map((a) => (
                <ActionRow key={a.id} item={a} />
              ))}
            </Stack>
          )}
        </Paper>
        {/* AER absents */}
        <Paper p="md" withBorder style={{ borderColor: "var(--epi-border)" }}>
          <Group mb="md">
            <ThemeIcon variant="light" color="red">
              <IconUserOff size={16} />
            </ThemeIcon>
            <Text fw={700} ff="Anton, sans-serif" size="lg">
              AER absents
            </Text>
          </Group>
          <Divider mb="md" />
          {absencesLoading ? (
            <Center py="md">
              <Loader size="sm" />
            </Center>
          ) : upcomingAbsences.length === 0 ? (
            <Text size="sm" c="dimmed" ta="center" py="md">
              Aucune absence déclarée
            </Text>
          ) : (
            <Stack gap="xs">
              {upcomingAbsences.map((a) => (
                <AbsenceRow key={a.id} absence={a} />
              ))}
            </Stack>
          )}
        </Paper>
      </SimpleGrid>

      {/* Activités Epitech */}
      <EpitechPanel hasToken={user?.hasEpitechToken ?? false} />
    </Stack>
  );
}

function StatChip({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Box
      p="sm"
      style={{
        background: "rgba(255,255,255,0.05)",
        borderRadius: 8,
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <Group gap="xs" mb={4}>
        {icon}
        <Text size="xs" c="dimmed">
          {label}
        </Text>
      </Group>
      <Text size="xl" fw={700} ff="Anton, sans-serif">
        {value}
      </Text>
    </Box>
  );
}
