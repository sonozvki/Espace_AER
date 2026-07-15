import {
  Stack, Title, Text, Badge, Table, Group, ActionIcon, Loader, Center,
  Paper, SimpleGrid, Divider,
} from "@mantine/core";
import { IconArrowLeft } from "@tabler/icons-react";
import { useNavigate, useParams } from "react-router-dom";
import { useStudentNotes } from "@/features/suivi/hooks";
import { useEffect, useState } from "react";
import type { IntraStudent } from "@/features/suivi/api";

function StatCard({ label, value }: { label: string; value: string | number | null }) {
  return (
    <Paper p="md" withBorder style={{ borderColor: "var(--epi-border)" }}>
      <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb={4}>{label}</Text>
      <Text size="xl" fw={700}>{value ?? "—"}</Text>
    </Paper>
  );
}

export function StudentNotesPage() {
  const { login } = useParams<{ login: string }>();
  const navigate = useNavigate();
  const decodedLogin = decodeURIComponent(login ?? "");

  const { data: notes, isLoading } = useStudentNotes(decodedLogin || null);

  // Récupère les infos de base (GPA, crédits) depuis le cache ou l'API
  // On réutilise le hook students en passant par sessionStorage pour éviter un 2ème appel
  const [student, setStudent] = useState<IntraStudent | null>(null);
  useEffect(() => {
    const cached = sessionStorage.getItem(`student:${decodedLogin}`);
    if (cached) setStudent(JSON.parse(cached) as IntraStudent);
  }, [decodedLogin]);

  const name = student
    ? `${student.firstName} ${student.lastName}`
    : decodedLogin;

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
          <StatCard label="Crédits" value={student.credits} />
          <StatCard label="Semestre" value={student.semester !== null ? `S${student.semester}` : null} />
        </SimpleGrid>
      )}

      {isLoading && <Center py="xl"><Loader /></Center>}

      {notes && !isLoading && (
        <Stack gap="xl">
          {notes.modules.length > 0 && (
            <Stack gap="sm">
              <Title order={4}>Modules</Title>
              <Table withTableBorder withColumnBorders striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Module</Table.Th>
                    <Table.Th>Année</Table.Th>
                    <Table.Th>Note</Table.Th>
                    <Table.Th>Grade</Table.Th>
                    <Table.Th>Crédits</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {notes.modules.map((m) => (
                    <Table.Tr key={`${m.codemodule}-${m.scolaryear}`}>
                      <Table.Td>
                        <Text size="sm" fw={500}>{m.title}</Text>
                        <Text size="xs" c="dimmed" ff="monospace">{m.codemodule}</Text>
                      </Table.Td>
                      <Table.Td><Text size="sm">{m.scolaryear ?? "—"}</Text></Table.Td>
                      <Table.Td>
                        <Text size="sm">{m.note !== null ? m.note.toFixed(2) : "—"}</Text>
                      </Table.Td>
                      <Table.Td>
                        {m.grade
                          ? <Badge variant="light" size="sm">{m.grade}</Badge>
                          : <Text size="sm" c="dimmed">—</Text>}
                      </Table.Td>
                      <Table.Td><Text size="sm">{m.credits ?? "—"}</Text></Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Stack>
          )}

          {notes.activities.length > 0 && (
            <Stack gap="sm">
              <Divider />
              <Title order={4}>Activités notées</Title>
              <Table withTableBorder withColumnBorders striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Activité</Table.Th>
                    <Table.Th>Note</Table.Th>
                    <Table.Th>Commentaire</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {notes.activities.map((a, i) => (
                    <Table.Tr key={i}>
                      <Table.Td><Text size="sm">{a.title}</Text></Table.Td>
                      <Table.Td><Text size="sm">{a.note !== null ? a.note.toFixed(2) : "—"}</Text></Table.Td>
                      <Table.Td><Text size="sm" c="dimmed">{a.comment ?? "—"}</Text></Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Stack>
          )}

          {notes.modules.length === 0 && notes.activities.length === 0 && (
            <Text c="dimmed" ta="center" py="xl">Aucune note disponible pour cet étudiant.</Text>
          )}
        </Stack>
      )}
    </Stack>
  );
}
