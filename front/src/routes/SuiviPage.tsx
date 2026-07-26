import {
  Stack, Title, Select, Group, Table, Text, Badge, Loader, Center, Anchor, Alert,
  UnstyledButton, rem, Paper, TextInput,
} from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { IconAlertCircle, IconChevronUp, IconChevronDown, IconSelector, IconSearch } from "@tabler/icons-react";
import { useIntraPromos, useIntraStudents } from "@/features/suivi/hooks";
import { useAuth } from "@/hooks/useAuth";
import type { IntraStudent } from "@/features/suivi/api";

type SortKey = "lastName" | "gpa" | "credits" | "semester" | "netsoulHours";
type SortDir = "asc" | "desc";

function sortStudents(rows: IntraStudent[], key: SortKey, dir: SortDir) {
  return [...rows].sort((a, b) => {
    let cmp = 0;
    if (key === "lastName") {
      cmp = a.lastName.localeCompare(b.lastName);
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

function gpaColor(gpa: number | null) {
  if (gpa === null) return "gray";
  if (gpa >= 3) return "green";
  if (gpa >= 2) return "yellow";
  return "red";
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
        style={{ display: "flex", alignItems: "center", gap: rem(4), userSelect: "none" }}
      >
        <Text size="sm" fw={600}>{children}</Text>
        <Icon size={14} style={{ opacity: isActive ? 1 : 0.4 }} />
      </UnstyledButton>
    </Table.Th>
  );
}

const MOBILE_SORT_OPTIONS = [
  { value: "gpa:desc", label: "GPA ↓" },
  { value: "gpa:asc", label: "GPA ↑" },
  { value: "lastName:asc", label: "Nom A→Z" },
  { value: "credits:desc", label: "Crédits ↓" },
  { value: "netsoulHours:desc", label: "Netsoul ↓" },
  { value: "semester:asc", label: "Semestre ↑" },
];

export function SuiviPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = !useMediaQuery("(min-width: 640px)");
  const [promo, setPromo] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("gpa");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [search, setSearch] = useState("");
  const [showNumbers, setShowNumbers] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setShowNumbers((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const { data: promos, isLoading: loadingPromos, error: promosError } = useIntraPromos();
  const { data: students, isLoading: loadingStudents, error: studentsError } = useIntraStudents(promo);

  const tokenError =
    (promosError as { error?: string } | null)?.error === "no_token" ||
    (studentsError as { error?: string } | null)?.error === "no_token";

  const tokenInvalid =
    (promosError as { error?: string } | null)?.error === "token_invalid" ||
    (studentsError as { error?: string } | null)?.error === "token_invalid";

  if (!user?.hasEpitechToken || tokenError) {
    return (
      <Stack gap="xl" maw={600}>
        <Title order={2} ff="Anton, sans-serif">Suivi étudiants</Title>
        <Alert icon={<IconAlertCircle size={16} />} color="orange" title="Cookie intra requis">
          Pour accéder au suivi des étudiants, enregistre ton cookie intra.epitech.eu{" "}
          <Anchor href="/settings">dans Mon compte</Anchor>.
        </Alert>
      </Stack>
    );
  }

  if (tokenInvalid) {
    return (
      <Stack gap="xl" maw={600}>
        <Title order={2} ff="Anton, sans-serif">Suivi étudiants</Title>
        <Alert icon={<IconAlertCircle size={16} />} color="red" title="Cookie expiré ou invalide">
          Ton cookie intra.epitech.eu est expiré.{" "}
          <Anchor href="/settings">Mets-le à jour dans Mon compte.</Anchor>
        </Alert>
      </Stack>
    );
  }

  function handleSort(key: SortKey) {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir(key === "lastName" ? "asc" : "desc"); }
  }

  function handleRowClick(s: IntraStudent) {
    sessionStorage.setItem(`student:${s.login}`, JSON.stringify(s));
    navigate(`/suivi/${encodeURIComponent(s.login)}`);
  }

  const promoOptions = (promos ?? []).map((p) => ({ value: p, label: p }));
  const sorted = students ? sortStudents(students, sortKey, sortDir) : [];
  const filtered = sorted.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return `${s.firstName} ${s.lastName} ${s.login}`.toLowerCase().includes(q);
  });

  return (
    <Stack gap="xl">
      <Title order={2} ff="Anton, sans-serif">Suivi étudiants</Title>

      <Group align="flex-end" wrap="wrap">
        {loadingPromos ? (
          <Loader size="sm" />
        ) : (
          <Select
            label="Promotion"
            placeholder="Choisir une promo…"
            data={promoOptions}
            value={promo}
            onChange={setPromo}
            w={240}
            searchable
          />
        )}
        {students && (
          <Text size="sm" c="dimmed">{students.length} étudiant(s)</Text>
        )}
      </Group>

      {loadingStudents && (
        <Center py="xl">
          <Stack align="center" gap="sm">
            <Loader />
            <Text size="sm" c="dimmed">Chargement des profils…</Text>
          </Stack>
        </Center>
      )}

      {sorted.length > 0 && !loadingStudents && (
        isMobile ? (
          <Stack gap="sm">
            <Group gap="sm" wrap="nowrap">
              <TextInput
                placeholder="Rechercher…"
                leftSection={<IconSearch size={14} />}
                value={search}
                onChange={(e) => setSearch(e.currentTarget.value)}
                style={{ flex: 1 }}
              />
              <Select
                size="sm"
                data={MOBILE_SORT_OPTIONS}
                value={`${sortKey}:${sortDir}`}
                onChange={(v) => {
                  if (!v) return;
                  const [k, d] = v.split(":") as [SortKey, SortDir];
                  setSortKey(k);
                  setSortDir(d);
                }}
                w={130}
                allowDeselect={false}
              />
            </Group>
            {filtered.map((s) => (
              <Paper
                key={s.login}
                p="md"
                withBorder
                onClick={() => handleRowClick(s)}
                style={{ cursor: "pointer", borderColor: "var(--epi-border)" }}
              >
                <Group justify="space-between" wrap="nowrap" align="flex-start">
                  <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                    <Text fw={700} size="sm" style={{ lineHeight: 1.2 }}>
                      {s.firstName} {s.lastName}
                    </Text>
                    <Text size="xs" ff="monospace" c="dimmed" style={{ wordBreak: "break-all" }}>
                      {s.login}
                    </Text>
                  </Stack>
                  <Badge color={gpaColor(s.gpa)} size="lg" style={{ flexShrink: 0 }}>
                    {s.gpa !== null ? s.gpa.toFixed(2) : "—"}
                  </Badge>
                </Group>
                <Group gap="xs" mt="sm">
                  <Badge variant="outline" size="sm" color="gray">
                    {s.credits ?? "—"} crédits
                  </Badge>
                  {s.semester !== null && (
                    <Badge variant="outline" size="sm">S{s.semester}</Badge>
                  )}
                  {s.netsoulHours !== null && (
                    <Badge variant="outline" size="sm" color="blue">{s.netsoulHours}h NS</Badge>
                  )}
                </Group>
              </Paper>
            ))}
            {filtered.length === 0 && search && (
              <Text c="dimmed" size="sm" ta="center" py="md">Aucun résultat pour « {search} »</Text>
            )}
          </Stack>
        ) : (
          <Table withTableBorder withColumnBorders striped highlightOnHover style={{ cursor: "pointer" }}>
            <Table.Thead>
              <Table.Tr>
                {showNumbers && <Table.Th style={{ width: 40, color: "var(--mantine-color-dimmed)", fontFamily: "monospace", fontSize: "0.75rem" }}>#</Table.Th>}
                <SortTh sortKey="lastName" active={sortKey} dir={sortDir} onSort={handleSort}>Nom</SortTh>
                <Table.Th>Prénom</Table.Th>
                <Table.Th>Login</Table.Th>
                <SortTh sortKey="gpa" active={sortKey} dir={sortDir} onSort={handleSort}>GPA</SortTh>
                <SortTh sortKey="credits" active={sortKey} dir={sortDir} onSort={handleSort}>Crédits</SortTh>
                <SortTh sortKey="semester" active={sortKey} dir={sortDir} onSort={handleSort}>Semestre</SortTh>
                <SortTh sortKey="netsoulHours" active={sortKey} dir={sortDir} onSort={handleSort}>Netsoul (h)</SortTh>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {sorted.map((s, i) => (
                <Table.Tr key={s.login} onClick={() => handleRowClick(s)}>
                  {showNumbers && <Table.Td><Text size="xs" c="dimmed" ff="monospace">{i + 1}</Text></Table.Td>}
                  <Table.Td><Text size="sm" fw={500}>{s.lastName}</Text></Table.Td>
                  <Table.Td><Text size="sm">{s.firstName}</Text></Table.Td>
                  <Table.Td><Text size="sm" ff="monospace" c="dimmed">{s.login}</Text></Table.Td>
                  <Table.Td>
                    <Text size="sm">{s.gpa !== null ? s.gpa.toFixed(2) : <Text span c="dimmed">—</Text>}</Text>
                  </Table.Td>
                  <Table.Td>
                    {s.credits !== null ? <Text size="sm">{s.credits}</Text> : <Text size="sm" c="dimmed">—</Text>}
                  </Table.Td>
                  <Table.Td>
                    {s.semester !== null
                      ? <Badge variant="outline" size="sm">S{s.semester}</Badge>
                      : <Text size="sm" c="dimmed">—</Text>}
                  </Table.Td>
                  <Table.Td>
                    {s.netsoulHours !== null
                      ? <Text size="sm">{s.netsoulHours}h</Text>
                      : <Text size="sm" c="dimmed">—</Text>}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )
      )}
    </Stack>
  );
}
