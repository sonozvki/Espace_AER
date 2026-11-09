import { Box, Stack, Group, Text, Title, Paper, Badge, Loader, Center, Container, ThemeIcon } from "@mantine/core";
import { IconShield, IconShieldOff } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

const MONO = '"IBM Plex Mono", ui-monospace, "SF Mono", Menlo, monospace';

type PublicGuardDay = {
  date: string; // YYYY-MM-DD
  aer: string | null; // "Prénom N."
  publicHolidayName: string | null;
  schoolHolidayName: string | null;
};

type PublicGuards = { today: string; days: PublicGuardDay[] };

function formatDay(iso: string, opts: Intl.DateTimeFormatOptions) {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("fr-FR", { timeZone: "UTC", ...opts });
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function HolidayBadges({ day }: { day: PublicGuardDay }) {
  return (
    <>
      {day.publicHolidayName && <Badge size="sm" color="pink" variant="light">{day.publicHolidayName}</Badge>}
      {day.schoolHolidayName && <Badge size="sm" color="gray" variant="light">{day.schoolHolidayName}</Badge>}
    </>
  );
}

/** Page publique (sans connexion) : qui est de garde aujourd'hui et les jours suivants. */
export function PublicGuardPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["public", "guards"],
    queryFn: () => apiFetch<PublicGuards>("/api/public/guards?days=7"),
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });

  const today = data?.days.find((d) => d.date === data.today) ?? null;
  const upcoming = data?.days.filter((d) => d.date > data.today) ?? [];

  return (
    <Box mih="100vh" bg="var(--epi-bg)" className="epi-dotted" py="xl">
      <Container size="sm">
        <Stack gap="lg">
          <Box p="xl" style={{ background: "var(--epi-blue)", borderRadius: 8 }}>
            <Text size="sm" style={{ fontFamily: MONO, color: "rgba(255,255,255,0.75)", letterSpacing: "0.2em" }}>
              {"< Espace AER />"}
            </Text>
            <Title
              order={1}
              ff="Anton, sans-serif"
              tt="uppercase"
              c="white"
              mt={8}
              style={{ fontSize: "clamp(2rem, 6vw, 3rem)", lineHeight: 1 }}
            >
              Qui est de garde ?
            </Title>
            <Text mt="sm" size="lg" style={{ color: "rgba(255,255,255,0.92)" }}>
              {data ? formatDay(data.today, { weekday: "long", day: "numeric", month: "long" }) : " "}
            </Text>
          </Box>

          {isLoading && <Center py="xl"><Loader /></Center>}

          {isError && (
            <Paper p="lg" withBorder style={{ borderColor: "var(--epi-border)" }}>
              <Text c="dimmed" ta="center">Planning indisponible pour le moment, réessaie dans quelques minutes.</Text>
            </Paper>
          )}

          {data && (
            <>
              {/* Aujourd'hui */}
              <Paper
                p="xl"
                withBorder
                style={{
                  borderColor: today?.aer ? "var(--mantine-color-epitech-4)" : "var(--epi-border)",
                  borderLeftWidth: 4,
                }}
              >
                <Group gap="lg" wrap="nowrap">
                  <ThemeIcon size={56} radius="md" variant="light" color={today?.aer ? "epitech" : "gray"}>
                    {today?.aer ? <IconShield size={30} /> : <IconShieldOff size={30} />}
                  </ThemeIcon>
                  <Stack gap={4} style={{ minWidth: 0 }}>
                    <Text size="xs" tt="uppercase" c="dimmed" style={{ fontFamily: MONO, letterSpacing: "0.15em" }}>
                      aujourd'hui_
                    </Text>
                    <Text ff="Anton, sans-serif" style={{ fontSize: "2rem", lineHeight: 1.1 }}>
                      {today?.aer ?? "Pas d'AER de garde"}
                    </Text>
                    {today && (
                      <Group gap="xs">
                        <HolidayBadges day={today} />
                      </Group>
                    )}
                  </Stack>
                </Group>
              </Paper>

              {/* Jours suivants */}
              {upcoming.length > 0 && (
                <Paper p="md" withBorder style={{ borderColor: "var(--epi-border)" }}>
                  <Text size="xs" tt="uppercase" c="dimmed" mb="sm" style={{ fontFamily: MONO, letterSpacing: "0.15em" }}>
                    prochains jours_
                  </Text>
                  <Stack gap={0}>
                    {upcoming.map((d, i) => (
                      <Group
                        key={d.date}
                        justify="space-between"
                        wrap="nowrap"
                        py="sm"
                        style={{ borderTop: i === 0 ? undefined : "1px solid var(--epi-border)" }}
                      >
                        <Group gap="xs" style={{ minWidth: 0 }}>
                          <Text size="sm" fw={500} w={130}>
                            {capitalize(formatDay(d.date, { weekday: "long", day: "numeric", month: "short" }))}
                          </Text>
                          <HolidayBadges day={d} />
                        </Group>
                        <Text size="sm" fw={d.aer ? 600 : 400} c={d.aer ? undefined : "dimmed"} style={{ whiteSpace: "nowrap" }}>
                          {d.aer ?? "—"}
                        </Text>
                      </Group>
                    ))}
                  </Stack>
                </Paper>
              )}
            </>
          )}

          <Text size="xs" c="dimmed" ta="center" style={{ fontFamily: MONO }}>
            mis à jour automatiquement chaque minute
          </Text>
        </Stack>
      </Container>
    </Box>
  );
}
