import { useMemo } from "react";
import {
  Paper,
  Group,
  Text,
  Stack,
  Divider,
  ThemeIcon,
  Loader,
  Center,
  Badge,
  Box,
  Button,
  Alert,
} from "@mantine/core";
import {
  IconSchool,
  IconAlertTriangle,
  IconPlugConnected,
  IconMapPin,
} from "@tabler/icons-react";
import { Link } from "react-router-dom";
import { useEpitechActivities } from "../hooks";
import { EpitechApiError } from "../api";

const DAYS_FR = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];
const MONTHS_FR = [
  "janv.", "févr.", "mars", "avr.", "mai", "juin",
  "juil.", "août", "sept.", "oct.", "nov.", "déc.",
];

function parse(dt: string): Date {
  // "2026-06-24 14:00:00" → traité comme heure locale
  return new Date(dt.replace(" ", "T"));
}

function fmtDay(d: Date) {
  return `${DAYS_FR[d.getDay()]} ${d.getDate()} ${MONTHS_FR[d.getMonth()]}`;
}

function fmtTime(d: Date) {
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

interface Props {
  hasToken: boolean;
}

export function EpitechPanel({ hasToken }: Props) {
  // Fenêtre : aujourd'hui → +14 jours
  const { start, end } = useMemo(() => {
    const s = new Date();
    s.setHours(0, 0, 0, 0);
    const e = new Date(s);
    e.setDate(s.getDate() + 14);
    return { start: s, end: e };
  }, []);

  const { data, isLoading, error } = useEpitechActivities(start, end, hasToken);

  return (
    <Paper p="md" withBorder style={{ borderColor: "var(--epi-border)" }}>
      <Group mb="md">
        <ThemeIcon variant="light" color="epitech">
          <IconSchool size={16} />
        </ThemeIcon>
        <Text fw={700} ff="Anton, sans-serif" size="lg">
          Mes activités Epitech à venir
        </Text>
        <Badge size="xs" variant="light" color="gray" ml="auto">
          14 prochains jours
        </Badge>
      </Group>
      <Divider mb="md" />
      <Content hasToken={hasToken} isLoading={isLoading} error={error} data={data} />
    </Paper>
  );
}

function Content({
  hasToken,
  isLoading,
  error,
  data,
}: {
  hasToken: boolean;
  isLoading: boolean;
  error: unknown;
  data: ReturnType<typeof useEpitechActivities>["data"];
}) {
  if (!hasToken) {
    return (
      <Stack gap="sm" align="center" py="md">
        <ThemeIcon variant="light" color="gray" size="xl" radius="xl">
          <IconPlugConnected size={22} />
        </ThemeIcon>
        <Text size="sm" c="dimmed" ta="center">
          Connecte ton compte Epitech pour voir ici les activités où tu es assigné.
        </Text>
        <Button component={Link} to="/settings" variant="light" size="xs">
          Connecter mon compte
        </Button>
      </Stack>
    );
  }

  if (isLoading) {
    return (
      <Center py="md">
        <Loader size="sm" />
      </Center>
    );
  }

  if (error instanceof EpitechApiError && error.reason === "token_invalid") {
    return (
      <Alert
        icon={<IconAlertTriangle size={16} />}
        color="orange"
        variant="light"
        title="Token Epitech expiré"
      >
        <Stack gap="xs" align="flex-start">
          <Text size="sm">Ton cookie Epitech n'est plus valide. Mets-le à jour pour réafficher tes activités.</Text>
          <Button component={Link} to="/settings" variant="light" size="xs" color="orange">
            Mettre à jour
          </Button>
        </Stack>
      </Alert>
    );
  }

  if (error) {
    return (
      <Text size="sm" c="dimmed" ta="center" py="md">
        Impossible de récupérer les activités pour le moment.
      </Text>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Text size="sm" c="dimmed" ta="center" py="md">
        Aucune activité assignée sur les 14 prochains jours.
      </Text>
    );
  }

  return (
    <Stack gap="xs">
      {data.map((a) => {
        const s = parse(a.start);
        const e = parse(a.end);
        return (
          <Box
            key={a.id}
            p="xs"
            style={{
              borderRadius: 6,
              backgroundColor: "var(--epi-surface)",
              borderLeft: "2px solid var(--mantine-color-epitech-4)",
            }}
          >
            <Group justify="space-between" wrap="nowrap" align="flex-start">
              <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                <Text size="sm" fw={600} truncate>
                  {a.title}
                </Text>
                <Group gap={6} wrap="nowrap">
                  <Text size="xs" c="dimmed">
                    {fmtDay(s)} · {fmtTime(s)}–{fmtTime(e)}
                  </Text>
                  {a.room && (
                    <Group gap={2} wrap="nowrap">
                      <IconMapPin size={11} style={{ color: "var(--epi-ghost)" }} />
                      <Text size="xs" c="dimmed" truncate>
                        {a.room.split("/").pop()}
                      </Text>
                    </Group>
                  )}
                </Group>
              </Stack>
              <Badge size="xs" variant="light" color="epitech" style={{ flexShrink: 0 }}>
                {a.type}
              </Badge>
            </Group>
          </Box>
        );
      })}
    </Stack>
  );
}
