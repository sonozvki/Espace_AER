import {
  Stack, Title, Select, Group, Table, Text, Badge, Loader, Center, Button,
  Modal, Progress, Accordion, Code, Divider, ActionIcon, Tooltip, rem, ScrollArea,
  Checkbox, TextInput,
} from "@mantine/core";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, Legend, ResponsiveContainer,
} from "recharts";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { IconPlayerPlay, IconRefresh, IconCheck, IconX, IconSearch } from "@tabler/icons-react";
import {
  useMoulisModules,
  useMoulisProjects,
  useMoulisGroups,
  useMoulisGroupDetail,
  useMoulisGroupTrend,
} from "@/features/moulis/hooks";
import { triggerGroup as apiTriggerGroup, triggerAll as apiTriggerAll } from "@/features/moulis/api";
import type { GroupSummary, TriggerParams } from "@/features/moulis/types";

function passRate(s: GroupSummary) {
  return s.totalCount > 0 ? (s.passCount / s.totalCount) * 100 : 0;
}

function rateColor(rate: number) {
  if (rate >= 80) return "green";
  if (rate >= 50) return "yellow";
  return "red";
}

function ResultBadge({ result, building }: { result: string | null; building: boolean }) {
  if (building) return <Badge color="blue" variant="dot">En cours</Badge>;
  if (!result) return <Badge color="gray" variant="outline">—</Badge>;
  if (result === "SUCCESS") return <Badge color="green">OK</Badge>;
  if (result === "FAILURE") return <Badge color="red">KO</Badge>;
  return <Badge color="orange">{result}</Badge>;
}

function BuildProgress({ startedAt, estimatedDuration }: { startedAt: number | null; estimatedDuration: number | null }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const elapsed = startedAt ? now - startedAt : 0;
  const elapsedSec = Math.floor(elapsed / 1000);
  const label = elapsedSec < 60 ? `${elapsedSec}s` : `${Math.floor(elapsedSec / 60)}m${String(elapsedSec % 60).padStart(2, "0")}s`;

  if (!estimatedDuration) {
    return (
      <Stack gap={4}>
        <Progress value={100} animated size="sm" color="blue" />
        <Text size="xs" c="dimmed">En cours · {label}</Text>
      </Stack>
    );
  }

  const pct = Math.min(Math.round((elapsed / estimatedDuration) * 100), 99);
  return (
    <Stack gap={4}>
      <Progress value={pct} size="sm" color="blue" animated={pct < 99} />
      <Text size="xs" c="dimmed">{label} · ~{Math.round(estimatedDuration / 1000)}s est.</Text>
    </Stack>
  );
}

const DEFAULT_PARAMS: TriggerParams = {
  visibility: "Private",
  delivery: "Git",
  force: false,
  checkoutDatetime: "",
};

function TriggerParamsModal({
  opened, onClose, onConfirm, title, loading,
}: {
  opened: boolean;
  onClose: () => void;
  onConfirm: (params: TriggerParams) => void;
  title: string;
  loading: boolean;
}) {
  const [params, setParams] = useState<TriggerParams>(DEFAULT_PARAMS);

  useEffect(() => {
    if (opened) setParams(DEFAULT_PARAMS);
  }, [opened]);

  return (
    <Modal opened={opened} onClose={onClose} title={title} size="md" centered>
      <form onSubmit={(e) => { e.preventDefault(); onConfirm(params); }}>
        <Stack gap="md">
          <Select
            label="Visibilité"
            description="Private : non visible pour les étudiants · Public : visible sur my.epitech.eu"
            data={["Private", "Public"]}
            value={params.visibility}
            onChange={(v) => v && setParams((p) => ({ ...p, visibility: v as TriggerParams["visibility"] }))}
          />
          <Select
            label="Delivery"
            description="Git : dernier commit · Ramassage : avant la date de rendu · Bttf : dernier commit (notation bttf)"
            data={["Git", "Ramassage", "Bttf"]}
            value={params.delivery}
            onChange={(v) => v && setParams((p) => ({ ...p, delivery: v as TriggerParams["delivery"] }))}
          />
          <Checkbox
            label="FORCE"
            description="Forcer l'exécution même sans changement de code source"
            checked={params.force}
            onChange={(e) => setParams((p) => ({ ...p, force: e.currentTarget.checked }))}
          />
          <TextInput
            label="CHECKOUT_DELIVERY_DATETIME"
            description="Optionnel · Format ISO8601, ex : 2020-04-23T16:31:34Z"
            placeholder="Laisser vide pour la date actuelle"
            value={params.checkoutDatetime}
            onChange={(e) => setParams((p) => ({ ...p, checkoutDatetime: e.currentTarget.value }))}
          />
          <Group justify="flex-end" mt="xs">
            <Button variant="subtle" type="button" onClick={onClose}>Annuler</Button>
            <Button type="submit" leftSection={<IconPlayerPlay size={14} />} loading={loading}>
              Lancer
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

function GroupModal({
  opened, onClose, onTriggerRequest,
  module, project, group,
}: {
  opened: boolean;
  onClose: () => void;
  onTriggerRequest: () => void;
  module: string;
  project: string;
  group: string | null;
}) {
  const { data, isLoading } = useMoulisGroupDetail(module, project, group);
  const { data: trend } = useMoulisGroupTrend(module, project, group);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={group ? <Text fw={600} ff="monospace">{group.split("_").join(" · ")}</Text> : "Détail"}
      size="90%"
      centered
      scrollAreaComponent={ScrollArea.Autosize}
    >
      {isLoading && <Center py="xl"><Loader /></Center>}
      {data && (
        <Stack gap="lg">
          <Group justify="space-between">
            <Group gap="xs">
              <Badge color="green" size="lg">{data.passCount} ✓</Badge>
              <Badge color="red" size="lg">{data.failCount} ✗</Badge>
              <Text size="sm" c="dimmed">/ {data.totalCount}</Text>
            </Group>
            <Button
              size="xs"
              leftSection={<IconPlayerPlay size={14} />}
              onClick={onTriggerRequest}
            >
              Relancer
            </Button>
          </Group>

          <Progress
            value={data.totalCount > 0 ? (data.passCount / data.totalCount) * 100 : 0}
            color={rateColor(data.totalCount > 0 ? (data.passCount / data.totalCount) * 100 : 0)}
            size="sm"
          />

          {/* Trend chart */}
          {trend && trend.length > 1 && (
            <>
              <Divider label="Tendance" labelPosition="left" />
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart
                  data={trend.map((b) => ({ build: `#${b.build}`, Réussis: b.passed, Échoués: b.failed, Ignorés: b.skipped }))}
                  margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--mantine-color-default-border)" />
                  <XAxis dataKey="build" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} width={28} />
                  <ChartTooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="Réussis" stackId="1" stroke="#40c057" fill="#40c057" fillOpacity={0.75} isAnimationActive={false} />
                  <Area type="monotone" dataKey="Échoués" stackId="1" stroke="#fa5252" fill="#fa5252" fillOpacity={0.75} isAnimationActive={false} />
                  <Area type="monotone" dataKey="Ignorés" stackId="1" stroke="#868e96" fill="#868e96" fillOpacity={0.6} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </>
          )}

          {/* Coverage */}
          {(data.coverage.lines !== null || data.coverage.functions !== null) && (
            <>
              <Divider label="Couverture" labelPosition="left" />
              <Group gap="xl">
                {data.coverage.lines !== null && (
                  <Stack gap={2} align="center">
                    <Text size="lg" fw={600}>{data.coverage.lines.toFixed(1)}%</Text>
                    <Text size="xs" c="dimmed">Lignes</Text>
                  </Stack>
                )}
                {data.coverage.functions !== null && (
                  <Stack gap={2} align="center">
                    <Text size="lg" fw={600}>{data.coverage.functions.toFixed(1)}%</Text>
                    <Text size="xs" c="dimmed">Fonctions</Text>
                  </Stack>
                )}
                {data.coverage.branches !== null && (
                  <Stack gap={2} align="center">
                    <Text size="lg" fw={600}>{data.coverage.branches.toFixed(1)}%</Text>
                    <Text size="xs" c="dimmed">Branches</Text>
                  </Stack>
                )}
              </Group>
            </>
          )}

          {/* Coding style */}
          <Divider label="Coding style" labelPosition="left" />
          <Group gap="sm">
            <Text size="sm">Note :</Text>
            <Badge color={data.codingStyle.mark === 0 ? "green" : "red"} size="lg">
              {data.codingStyle.mark}
            </Badge>
          </Group>
          {data.codingStyle.infractions.length > 0 && (
            <Stack gap="sm">
              {data.codingStyle.infractions.map((inf, i) => (
                <Stack key={i} gap={2} style={{ borderLeft: `2px solid var(--mantine-color-${inf.severity === "major" ? "red" : "orange"}-5)`, paddingLeft: rem(8) }}>
                  <Group gap="xs">
                    <Code style={{ fontSize: rem(12) }}>{inf.code}</Code>
                    <Badge
                      color={inf.severity === "major" ? "red" : "orange"}
                      variant="outline"
                      size="xs"
                    >
                      {inf.severity.toUpperCase()}
                    </Badge>
                    <Text size="xs">{inf.comment}</Text>
                  </Group>
                  <Text size="xs" c="dimmed" ff="monospace">{inf.file}:{inf.line}</Text>
                </Stack>
              ))}
            </Stack>
          )}

          {/* Test suites */}
          <Divider label="Tests" labelPosition="left" />
          <Accordion variant="separated" radius="sm" multiple defaultValue={data.suites.map((s) => s.name)}>
            {data.suites.map((suite) => {
              const suiteFail = suite.cases.filter((c) => c.status === "FAILED").length;
              return (
                <Accordion.Item key={suite.name} value={suite.name}>
                  <Accordion.Control>
                    <Group gap="sm">
                      <Text size="sm" style={{ flex: 1 }}>{suite.name}</Text>
                      <Badge color={suiteFail === 0 ? "green" : "red"} size="sm">
                        {suite.cases.length - suiteFail}/{suite.cases.length}
                      </Badge>
                    </Group>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <Stack gap="xs">
                      {suite.cases.map((c) => (
                        <Group key={c.name} gap="xs" wrap="nowrap" align="flex-start">
                          {c.status === "PASSED"
                            ? <IconCheck size={14} color="var(--mantine-color-green-6)" style={{ flexShrink: 0, marginTop: rem(3) }} />
                            : <IconX size={14} color="var(--mantine-color-red-6)" style={{ flexShrink: 0, marginTop: rem(3) }} />
                          }
                          <Stack gap={2} style={{ minWidth: 0 }}>
                            <Text size="xs" ff="monospace" style={{ wordBreak: "break-all" }}>{c.name}</Text>
                            {c.errorDetails && (
                              <Code block style={{ fontSize: rem(11), whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                                {c.errorDetails}
                              </Code>
                            )}
                          </Stack>
                        </Group>
                      ))}
                    </Stack>
                  </Accordion.Panel>
                </Accordion.Item>
              );
            })}
          </Accordion>
        </Stack>
      )}
    </Modal>
  );
}

const CACHE_KEY = "moulis:selection";
const CACHE_TTL = 2 * 60 * 60 * 1000;

function readSelectionCache(): { module: string | null; project: string | null } {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw)
      return { module: null, project: null };
    const { module, project, expiresAt } = JSON.parse(raw) as { module: string; project: string; expiresAt: number };
    if (Date.now() > expiresAt) {
      localStorage.removeItem(CACHE_KEY);
      return { module: null, project: null };
    }
    return { module: module ?? null, project: project ?? null };
  } catch {
    return { module: null, project: null };
  }
}

function writeSelectionCache(module: string | null, project: string | null) {
  if (!module) {
    localStorage.removeItem(CACHE_KEY);
    return;
  }
  localStorage.setItem(CACHE_KEY, JSON.stringify({ module, project, expiresAt: Date.now() + CACHE_TTL }));
}

export function MoulisPage() {
  const [module, setModule] = useState<string | null>(() => readSelectionCache().module);
  const [project, setProject] = useState<string | null>(() => readSelectionCache().project);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  useEffect(() => { writeSelectionCache(module, project); }, [module, project]);
  const [drawerOpened, { open: openDrawer, close: closeDrawer }] = useDisclosure(false);
  const [moduleSearch, setModuleSearch] = useState("");
  const [checked, setChecked] = useState<Set<string>>(new Set());

  type PendingTrigger = { type: "group"; group: string } | { type: "selection" } | { type: "all" };
  const [pendingTrigger, setPendingTrigger] = useState<PendingTrigger | null>(null);
  const [triggerParamsOpen, { open: openTriggerParams, close: closeTriggerParams }] = useDisclosure(false);
  const [triggerLoading, setTriggerLoading] = useState(false);
  const [forcePollUntil, setForcePollUntil] = useState<number | null>(null);

  const qc = useQueryClient();
  const { data: modules, isLoading: loadingModules } = useMoulisModules();
  const { data: projects, isLoading: loadingProjects } = useMoulisProjects(module);
  const { data: groups, isLoading: loadingGroups, refetch } = useMoulisGroups(module, project, forcePollUntil);

  function requestTrigger(trigger: PendingTrigger) {
    setPendingTrigger(trigger);
    openTriggerParams();
  }

  async function executeTrigger(params: TriggerParams) {
    if (!module || !project || !pendingTrigger) return;
    setTriggerLoading(true);
    try {
      if (pendingTrigger.type === "group") {
        await apiTriggerGroup(module, project, pendingTrigger.group, params);
        notifications.show({ message: "Build lancé", color: "green" });
      } else if (pendingTrigger.type === "selection") {
        await Promise.all([...checked].map((g) => apiTriggerGroup(module, project, g, params)));
        notifications.show({ message: `${checked.size} build(s) lancé(s)`, color: "green" });
        setChecked(new Set());
      } else {
        await apiTriggerAll(module, project, params);
        notifications.show({ message: "Tous les builds lancés", color: "green" });
      }
      setForcePollUntil(Date.now() + 2 * 60 * 1000);
      qc.invalidateQueries({ queryKey: ["moulis", "groups", module, project] });
      closeTriggerParams();
    } catch {
      notifications.show({ message: "Échec du déclenchement", color: "red" });
    } finally {
      setTriggerLoading(false);
    }
  }

  function handleRowClick(g: GroupSummary) {
    setSelectedGroup(g.group);
    openDrawer();
  }

  function toggleCheck(e: React.MouseEvent, group: string) {
    e.stopPropagation();
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  }

  function toggleAll(e: React.MouseEvent) {
    e.stopPropagation();
    if (!groups) return;
    setChecked(checked.size === groups.length ? new Set() : new Set(groups.map((g) => g.group)));
  }

  const filteredModules = (modules ?? []).filter((m) =>
    m.toLowerCase().includes(moduleSearch.toLowerCase())
  );
  const projectOptions = (projects ?? []).map((p) => ({ value: p, label: p }));
  const allChecked = !!groups && groups.length > 0 && checked.size === groups.length;
  const indeterminate = checked.size > 0 && !allChecked;

  return (
    <Stack gap="xl">
      <Title order={2} ff="Anton, sans-serif">Moulis</Title>

      <Stack gap="sm">
        {/* Module picker */}
        {loadingModules ? <Loader size="sm" /> : (
          <Stack gap="xs">
            <TextInput
              placeholder="Filtrer les modules…"
              value={moduleSearch}
              onChange={(e) => setModuleSearch(e.currentTarget.value)}
              leftSection={<IconSearch size={13} />}
              size="xs"
              w={200}
            />
            <Group gap={6} wrap="wrap">
              {filteredModules.map((m) => (
                <Button
                  key={m}
                  size="xs"
                  variant={module === m ? "filled" : "default"}
                  color={module === m ? "epitech" : undefined}
                  onClick={() => { setModule(m); setProject(null); setChecked(new Set()); }}
                  styles={{ root: { fontFamily: "monospace", letterSpacing: "0.02em" } }}
                >
                  {m}
                </Button>
              ))}
            </Group>
          </Stack>
        )}

        {/* Projet + actions */}
        {module && (
          <Group align="flex-end" gap="sm">
            {loadingProjects ? <Loader size="sm" /> : (
              <Select
                label="Projet"
                placeholder="Choisir un projet…"
                data={projectOptions}
                value={project}
                onChange={(v) => { setProject(v); setChecked(new Set()); }}
                w={200}
                searchable
              />
            )}
            {groups && groups.length > 0 && (
              <Group gap="xs">
                <Tooltip label="Rafraîchir">
                  <ActionIcon variant="subtle" onClick={() => refetch()}>
                    <IconRefresh size={16} />
                  </ActionIcon>
                </Tooltip>
                {checked.size > 0 && (
                  <Button
                    size="sm"
                    color="orange"
                    leftSection={<IconPlayerPlay size={14} />}
                    loading={triggerLoading && pendingTrigger?.type === "selection"}
                    onClick={() => requestTrigger({ type: "selection" })}
                  >
                    Lancer sélection ({checked.size})
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="light"
                  color="blue"
                  leftSection={<IconPlayerPlay size={14} />}
                  loading={triggerLoading && pendingTrigger?.type === "all"}
                  onClick={() => requestTrigger({ type: "all" })}
                >
                  Lancer tous
                </Button>
              </Group>
            )}
          </Group>
        )}
      </Stack>

      {loadingGroups && (
        <Center py="xl">
          <Stack align="center" gap="sm">
            <Loader />
            <Text size="sm" c="dimmed">Récupération des résultats…</Text>
          </Stack>
        </Center>
      )}

      {groups && groups.length > 0 && !loadingGroups && (
        <Table withTableBorder withColumnBorders striped highlightOnHover style={{ cursor: "pointer" }}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th style={{ width: 36 }} onClick={(e) => toggleAll(e)}>
                <Checkbox
                  checked={allChecked}
                  indeterminate={indeterminate}
                  onChange={() => {}}
                  onClick={(e) => toggleAll(e)}
                />
              </Table.Th>
              <Table.Th>Membres</Table.Th>
              <Table.Th>Tests</Table.Th>
              <Table.Th>Réussite</Table.Th>
              <Table.Th>Style</Table.Th>
              <Table.Th>Dernier build</Table.Th>
              <Table.Th style={{ width: 48 }} />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {groups.map((g) => {
              const rate = passRate(g);
              return (
                <Table.Tr key={g.group} onClick={() => handleRowClick(g)}>
                  <Table.Td onClick={(e) => toggleCheck(e, g.group)}>
                    <Checkbox
                      checked={checked.has(g.group)}
                      onChange={() => {}}
                      onClick={(e) => { e.stopPropagation(); toggleCheck(e, g.group); }}
                    />
                  </Table.Td>
                  <Table.Td>
                    <Stack gap={2}>
                      {g.members.map((m) => (
                        <Text key={m} size="xs" ff="monospace">{m}</Text>
                      ))}
                    </Stack>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">
                      <Text span c="green" fw={600}>{g.passCount}</Text>
                      <Text span c="dimmed"> / {g.totalCount}</Text>
                    </Text>
                  </Table.Td>
                  <Table.Td style={{ minWidth: rem(120) }}>
                    <Stack gap={4}>
                      <Progress value={rate} color={rateColor(rate)} size="sm" />
                      <Text size="xs" c="dimmed">{rate.toFixed(0)}%</Text>
                    </Stack>
                  </Table.Td>
                  <Table.Td>
                    <Badge color={g.codingStyleInfractions === 0 ? "green" : "red"} variant="outline" size="sm">
                      {g.codingStyleInfractions === 0 ? "OK" : `${g.codingStyleInfractions} infraction(s)`}
                    </Badge>
                  </Table.Td>
                  <Table.Td style={{ minWidth: rem(140) }}>
                    {g.building ? (
                      <BuildProgress startedAt={g.lastBuildAt} estimatedDuration={g.estimatedDuration} />
                    ) : g.lastBuildAt ? (
                      <Text size="xs" c="dimmed">
                        {new Date(g.lastBuildAt).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                      </Text>
                    ) : (
                      <Text size="xs" c="dimmed">—</Text>
                    )}
                  </Table.Td>
                  <Table.Td onClick={(e) => e.stopPropagation()}>
                    <Tooltip label="Lancer le build">
                      <ActionIcon
                        variant="subtle"
                        color="blue"
                        loading={triggerLoading && pendingTrigger?.type === "group" && pendingTrigger.group === g.group}
                        onClick={(e) => { e.stopPropagation(); requestTrigger({ type: "group", group: g.group }); }}
                      >
                        <IconPlayerPlay size={14} />
                      </ActionIcon>
                    </Tooltip>
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      )}

      {module && project && groups?.length === 0 && !loadingGroups && (
        <Text c="dimmed" size="sm">Aucun groupe trouvé pour ce projet.</Text>
      )}

      <GroupModal
        opened={drawerOpened}
        onClose={closeDrawer}
        onTriggerRequest={() => requestTrigger({ type: "group", group: selectedGroup ?? "" })}
        module={module ?? ""}
        project={project ?? ""}
        group={selectedGroup}
      />

      <TriggerParamsModal
        opened={triggerParamsOpen}
        onClose={closeTriggerParams}
        onConfirm={executeTrigger}
        title={
          pendingTrigger?.type === "group"
            ? `Lancer le build pour ${pendingTrigger.group}`
            : pendingTrigger?.type === "selection"
            ? `Lancer ${checked.size} build(s)`
            : "Lancer tous les builds"
        }
        loading={triggerLoading}
      />
    </Stack>
  );
}
