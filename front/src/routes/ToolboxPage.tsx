import { useState } from "react";
import { Stack, Group, Title, Button, Text, Loader, Center, SimpleGrid, Modal } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconPlus } from "@tabler/icons-react";
import { useResources, useDeleteResource } from "@/features/toolbox/hooks";
import { ResourceCard } from "@/features/toolbox/components/ResourceCard";
import { ResourceFormModal } from "@/features/toolbox/components/ResourceFormModal";
import type { Resource } from "@/features/toolbox/types";

function groupByCategory(resources: Resource[]): Record<string, Resource[]> {
  return resources.reduce<Record<string, Resource[]>>((acc, r) => {
    (acc[r.category] ??= []).push(r);
    return acc;
  }, {});
}

export function ToolboxPage() {
  const { data: resources, isLoading } = useResources();
  const deleteResource = useDeleteResource();
  const [formOpened, { open, close }] = useDisclosure(false);
  const [toEdit, setToEdit] = useState<Resource | null>(null);
  const [toDelete, setToDelete] = useState<Resource | null>(null);

  const groups = groupByCategory(resources ?? []);

  function confirmDelete() {
    if (!toDelete) return;
    deleteResource.mutate(toDelete.id, { onSettled: () => setToDelete(null) });
  }

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Title order={2} ff="Anton, sans-serif">
          Toolbox
        </Title>
        <Button leftSection={<IconPlus size={16} />} onClick={open}>
          Ajouter
        </Button>
      </Group>

      {isLoading && (
        <Center h={200}>
          <Loader />
        </Center>
      )}

      {!isLoading && (resources ?? []).length === 0 && (
        <Center h={200}>
          <Text c="dimmed">Aucune ressource, ajoutez des liens utiles pour toute l'équipe.</Text>
        </Center>
      )}

      {Object.entries(groups).map(([category, items]) => (
        <Stack key={category} gap="xs">
          <Text fw={600} size="sm" c="dimmed" tt="uppercase" style={{ letterSpacing: "0.05em" }}>
            {category}
          </Text>
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="sm">
            {items.map((r) => (
              <ResourceCard
                key={r.id}
                resource={r}
                onEdit={() => setToEdit(r)}
                onDelete={() => setToDelete(r)}
              />
            ))}
          </SimpleGrid>
        </Stack>
      ))}

      <ResourceFormModal opened={formOpened} onClose={close} />

      {/* Édition — instance montée à la demande pour préremplir le formulaire */}
      {toEdit && (
        <ResourceFormModal opened resource={toEdit} onClose={() => setToEdit(null)} />
      )}

      <Modal
        opened={!!toDelete}
        onClose={() => setToDelete(null)}
        title="Supprimer la ressource"
        centered
        size="sm"
      >
        <Text size="sm" mb="xl">
          Supprimer <strong>{toDelete?.title}</strong> ? Cette action est irréversible.
        </Text>
        <Group justify="flex-end" gap="sm">
          <Button variant="default" onClick={() => setToDelete(null)}>
            Annuler
          </Button>
          <Button color="red" loading={deleteResource.isPending} onClick={confirmDelete}>
            Supprimer
          </Button>
        </Group>
      </Modal>
    </Stack>
  );
}
