import {
  Stack, Title, Text, Badge, Table, Group, ActionIcon, Loader, Center,
  SimpleGrid, SegmentedControl, UnstyledButton, rem, Alert, Select, Box,
} from "@mantine/core";
import { IconArrowLeft, IconChevronUp, IconChevronDown, IconSelector, IconAlertCircle } from "@tabler/icons-react";

const MONO = '"IBM Plex Mono", ui-monospace, "SF Mono", Menlo, monospace';
import { useNavigate, useParams } from "react-router-dom";
import { useStudentNotes } from "@/features/suivi/hooks";
import { useEffect, useState } from "react";
import type { IntraStudent, IntraModuleNote } from "@/features/suivi/api";

const GRADE_ORDER: Record<string, number> = { A: 0, B: 1, C: 2, D: 3, Acquis: 4, "-": 5, Echec: 6 };
function gradeRank(g: string | null) {
  if (g === null) return 99;
  return GRADE_ORDER[g] ?? 50;
}

const GRADE_POINTS: Record<string, number> = { A: 4, B: 3, C: 2, D: 1, Echec: 0 };
const PASSING_GRADES = new Set(["A", "B", "C", "D", "Acquis"]);

const GRADE_OPTIONS = [
  { value: "-", label: "—" },
  { value: "A", label: "A" },
  { value: "B", label: "B" },
  { value: "C", label: "C" },
  { value: "D", label: "D" },
  { value: "Acquis", label: "Acquis" },
  { value: "Echec", label: "Echec" },
];

function moduleKey(m: IntraModuleNote) {
  return `${m.codemodule}-${m.scolaryear}-${m.codeinstance}`;
}

function computeProjection(modules: IntraModuleNote[], projected: Record<string, string>) {
  let totalPoints = 0;
  let totalCreditsGpa = 0;
  let projectedCredits = 0;
  for (const m of modules) {
    const grade = projected[moduleKey(m)] ?? m.grade ?? "-";
    const credits = m.credits ?? 0;
    if (grade in GRADE_POINTS && credits > 0) {
      totalPoints += (GRADE_POINTS[grade] ?? 0) * credits;
      totalCreditsGpa += credits;
    }
    if (PASSING_GRADES.has(grade) && credits > 0) {
      projectedCredits += credits;
    }
  }

  return {
    gpa: totalCreditsGpa > 0 ? totalPoints / totalCreditsGpa : null,
    credits: projectedCredits,
  };
}

type SortKey = "title" | "grade" | "credits" | "scolaryear" | "begin";
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

function StatChip({ label, value, caption, accent }: { label: string; value: string; caption: string; accent?: boolean }) {
  return (
    <Box p="md" style={{ background: "rgba(0,0,0,0.28)" }}>
      <Text size="xs" tt="uppercase" style={{ fontFamily: MONO, color: accent ? "rgba(130,255,130,0.85)" : "rgba(255,255,255,0.7)", letterSpacing: "0.15em" }}>
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

export function StudentNotesPage() {
  const { login } = useParams<{ login: string }>();
  const navigate = useNavigate();
  const decodedLogin = decodeURIComponent(login ?? "");

  const { data: notes, isLoading, isError } = useStudentNotes(decodedLogin || null);
  const [student, setStudent] = useState<IntraStudent | null>(null);
  const [semFilter, setSemFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("begin");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [projectedGrades, setProjectedGrades] = useState<Record<string, string>>({});

  useEffect(() => {
    const cached = sessionStorage.getItem(`student:${decodedLogin}`);
    if (cached) setStudent(JSON.parse(cached) as IntraStudent);
  }, [decodedLogin]);

  useEffect(() => {
    if (!notes) return;
    const initial: Record<string, string> = {};
    for (const m of notes.modules) {
      initial[moduleKey(m)] = m.grade ?? "-";
    }
    setProjectedGrades(initial);
  }, [notes]);

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

  const totalCredits = filteredModules.reduce((acc, m) => acc + (m.credits ?? 0), 0);
  const acquiredCredits = filteredModules
    .filter((m) => m.grade && m.grade !== "-" && m.grade !== "Echec")
    .reduce((acc, m) => acc + (m.credits ?? 0), 0);

  const filteredProjection = computeProjection(filteredModules, projectedGrades);

  return (
    <Stack gap="xl">
      <Box
        p="xl"
        style={{ background: "var(--epi-blue)", borderRadius: 8, position: "relative", overflow: "hidden" }}
      >
        <ActionIcon variant="transparent" color="white" onClick={() => navigate(-1)} mb="md" style={{ opacity: 0.8 }}>
          <IconArrowLeft size={20} />
        </ActionIcon>

        <Text size="xs" style={{ fontFamily: MONO, color: "rgba(255,255,255,0.65)", letterSpacing: "0.2em" }}>
          suivi étudiant_
        </Text>
        <Title
          order={1}
          ff="Anton, sans-serif"
          tt="uppercase"
          c="white"
          mt={4}
          style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)", lineHeight: 1 }}
        >
          {name}
        </Title>
        <Text size="sm" mt={6} style={{ fontFamily: MONO, color: "rgba(255,255,255,0.55)" }}>
          {decodedLogin}
        </Text>

        {student && (
          <SimpleGrid cols={{ base: 2, sm: 4 }} mt="xl" spacing={2}>
            <StatChip
              label="GPA"
              value={student.gpa !== null ? student.gpa.toFixed(2) : "—"}
              caption="moyenne pondérée"
            />
            <StatChip
              label="Crédits"
              value={String(student.credits ?? "—")}
              caption="acquis"
            />
            <StatChip
              label="Semestre"
              value={student.semester !== null ? `S${student.semester}` : "—"}
              caption="en cours"
            />
            <StatChip
              label="Projection GPA"
              value={filteredProjection.gpa !== null ? filteredProjection.gpa.toFixed(2) : "—"}
              caption={`${filteredProjection.credits} crédits${semFilter !== "all" ? ` · S${semFilter}` : " projetés"}`}
              accent
            />
          </SimpleGrid>
        )}
      </Box>

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
                    <SortTh sortKey="grade" active={sortKey} dir={sortDir} onSort={handleSort}>Grade</SortTh>
                    <Table.Th style={{ width: 120 }}>
                      <Text size="sm" fw={600}>Projection</Text>
                    </Table.Th>
                    <SortTh sortKey="credits" active={sortKey} dir={sortDir} onSort={handleSort}>Crédits</SortTh>
                    <SortTh sortKey="scolaryear" active={sortKey} dir={sortDir} onSort={handleSort}>Année</SortTh>
                    <Table.Th>Code module</Table.Th>
                    <Table.Th>Cycle</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {sorted.map((m) => {
                    const key = moduleKey(m);
                    const projGrade = projectedGrades[key] ?? m.grade ?? "-";
                    return (
                      <Table.Tr key={key}>
                        <Table.Td><Text size="sm">{m.title}</Text></Table.Td>
                        <Table.Td>
                          {m.grade
                            ? <Badge variant="light" size="sm"
                                color={m.grade === "Echec" ? "red" : m.grade === "-" ? "gray" : "blue"}>
                                {m.grade}
                              </Badge>
                            : <Text size="sm" c="dimmed">—</Text>}
                        </Table.Td>
                        <Table.Td style={{ width: 120 }}>
                          <Select
                            size="xs"
                            value={projGrade}
                            onChange={(v) =>
                              setProjectedGrades((prev) => ({ ...prev, [key]: v ?? "-" }))
                            }
                            data={GRADE_OPTIONS}
                            allowDeselect={false}
                            comboboxProps={{ withinPortal: true }}
                            w={110}
                          />
                        </Table.Td>
                        <Table.Td><Text size="sm">{m.credits ?? "—"}</Text></Table.Td>
                        <Table.Td><Text size="sm">{m.scolaryear ?? "—"}</Text></Table.Td>
                        <Table.Td><Text size="sm" ff="monospace" c="dimmed">{m.codemodule}</Text></Table.Td>
                        <Table.Td><Text size="sm" c="dimmed">{m.cycle ?? "—"}</Text></Table.Td>
                      </Table.Tr>
                    );
                  })}
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
