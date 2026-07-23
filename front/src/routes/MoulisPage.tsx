import {
  Stack, Title, Select, Group, Table, Text, Badge, Loader, Center, Button,
  Modal, Progress, Accordion, Code, Divider, ActionIcon, Tooltip, rem, ScrollArea,
  Checkbox,
} from "@mantine/core";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, Legend, ResponsiveContainer,
} from "recharts";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { IconPlayerPlay, IconRefresh, IconCheck, IconX } from "@tabler/icons-react";
import {
  useMoulisModules,
  useMoulisProjects,
  useMoulisGroups,
  useMoulisGroupDetail,
  useMoulisGroupTrend,
  useTriggerAll,
} from "@/features/moulis/hooks";
import { triggerGroup as apiTriggerGroup } from "@/features/moulis/api";
import type { GroupSummary } from "@/features/moulis/types";

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

function GroupModal({
  opened, onClose,
  module, project, group,
}: {
  opened: boolean;
  onClose: () => void;
  module: string;
  project: string;
  group: string | null;
}) {
  const { data, isLoading } = useMoulisGroupDetail(module, project, group);
  const { data: trend } = useMoulisGroupTrend(module, project, group);
  const [launching, setLaunching] = useState(false);

  async function handleTrigger() {
    if (!group) return;
    setLaunching(true);
    try {
      await apiTriggerGroup(module, project, group);
      notifications.show({ message: "Build lancé", color: "green" });
    } catch {
      notifications.show({ message: "Échec du déclenchement", color: "red" });
    } finally {
      setLaunching(false);
    }
  }

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
              loading={launching}
              onClick={handleTrigger}
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
                  <Area type="monotone" dataKey="Réussis" stackId="1" stroke="#40c057" fill="#40c057" fillOpacity={0.75} />
                  <Area type="monotone" dataKey="Échoués" stackId="1" stroke="#fa5252" fill="#fa5252" fillOpacity={0.75} />
                  <Area type="monotone" dataKey="Ignorés" stackId="1" stroke="#868e96" fill="#868e96" fillOpacity={0.6} />
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

export function MoulisPage() {
  const [module, setModule] = useState<string | null>(null);
  const [project, setProject] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [drawerOpened, { open: openDrawer, close: closeDrawer }] = useDisclosure(false);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [triggeringGroups, setTriggeringGroups] = useState<Set<string>>(new Set());
  const [bulkLaunching, setBulkLaunching] = useState(false);

  const qc = useQueryClient();
  const { data: modules, isLoading: loadingModules } = useMoulisModules();
  const { data: projects, isLoading: loadingProjects } = useMoulisProjects(module);
  const { data: groups, isLoading: loadingGroups, refetch } = useMoulisGroups(module, project);
  const triggerAllMut = useTriggerAll(module ?? "", project ?? "");

  function invalidateGroups() {
    setTimeout(() => qc.invalidateQueries({ queryKey: ["moulis", "groups", module, project] }), 3000);
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

  async function handleTriggerOne(e: React.MouseEvent, group: string) {
    e.stopPropagation();
    if (!module || !project) return;
    setTriggeringGroups((prev) => new Set([...prev, group]));
    try {
      await apiTriggerGroup(module, project, group);
      notifications.show({ message: `Build lancé`, color: "green" });
      invalidateGroups();
    } catch {
      notifications.show({ message: "Échec du déclenchement", color: "red" });
    } finally {
      setTriggeringGroups((prev) => { const next = new Set(prev); next.delete(group); return next; });
    }
  }

  async function handleTriggerSelection() {
    if (!module || !project) return;
    setBulkLaunching(true);
    try {
      await Promise.all([...checked].map((g) => apiTriggerGroup(module, project, g)));
      notifications.show({ message: `${checked.size} build(s) lancé(s)`, color: "green" });
      setChecked(new Set());
      invalidateGroups();
    } catch {
      notifications.show({ message: "Certains builds ont échoué", color: "orange" });
    } finally {
      setBulkLaunching(false);
    }
  }

  function handleTriggerAll() {
    triggerAllMut.mutate(undefined, {
      onSuccess: () => notifications.show({ message: "Tous les builds lancés", color: "green" }),
      onError: () => notifications.show({ message: "Échec du déclenchement", color: "red" }),
    });
  }

  const moduleOptions = (modules ?? []).map((m) => ({ value: m, label: m }));
  const projectOptions = (projects ?? []).map((p) => ({ value: p, label: p }));
  const allChecked = !!groups && groups.length > 0 && checked.size === groups.length;
  const indeterminate = checked.size > 0 && !allChecked;

  return (
    <Stack gap="xl">
      <Title order={2} ff="Anton, sans-serif">Moulis</Title>

      <Group align="flex-end" wrap="wrap">
        {loadingModules ? <Loader size="sm" /> : (
          <Select
            label="Module"
            placeholder="Choisir un module…"
            data={moduleOptions}
            value={module}
            onChange={(v) => { setModule(v); setProject(null); setChecked(new Set()); }}
            w={200}
            searchable
          />
        )}
        {module && (
          loadingProjects ? <Loader size="sm" /> : (
            <Select
              label="Projet"
              placeholder="Choisir un projet…"
              data={projectOptions}
              value={project}
              onChange={(v) => { setProject(v); setChecked(new Set()); }}
              w={200}
              searchable
            />
          )
        )}
        {groups && groups.length > 0 && (
          <Group gap="xs" style={{ marginTop: "auto" }}>
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
                loading={bulkLaunching}
                onClick={handleTriggerSelection}
              >
                Lancer sélection ({checked.size})
              </Button>
            )}
            <Button
              size="sm"
              variant="light"
              color="blue"
              leftSection={<IconPlayerPlay size={14} />}
              loading={triggerAllMut.isPending}
              onClick={handleTriggerAll}
            >
              Lancer tous
            </Button>
          </Group>
        )}
      </Group>

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
                  <Table.Td>
                    {g.lastBuildAt
                      ? <Text size="xs" c="dimmed">{new Date(g.lastBuildAt).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</Text>
                      : <Text size="xs" c="dimmed">—</Text>
                    }
                  </Table.Td>
                  <Table.Td onClick={(e) => e.stopPropagation()}>
                    <Tooltip label="Lancer le build">
                      <ActionIcon
                        variant="subtle"
                        color="blue"
                        loading={triggeringGroups.has(g.group)}
                        onClick={(e) => handleTriggerOne(e, g.group)}
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
        module={module ?? ""}
        project={project ?? ""}
        group={selectedGroup}
      />
    </Stack>
  );
}
