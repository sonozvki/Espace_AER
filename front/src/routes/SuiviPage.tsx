import {
  Stack, Title, Select, Group, Table, Text, Badge, Loader, Center, Anchor, Alert,
} from "@mantine/core";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { IconAlertCircle } from "@tabler/icons-react";
import { useIntraPromos, useIntraStudents } from "@/features/suivi/hooks";
import { useAuth } from "@/hooks/useAuth";
import type { IntraStudent } from "@/features/suivi/api";

function sortStudents(rows: IntraStudent[]) {
  return [...rows].sort((a, b) => {
    if (a.gpa !== null && b.gpa !== null) return b.gpa - a.gpa;
    if (a.gpa !== null) return -1;
    if (b.gpa !== null) return 1;
    return a.lastName.localeCompare(b.lastName);
  });
}

export function SuiviPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [promo, setPromo] = useState<string | null>(null);

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

  function handleRowClick(s: IntraStudent) {
    sessionStorage.setItem(`student:${s.login}`, JSON.stringify(s));
    navigate(`/suivi/${encodeURIComponent(s.login)}`);
  }

  const promoOptions = (promos ?? []).map((p) => ({ value: p, label: p }));

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

      {loadingStudents && <Center py="xl"><Loader /></Center>}

      {students && !loadingStudents && (
        <Table striped highlightOnHover withTableBorder withColumnBorders style={{ cursor: "pointer" }}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Login</Table.Th>
              <Table.Th>Nom</Table.Th>
              <Table.Th>Prénom</Table.Th>
              <Table.Th>GPA</Table.Th>
              <Table.Th>Crédits</Table.Th>
              <Table.Th>Semestre</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {sortStudents(students).map((s) => (
              <Table.Tr key={s.login} onClick={() => handleRowClick(s)}>
                <Table.Td><Text size="sm" ff="monospace">{s.login}</Text></Table.Td>
                <Table.Td><Text size="sm">{s.lastName}</Text></Table.Td>
                <Table.Td><Text size="sm">{s.firstName}</Text></Table.Td>
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
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Stack>
  );
}
