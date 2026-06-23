import { Stack, Group, Title, Button, Text, Loader, Center, SimpleGrid } from "@mantine/core";
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
  const [opened, { open, close }] = useDisclosure(false);

  const groups = groupByCategory(resources ?? []);

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
                onDelete={() => deleteResource.mutate(r.id)}
              />
            ))}
          </SimpleGrid>
        </Stack>
      ))}

      <ResourceFormModal opened={opened} onClose={close} />
    </Stack>
  );
}
