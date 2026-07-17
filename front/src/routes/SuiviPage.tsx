import {
  Stack, Title, Select, Group, Table, Text, Badge, Loader, Center, Anchor, Alert,
  UnstyledButton, rem,
} from "@mantine/core";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { IconAlertCircle, IconChevronUp, IconChevronDown, IconSelector } from "@tabler/icons-react";
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

export function SuiviPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [promo, setPromo] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("gpa");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
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

  return (
    <Stack gap="xl">
      <Title order={2} ff="Anton, sans-serif">Suivi étudiants</Title>

      <Group align="flex-end">
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
      )}
    </Stack>
  );
}
