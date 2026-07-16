import {
  Stack, Title, Text, Badge, Table, Group, ActionIcon, Loader, Center,
  Paper, SimpleGrid, SegmentedControl, UnstyledButton, rem, Alert,
} from "@mantine/core";
import { IconArrowLeft, IconChevronUp, IconChevronDown, IconSelector, IconAlertCircle } from "@tabler/icons-react";
import { useNavigate, useParams } from "react-router-dom";
import { useStudentNotes } from "@/features/suivi/hooks";
import { useEffect, useState } from "react";
import type { IntraStudent, IntraModuleNote } from "@/features/suivi/api";

// Ordre des grades pour le tri
const GRADE_ORDER: Record<string, number> = { A: 0, B: 1, C: 2, D: 3, Acquis: 4, "-": 5, Echec: 6 };
function gradeRank(g: string | null) {
  if (g === null) return 99;
  return GRADE_ORDER[g] ?? 50;
}

type SortKey = "title" | "grade" | "credits" | "note" | "scolaryear" | "begin";
type SortDir = "asc" | "desc";

function sortModules(rows: IntraModuleNote[], key: SortKey, dir: SortDir) {
  return [...rows].sort((a, b) => {
    let cmp = 0;
    if (key === "grade") {
      cmp = gradeRank(a.grade) - gradeRank(b.grade);
    } else if (key === "title") {
      cmp = (a.title ?? "").localeCompare(b.title ?? "");
    } else if (key === "begin") {
      cmp = (a.begin ?? "").localeCompare(b.begin ?? "");
    } else {
      const av = a[key] as number | null;
      const bv = b[key] as number | null;
      if (av === null && bv === null) cmp = 0;
      else if (av === null) cmp = 1;
      else if (bv === null) cmp = -1;
      else cmp = av - bv;
    }
    return dir === "asc" ? cmp : -cmp;
  });
}

function SortTh({ children, sortKey, active, dir, onSort }: {
  children: React.ReactNode;
  sortKey: SortKey;
  active: SortKey;
  dir: SortDir;
  onSort: (k: SortKey) => void;
}) {
  const isActive = active === sortKey;
  const Icon = isActive ? (dir === "asc" ? IconChevronUp : IconChevronDown) : IconSelector;
  return (
    <Table.Th>
      <UnstyledButton
        onClick={() => onSort(sortKey)}
        style={{ display: "flex", alignItems: "center", gap: rem(4), width: "100%", userSelect: "none" }}
      >
        <Text size="sm" fw={600}>{children}</Text>
        <Icon size={14} style={{ opacity: isActive ? 1 : 0.4 }} />
      </UnstyledButton>
    </Table.Th>
  );
}

function StatCard({ label, value }: { label: string; value: string | number | null }) {
  return (
    <Paper p="md" withBorder style={{ borderColor: "var(--epi-border)" }}>
      <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb={4}>{label}</Text>
      <Text size="xl" fw={700}>{value ?? "—"}</Text>
    </Paper>
  );
}

// function formatDate(d: string | null) {
//   if (!d) return "—";
//   const date = new Date(d);
//   return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
// }

export function StudentNotesPage() {
  const { login } = useParams<{ login: string }>();
  const navigate = useNavigate();
  const decodedLogin = decodeURIComponent(login ?? "");

  const { data: notes, isLoading, isError } = useStudentNotes(decodedLogin || null);
  const [student, setStudent] = useState<IntraStudent | null>(null);
  const [semFilter, setSemFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("begin");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  useEffect(() => {
    const cached = sessionStorage.getItem(`student:${decodedLogin}`);
    if (cached) setStudent(JSON.parse(cached) as IntraStudent);
  }, [decodedLogin]);

  if (isLoading) {
    return (
      <Center py="xl">
        <Stack align="center" gap="sm">
          <Loader />
          <Text size="sm" c="dimmed">Chargement…</Text>
        </Stack>
      </Center>
    );
  }

  if (isError || (!isLoading && !notes)) {
    return (
      <Stack gap="lg" maw={500}>
        <Group>
          <ActionIcon variant="subtle" onClick={() => navigate(-1)} size="lg">
            <IconArrowLeft size={20} />
          </ActionIcon>
          <Text fw={600}>Retour</Text>
        </Group>
        <Alert icon={<IconAlertCircle size={16} />} color="red" title="Error">
          Pourquoi tu recherches <Text span ff="monospace">{decodedLogin}</Text> ? Bizarre bizarre frérot.
        </Alert>
      </Stack>
    );
  }

  function handleSort(key: SortKey) {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  }

  const name = student ? `${student.firstName} ${student.lastName}` : decodedLogin;

  // Semestres disponibles
  const semesters = notes
    ? [...new Set(notes.modules.map((m) => m.semester).filter((s): s is number => s !== null))].sort()
    : [];

  const semOptions = [
    { label: "Tous", value: "all" },
    ...semesters.map((s) => ({ label: `Semestre ${s}`, value: String(s) })),
  ];

  const filteredModules = notes?.modules.filter(
    (m) => semFilter === "all" || String(m.semester) === semFilter
  ) ?? [];

  const sorted = sortModules(filteredModules, sortKey, sortDir);

  // Totaux pour le semestre sélectionné
  const totalCredits = filteredModules.reduce((acc, m) => acc + (m.credits ?? 0), 0);
  const acquiredCredits = filteredModules
    .filter((m) => m.grade && m.grade !== "-" && m.grade !== "Echec")
    .reduce((acc, m) => acc + (m.credits ?? 0), 0);

  return (
    <Stack gap="xl">
      <Group>
        <ActionIcon variant="subtle" onClick={() => navigate(-1)} size="lg">
          <IconArrowLeft size={20} />
        </ActionIcon>
        <Stack gap={0}>
          <Title order={2} ff="Anton, sans-serif">{name}</Title>
          <Text size="sm" c="dimmed" ff="monospace">{decodedLogin}</Text>
        </Stack>
      </Group>

      {student && (
        <SimpleGrid cols={{ base: 2, sm: 4 }}>
          <StatCard label="GPA" value={student.gpa !== null ? student.gpa.toFixed(2) : null} />
          <StatCard label="Crédits totaux" value={student.credits} />
          <StatCard label="Semestre actuel" value={student.semester !== null ? `S${student.semester}` : null} />
        </SimpleGrid>
      )}

      {isLoading && <Center py="xl"><Loader /></Center>}

      {notes && !isLoading && (
        <Stack gap="md">
          {semOptions.length > 1 && (
            <SegmentedControl
              value={semFilter}
              onChange={setSemFilter}
              data={semOptions}
              w="fit-content"
            />
          )}

          {sorted.length > 0 ? (
            <>
              <Text size="sm" c="dimmed">
                {acquiredCredits} crédits acquis sur {totalCredits}
              </Text>
              <Table withTableBorder withColumnBorders striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <SortTh sortKey="title" active={sortKey} dir={sortDir} onSort={handleSort}>Titre</SortTh>
                    {/* <SortTh sortKey="begin" active={sortKey} dir={sortDir} onSort={handleSort}>Date</SortTh> */}
                    <SortTh sortKey="grade" active={sortKey} dir={sortDir} onSort={handleSort}>Grade</SortTh>
                    <SortTh sortKey="note" active={sortKey} dir={sortDir} onSort={handleSort}>Note</SortTh>
                    <SortTh sortKey="credits" active={sortKey} dir={sortDir} onSort={handleSort}>Crédits</SortTh>
                    <SortTh sortKey="scolaryear" active={sortKey} dir={sortDir} onSort={handleSort}>Année</SortTh>
                    <Table.Th>Code module</Table.Th>
                    <Table.Th>Cycle</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {sorted.map((m) => (
                    <Table.Tr key={`${m.codemodule}-${m.scolaryear}-${m.codeinstance}`}>
                      <Table.Td><Text size="sm">{m.title}</Text></Table.Td>
                      {/* <Table.Td><Text size="sm">{formatDate(m.begin)}</Text></Table.Td> */}
                      <Table.Td>
                        {m.grade
                          ? <Badge variant="light" size="sm"
                              color={m.grade === "Echec" ? "red" : m.grade === "-" ? "gray" : "blue"}>
                              {m.grade}
                            </Badge>
                          : <Text size="sm" c="dimmed">—</Text>}
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{m.note !== null ? m.note.toFixed(2) : "—"}</Text>
                      </Table.Td>
                      <Table.Td><Text size="sm">{m.credits ?? "—"}</Text></Table.Td>
                      <Table.Td><Text size="sm">{m.scolaryear ?? "—"}</Text></Table.Td>
                      <Table.Td><Text size="sm" ff="monospace" c="dimmed">{m.codemodule}</Text></Table.Td>
                      <Table.Td><Text size="sm" c="dimmed">{m.cycle ?? "—"}</Text></Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </>
          ) : (
            <Text c="dimmed" ta="center" py="xl">Aucun module pour ce filtre.</Text>
          )}
        </Stack>
      )}
    </Stack>
  );
}
