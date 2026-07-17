import { useState } from "react";
import {
  Stack, Title, Paper, Text, Group, Button, PasswordInput, Badge,
  ThemeIcon, List, Divider, Anchor, Code, Tabs, Box, Progress, Loader, Center,
  Collapse, ActionIcon, Alert,
} from "@mantine/core";
import {
  IconBrandOffice, IconCheck, IconTrash, IconChartBar, IconKey,
  IconChevronDown, IconChevronUp, IconClock, IconAlertCircle, IconActivity,
} from "@tabler/icons-react";
import { useAuth } from "@/hooks/useAuth";
import { useSetEpitechToken, useClearEpitechToken } from "@/features/account/hooks";
import { useGuardStats, useAerNetsoulStats, useAerActivityStats } from "@/features/stats/hooks";
import type { AerActivityStat } from "@/features/stats/api";

const MONO = '"IBM Plex Mono", ui-monospace, "SF Mono", Menlo, monospace';

const MONTHS_FR = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS_FR[d.getMonth()]} ${d.getFullYear()}`;
}

function ActivityRow({ stat, isMe }: { stat: AerActivityStat; isMe: boolean }) {
  const [open, setOpen] = useState(false);
  const hasData = stat.count !== null;

  return (
    <Box>
      <Group justify="space-between" mb={4}>
        <Group gap="xs">
          <Text size="sm" fw={isMe ? 700 : 400}>{stat.name}</Text>
          {isMe && <Badge size="xs" variant="light" color="epitech">moi</Badge>}
          {!hasData && <Badge size="xs" variant="outline" color="gray">pas de token</Badge>}
        </Group>
        <Group gap="xs">
          {hasData && (
            <>
              <Text size="sm" fw={600}>{stat.count}</Text>
              <ActionIcon
                variant="subtle"
                size="xs"
                onClick={() => setOpen((o) => !o)}
                disabled={!stat.activities?.length}
              >
                {open ? <IconChevronUp size={12} /> : <IconChevronDown size={12} />}
              </ActionIcon>
            </>
          )}
          {!hasData && <Text size="sm" c="dimmed">—</Text>}
        </Group>
      </Group>

      {hasData && (
        <Progress
          value={stat.count ? Math.min((stat.count / 50) * 100, 100) : 0}
          color={isMe ? "epitech" : "gray"}
          size="md"
          radius="xs"
          mb={4}
        />
      )}

      <Collapse in={open}>
        <Stack gap={4} mt={6} mb={8} pl="xs" style={{ borderLeft: "2px solid var(--epi-border)" }}>
          {stat.activities?.map((a, i) => (
            <Group key={i} justify="space-between" wrap="nowrap">
              <Box style={{ minWidth: 0 }}>
                <Text size="xs" fw={500} truncate>{a.title || a.moduleTitle}</Text>
                <Text size="xs" c="dimmed" truncate>{a.type}{a.moduleTitle && a.title ? ` · ${a.moduleTitle}` : ""}</Text>
              </Box>
              <Text size="xs" c="dimmed" style={{ whiteSpace: "nowrap", fontFamily: MONO }}>
                {a.start ? formatDate(a.start) : "—"}
              </Text>
            </Group>
          ))}
        </Stack>
      </Collapse>
    </Box>
  );
}

export function SettingsPage() {
  const { user } = useAuth();
  const setToken = useSetEpitechToken();
  const clearToken = useClearEpitechToken();
  const { data: guardStats, isLoading: guardStatsLoading } = useGuardStats();
  const { data: netsoulStats, isLoading: netsoulLoading } = useAerNetsoulStats();
  const { data: activityStats, isLoading: activityLoading } = useAerActivityStats();

  const [token, setTokenValue] = useState("");
  const hasToken = user?.hasEpitechToken ?? false;

  const netsoulError = (netsoulStats as { error?: string } | undefined)?.error === "no_token";

  function handleSave() {
    if (token.trim().length < 10) return;
    setToken.mutate(token.trim(), { onSuccess: () => setTokenValue("") });
  }

  return (
    <Stack gap="xl" maw={720}>
      <Title order={2} ff="Anton, sans-serif">Mon compte</Title>

      <Tabs defaultValue="stats" variant="outline">
        <Tabs.List>
          <Tabs.Tab value="stats" leftSection={<IconChartBar size={14} />}>
            Statistiques
          </Tabs.Tab>
          <Tabs.Tab value="token" leftSection={<IconKey size={14} />}>
            Jeton intra
          </Tabs.Tab>
        </Tabs.List>

        {/* ── Statistiques ────────────────────────────────────────── */}
        <Tabs.Panel value="stats" pt="md">
          <Stack gap="md">

            {/* Gardes */}
            <Paper p="lg" withBorder style={{ borderColor: "var(--epi-border)" }}>
              <Group mb="md">
                <ThemeIcon variant="light" color="epitech"><IconChartBar size={16} /></ThemeIcon>
                <div>
                  <Text fw={700} size="lg" ff="Anton, sans-serif">Gardes par AER</Text>
                  <Text size="sm" c="dimmed">Année scolaire en cours (depuis le 25 sept.)</Text>
                </div>
              </Group>
              <Divider mb="md" />
              {guardStatsLoading ? (
                <Center py="md"><Loader size="sm" /></Center>
              ) : !guardStats?.length ? (
                <Text size="sm" c="dimmed" ta="center" py="md">Aucune donnée</Text>
              ) : (
                <Stack gap="sm">
                  {(() => {
                    const max = Math.max(...guardStats.map((s) => s.count), 1);
                    const total = guardStats.reduce((acc, s) => acc + s.count, 0);
                    return guardStats.map((s) => {
                      const isMe = s.userId === user?.id;
                      return (
                        <Box key={s.userId}>
                          <Group justify="space-between" mb={4}>
                            <Group gap="xs">
                              <Text size="sm" fw={isMe ? 700 : 400}>{s.name}</Text>
                              {isMe && <Badge size="xs" variant="light" color="epitech">moi</Badge>}
                            </Group>
                            <Group gap="xs">
                              <Text size="sm" fw={600}>{s.count}</Text>
                              <Text size="xs" c="dimmed">({total > 0 ? Math.round((s.count / total) * 100) : 0}%)</Text>
                            </Group>
                          </Group>
                          <Progress value={(s.count / max) * 100} color={isMe ? "epitech" : "gray"} size="md" radius="xs" />
                        </Box>
                      );
                    });
                  })()}
                  <Divider mt="xs" />
                  <Group justify="space-between">
                    <Text size="xs" c="dimmed" style={{ fontFamily: MONO }}>total</Text>
                    <Text size="xs" fw={600} style={{ fontFamily: MONO }}>
                      {guardStats.reduce((acc, s) => acc + s.count, 0)} gardes assurées
                    </Text>
                  </Group>
                </Stack>
              )}
            </Paper>

            {/* Netsoul */}
            <Paper p="lg" withBorder style={{ borderColor: "var(--epi-border)" }}>
              <Group mb="md">
                <ThemeIcon variant="light" color="blue"><IconClock size={16} /></ThemeIcon>
                <div>
                  <Text fw={700} size="lg" ff="Anton, sans-serif">Logtime Netsoul</Text>
                  <Text size="sm" c="dimmed">Heures actives sur l'intra depuis le 25 sept.</Text>
                </div>
              </Group>
              <Divider mb="md" />
              {netsoulLoading ? (
                <Center py="md"><Loader size="sm" /></Center>
              ) : netsoulError || !netsoulStats ? (
                <Alert icon={<IconAlertCircle size={14} />} color="orange">
                  Cookie intra requis pour afficher le logtime. Configure-le dans l'onglet "Jeton intra".
                </Alert>
              ) : (
                <Stack gap="sm">
                  {(() => {
                    const max = Math.max(...netsoulStats.map((s) => s.totalHours ?? 0), 1);
                    return netsoulStats.map((s) => {
                      const isMe = s.userId === user?.id;
                      const hours = s.totalHours;
                      return (
                        <Box key={s.userId}>
                          <Group justify="space-between" mb={4}>
                            <Group gap="xs">
                              <Text size="sm" fw={isMe ? 700 : 400}>{s.name}</Text>
                              {isMe && <Badge size="xs" variant="light" color="epitech">moi</Badge>}
                            </Group>
                            <Text size="sm" fw={600} style={{ fontFamily: MONO }}>
                              {hours !== null ? `${hours}h` : <Text span c="dimmed">—</Text>}
                            </Text>
                          </Group>
                          <Progress
                            value={hours !== null ? (hours / max) * 100 : 0}
                            color={isMe ? "epitech" : hours === null ? "gray" : "blue"}
                            size="md"
                            radius="xs"
                          />
                        </Box>
                      );
                    });
                  })()}
                </Stack>
              )}
            </Paper>

            {/* Activités */}
            <Paper p="lg" withBorder style={{ borderColor: "var(--epi-border)" }}>
              <Group mb="md">
                <ThemeIcon variant="light" color="violet"><IconActivity size={16} /></ThemeIcon>
                <div>
                  <Text fw={700} size="lg" ff="Anton, sans-serif">Activités effectuées</Text>
                  <Text size="sm" c="dimmed">Suivis, défenses, surveillances… (cliquer pour voir le détail)</Text>
                </div>
              </Group>
              <Divider mb="md" />
              {activityLoading ? (
                <Center py="md"><Loader size="sm" /></Center>
              ) : !activityStats?.length ? (
                <Text size="sm" c="dimmed" ta="center" py="md">Aucune donnée</Text>
              ) : (
                <Stack gap="sm">
                  {activityStats.map((s) => (
                    <ActivityRow key={s.userId} stat={s} isMe={s.userId === user?.id} />
                  ))}
                </Stack>
              )}
            </Paper>

          </Stack>
        </Tabs.Panel>

        {/* ── Jeton intra ─────────────────────────────────────────── */}
        <Tabs.Panel value="token" pt="md">
          <Paper p="lg" withBorder style={{ borderColor: "var(--epi-border)" }}>
            <Group justify="space-between" mb="md">
              <Group>
                <ThemeIcon variant="light" color="epitech" size="lg">
                  <IconBrandOffice size={18} />
                </ThemeIcon>
                <div>
                  <Text fw={700} size="lg">Compte Epitech (cookie intra)</Text>
                  <Text size="sm" c="dimmed">Permet d'afficher tes activités et d'accéder au suivi étudiants.</Text>
                </div>
              </Group>
              <Badge color={hasToken ? "green" : "gray"} variant="light" leftSection={hasToken ? <IconCheck size={12} /> : undefined}>
                {hasToken ? "Connecté" : "Non connecté"}
              </Badge>
            </Group>

            <Divider my="md" />

            <Stack gap="sm">
              <Text size="sm" fw={600}>Comment récupérer ton cookie ?</Text>
              <List size="sm" spacing={4} c="dimmed">
                <List.Item>
                  Connecte-toi sur{" "}
                  <Anchor href="https://intra.epitech.eu" target="_blank" rel="noreferrer">intra.epitech.eu</Anchor>{" "}
                  avec ton compte AER Microsoft.
                </List.Item>
                <List.Item>
                  Ouvre les outils de développement (<Code>F12</Code>) → onglet <Code>Application</Code> → <Code>Cookies</Code> → <Code>https://intra.epitech.eu</Code>.
                </List.Item>
                <List.Item>Copie la valeur du cookie nommé <Code>user</Code>.</List.Item>
                <List.Item>Colle-la ci-dessous.</List.Item>
              </List>

              <PasswordInput
                label="Cookie « user » de l'intra"
                autoComplete="off"
                placeholder={hasToken ? "•••••••• (un cookie est déjà enregistré)" : "Colle la valeur du cookie user ici…"}
                value={token}
                onChange={(e) => setTokenValue(e.currentTarget.value)}
                mt="xs"
              />

              <Group justify="flex-end" mt="xs">
                {hasToken && (
                  <Button variant="subtle" color="red" leftSection={<IconTrash size={14} />} loading={clearToken.isPending} onClick={() => clearToken.mutate()}>
                    Supprimer
                  </Button>
                )}
                <Button loading={setToken.isPending} disabled={token.trim().length < 10} onClick={handleSave}>
                  {hasToken ? "Mettre à jour" : "Enregistrer"}
                </Button>
              </Group>

              <Text size="xs" c="dimmed" mt="xs">
                Ton cookie est stocké chiffré et n'est jamais affiché. Il a une durée de vie longue : si tes activités ne s'affichent plus un jour, récupère un nouveau cookie et mets-le à jour ici.
              </Text>
            </Stack>
          </Paper>
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}
