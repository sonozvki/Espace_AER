import { useMemo } from "react";
import {
  Stack,
  Group,
  Title,
  Text,
  Paper,
  Badge,
  Box,
  Button,
  Loader,
  Center,
  ThemeIcon,
  SimpleGrid,
  Divider,
} from "@mantine/core";
import {
  IconShield,
  IconUserOff,
  IconArrowRight,
} from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useGuards } from "@/features/guards/hooks";
import { EpitechPanel } from "@/features/epitech/components/EpitechPanel";
import type { Guard, GuardUser } from "@/features/guards/types";

const MONO = '"IBM Plex Mono", ui-monospace, "SF Mono", Menlo, monospace';

function getWeekNumber(d: Date) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

const DAYS_FR = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const MONTHS_FR = [
  "janv.", "févr.", "mars", "avr.", "mai", "juin",
  "juil.", "août", "sept.", "oct.", "nov.", "déc.",
];

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${DAYS_FR[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS_FR[d.getUTCMonth()]}`;
}

function isUpcoming(iso: string, days = 30) {
  const d = new Date(iso);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const limit = new Date(now);
  limit.setDate(now.getDate() + days);
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
        borderColor: isToday ? "var(--mantine-color-epitech-4)" : "var(--epi-border)",
        borderLeftWidth: isToday ? 3 : 1,
      }}
    >
      <Group gap="sm">
        <ThemeIcon size="md" variant="light" color={isToday ? "epitech" : "gray"}>
          <IconShield size={14} />
        </ThemeIcon>
        <Text size="sm" fw={isToday ? 700 : 500}>
          {formatDate(guard.date)}
          {isToday && (
            <Badge size="xs" color="epitech" variant="filled" ml="xs">
              Aujourd'hui
            </Badge>
          )}
        </Text>
      </Group>
    </Paper>
  );
}

function AbsenceRow({ date, user }: { date: string; user: GuardUser }) {
  const d = new Date(date);
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
          {user.name.split(" ")[0]} absent : {formatDate(date)}
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

export function DashboardPage() {
  const { user } = useAuth();
  const { data: guards, isLoading: guardsLoading } = useGuards();

  const upcomingAbsences = useMemo<Array<{ date: string; user: GuardUser }>>(() => {
    if (!guards) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const result: Array<{ date: string; user: GuardUser }> = [];
    for (const g of guards) {
      if (new Date(g.date) < today) continue;
      for (const u of g.absentAers) result.push({ date: g.date, user: u });
    }
    return result
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 8);
  }, [guards]);

  const myUpcomingGuards = useMemo<Guard[]>(() => {
    if (!guards || !user) return [];
    return guards
      .filter((g) => g.guardAerId === user.id && isUpcoming(g.date))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 8);
  }, [guards, user]);

  const freeUpcomingGuards = useMemo<number>(() => {
    if (!guards) return 0;
    return guards.filter((g) => !g.guardAerId && isUpcoming(g.date, 7)).length;
  }, [guards]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";
  const navigate = useNavigate();

  return (
    <Stack gap="xl">
      {/* En-tête */}
      <Box
        p="xl"
        style={{
          background: "var(--epi-blue)",
          borderRadius: 8,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Pixels décoratifs */}
        <Stack
          gap={4}
          aria-hidden="true"
          style={{ pointerEvents: "none", position: "absolute", top: 20, right: 32 }}
        >
          <Group gap={4}>
            {[0.4, 0.2, 0.6].map((o, i) => (
              <Box key={i} style={{ background: "var(--mantine-color-white)", opacity: o, width: 10, height: 10 }} />
            ))}
          </Group>
          <Group gap={4}>
            {[0.2, 0.5].map((o, i) => (
              <Box key={i} style={{ background: "var(--mantine-color-white)", opacity: o, width: 10, height: 10 }} />
            ))}
          </Group>
        </Stack>

        <Text
          size="sm"
          style={{ fontFamily: MONO, color: "rgba(255,255,255,0.75)", letterSpacing: "0.2em" }}
        >
          {"< Espace AER />"}
        </Text>
        <Title
          order={1}
          ff="Anton, sans-serif"
          tt="uppercase"
          c="white"
          mt={8}
          style={{ fontSize: "clamp(2.2rem, 5vw, 3.4rem)", lineHeight: 1 }}
        >
          {greeting}, {user?.name?.split(" ")[0] ?? "AER"}
        </Title>
        <Text mt="sm" size="lg" style={{ color: "rgba(255,255,255,0.92)" }}>
          {new Date().toLocaleDateString("fr-FR", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </Text>

        <Button
          mt="lg"
          variant="white"
          color="dark"
          rightSection={<IconArrowRight size={16} />}
          onClick={() => navigate("/guards")}
        >
          Planning des gardes
        </Button>

        {/* Stats rapides */}
        <SimpleGrid cols={{ base: 1, sm: 3 }} mt="xl" spacing={2}>
          <StatChip
            label="Mes gardes à venir"
            value={guardsLoading ? "…" : String(myUpcomingGuards.length)}
            caption="sur les 30 prochains jours"
          />
          <StatChip
            label="Gardes libres"
            value={guardsLoading ? "…" : String(freeUpcomingGuards)}
            caption="à prendre sous 7 jours"
          />
          <StatChip
            label="Absences déclarées"
            value={guardsLoading ? "…" : String(upcomingAbsences.length)}
            caption="à venir"
          />
        </SimpleGrid>
      </Box>

      {/* Section heading */}
      <Box>
        <Group gap={8} align="center">
          <Box style={{ width: 24, height: 2, background: "var(--mantine-color-pink-5)" }} />
          <Text
            size="xs"
            tt="uppercase"
            c="pink.5"
            style={{ fontFamily: MONO, letterSpacing: "0.2em" }}
          >
            à venir_
          </Text>
        </Group>
        <Group justify="space-between" align="baseline" mt={4}>
          <Title order={2} ff="Anton, sans-serif" tt="uppercase">
            Gardes & absences
          </Title>
          <Text size="xs" c="dimmed" style={{ fontFamily: MONO }}>
            week {getWeekNumber(new Date())}_
          </Text>
        </Group>
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
            <Center py="md"><Loader size="sm" /></Center>
          ) : myUpcomingGuards.length === 0 ? (
            <Text size="sm" c="dimmed" ta="center" py="md">
              Aucune garde à venir (30 jours)
            </Text>
          ) : (
            <Stack gap="xs">
              {myUpcomingGuards.map((g) => <GuardCard key={g.id} guard={g} />)}
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
          {guardsLoading ? (
            <Center py="md"><Loader size="sm" /></Center>
          ) : upcomingAbsences.length === 0 ? (
            <Text size="sm" c="dimmed" ta="center" py="md">
              Aucune absence déclarée
            </Text>
          ) : (
            <Stack gap="xs">
              {upcomingAbsences.map((a, i) => (
                <AbsenceRow key={`${a.user.id}-${a.date}-${i}`} date={a.date} user={a.user} />
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

function StatChip({ label, value, caption }: { label: string; value: string; caption: string }) {
  return (
    <Box p="md" style={{ background: "rgba(0,0,0,0.28)" }}>
      <Text
        size="xs"
        tt="uppercase"
        style={{ fontFamily: MONO, color: "rgba(255,255,255,0.7)", letterSpacing: "0.15em" }}
      >
        {label}_
      </Text>
      <Text fw={700} ff="Anton, sans-serif" c="white" mt={4} style={{ fontSize: "1.8rem", lineHeight: 1.1 }}>
        {value}
      </Text>
      <Text size="xs" mt={4} style={{ fontFamily: MONO, color: "rgba(255,255,255,0.6)" }}>
        {caption}
      </Text>
    </Box>
  );
}
