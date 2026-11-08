import { useState } from "react";
import {
  Stack, Title, Paper, Group, Text, Button, Badge, Table, Select, Loader, Center, Modal,
  TextInput, Alert, List, ThemeIcon, Divider,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconCalendarUp, IconAlertTriangle, IconArrowRight, IconUsers } from "@tabler/icons-react";
import {
  useSchoolYear, useAerGenerations, useRolloverPreview, useRollover, useSetAerGeneration,
} from "@/features/school-year/hooks";
import { yearLabel } from "@/features/school-year/api";

const MONO = '"IBM Plex Mono", ui-monospace, "SF Mono", Menlo, monospace';

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDay(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

/** Rang de la génération : 1re année AER, 2e année AER… au-delà de `generations` → ancien */
function generationLabel(aerSince: number, current: number, generations: number) {
  const rank = current - aerSince + 1;
  if (rank < 1) return `Génération ${aerSince}`;
  if (rank > generations) return `Ancien AER (${aerSince})`;
  return `${rank === 1 ? "1re" : `${rank}e`} année AER (${aerSince})`;
}

function RolloverModal({ opened, onClose }: { opened: boolean; onClose: () => void }) {
  const { data: preview, isLoading } = useRolloverPreview(opened);
  const rollover = useRollover();
  const [startDate, setStartDate] = useState(todayIso());

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      centered
      size="lg"
      title={<Text fw={700} ff="Anton, sans-serif" size="lg">Passer à l'année suivante</Text>}
    >
      {isLoading || !preview ? (
        <Center py="xl"><Loader /></Center>
      ) : (
        <Stack gap="md">
          <Group gap="sm" justify="center" py="xs">
            <Badge size="xl" variant="outline" color="gray">{yearLabel(preview.from)}</Badge>
            <IconArrowRight size={20} />
            <Badge size="xl" color="epitech">{yearLabel(preview.to)}</Badge>
          </Group>

          <TextInput
            type="date"
            label="Début de la nouvelle année"
            description="Les stats (gardes, logtime, activités) de la nouvelle année partent de cette date."
            value={startDate}
            max={todayIso()}
            onChange={(e) => setStartDate(e.currentTarget.value)}
          />

          <Divider label="Équipe AER" labelPosition="left" />
          {preview.leavingAers.length === 0 ? (
            <Text size="sm" c="dimmed">Aucun AER ne sort des générations actives.</Text>
          ) : (
            <Stack gap={4}>
              <Text size="sm">
                Ces AER sortent des générations actives. Ils gardent l'accès à l'Espace AER mais
                n'apparaissent plus dans les stats ni dans le planning des gardes :
              </Text>
              <List size="sm" spacing={2}>
                {preview.leavingAers.map((u) => (
                  <List.Item key={u.id}>{u.name} <Text span c="dimmed" size="xs">({u.email})</Text></List.Item>
                ))}
              </List>
            </Stack>
          )}

          <Divider label="Trombi" labelPosition="left" />
          {preview.promoShifts.length === 0 ? (
            <Text size="sm" c="dimmed">Aucune promo à décaler.</Text>
          ) : (
            <Group gap="xs">
              {preview.promoShifts.map((s) => (
                <Badge key={s.from} variant="light" color="gray" style={{ fontFamily: MONO, textTransform: "none" }}>
                  {s.from} → {s.to} · {s.count}
                </Badge>
              ))}
            </Group>
          )}

          <Alert color="orange" icon={<IconAlertTriangle size={16} />}>
            Cette action n'est pas réversible depuis l'interface. Les stats des années précédentes restent
            consultables dans « Mon compte ».
          </Alert>

          <Group justify="flex-end">
            <Button variant="subtle" onClick={onClose}>Annuler</Button>
            <Button
              color="epitech"
              leftSection={<IconCalendarUp size={16} />}
              loading={rollover.isPending}
              disabled={!startDate}
              onClick={() => rollover.mutate(startDate, { onSuccess: onClose })}
            >
              Démarrer {yearLabel(preview.to)}
            </Button>
          </Group>
        </Stack>
      )}
    </Modal>
  );
}

export function SchoolYearPage() {
  const { data: state, isLoading } = useSchoolYear();
  const { data: aers, isLoading: aersLoading } = useAerGenerations();
  const setGeneration = useSetAerGeneration();
  const [modalOpened, { open, close }] = useDisclosure(false);

  if (isLoading || !state) return <Center h={200}><Loader /></Center>;

  const current = state.current.year;
  // Choix proposés : générations actives + une génération « ancienne »
  const generationOptions = Array.from({ length: state.generations + 1 }, (_, i) => current - i).map((y) => ({
    value: String(y),
    label: generationLabel(y, current, state.generations),
  }));

  return (
    <Stack gap="xl" maw={900}>
      <Title order={2} ff="Anton, sans-serif">Année & équipe</Title>

      <Paper p="lg" withBorder style={{ borderColor: "var(--epi-border)" }}>
        <Group justify="space-between" align="flex-start">
          <div>
            <Text size="xs" tt="uppercase" c="dimmed" style={{ fontFamily: MONO, letterSpacing: "0.15em" }}>
              année scolaire en cours_
            </Text>
            <Text ff="Anton, sans-serif" style={{ fontSize: "2.4rem", lineHeight: 1.1 }}>
              {yearLabel(current)}
            </Text>
            <Text size="sm" c="dimmed">depuis le {formatDay(state.current.startDate)}</Text>
          </div>
          <Button leftSection={<IconCalendarUp size={16} />} onClick={open}>
            Passer à {yearLabel(current + 1)}
          </Button>
        </Group>
        <Text size="sm" c="dimmed" mt="md">
          Passer à l'année suivante fait monter chaque génération d'AER d'un cran (seules les {state.generations} plus
          récentes restent actives) et décale le trombi : tek1 → tek2, tek2 → tek3…
        </Text>
        {state.years.length > 1 && (
          <Group gap="xs" mt="md">
            <Text size="xs" c="dimmed">Historique :</Text>
            {state.years.slice(1).map((y) => (
              <Badge key={y.year} variant="outline" color="gray" size="sm">{yearLabel(y.year)}</Badge>
            ))}
          </Group>
        )}
      </Paper>

      <Paper p="lg" withBorder style={{ borderColor: "var(--epi-border)" }}>
        <Group mb="md">
          <ThemeIcon variant="light" color="epitech"><IconUsers size={16} /></ThemeIcon>
          <div>
            <Text fw={700} size="lg" ff="Anton, sans-serif">Générations d'AER</Text>
            <Text size="sm" c="dimmed">
              Un nouvel AER rejoint automatiquement la génération de l'année en cours à sa première connexion.
            </Text>
          </div>
        </Group>
        {aersLoading ? (
          <Center py="md"><Loader size="sm" /></Center>
        ) : (
          <Table.ScrollContainer minWidth={560}>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Nom</Table.Th>
                  <Table.Th>Génération</Table.Th>
                  <Table.Th>Statut</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {(aers ?? []).map((u) => {
                  const value = u.aerSince !== null ? String(u.aerSince) : null;
                  // Génération plus ancienne que les choix proposés : on l'ajoute pour l'afficher
                  const options = value && !generationOptions.some((o) => o.value === value)
                    ? [...generationOptions, { value, label: generationLabel(u.aerSince!, current, state.generations) }]
                    : generationOptions;
                  return (
                    <Table.Tr key={u.id}>
                      <Table.Td>
                        <Text size="sm" fw={500}>{u.name}</Text>
                        <Text size="xs" c="dimmed">{u.email}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Select
                          size="xs"
                          w={220}
                          data={options}
                          value={value}
                          placeholder="Non définie"
                          allowDeselect={false}
                          onChange={(v) => v && setGeneration.mutate({ id: u.id, aerSince: Number(v) })}
                        />
                      </Table.Td>
                      <Table.Td>
                        <Badge color={u.active ? "green" : "gray"} variant="light">
                          {u.active ? "Actif" : "Ancien"}
                        </Badge>
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        )}
      </Paper>

      <RolloverModal opened={modalOpened} onClose={close} />
    </Stack>
  );
}
