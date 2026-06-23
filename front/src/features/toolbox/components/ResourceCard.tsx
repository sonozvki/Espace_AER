import { Paper, Group, Text, Badge, ActionIcon, Anchor, Stack } from "@mantine/core";
import {
  IconTrash,
  IconLink,
  IconBrandDiscord,
  IconFileText,
  IconTool,
  IconSchool,
} from "@tabler/icons-react";
import type { Resource } from "../types";

const CATEGORY_META: Record<string, { icon: React.ReactNode; color: string }> = {
  "Intra Epitech": { icon: <IconSchool size={16} />, color: "blue" },
  Discord: { icon: <IconBrandDiscord size={16} />, color: "violet" },
  Documents: { icon: <IconFileText size={16} />, color: "teal" },
  Outils: { icon: <IconTool size={16} />, color: "orange" },
};

function getMeta(category: string) {
  return CATEGORY_META[category] ?? { icon: <IconLink size={16} />, color: "gray" };
}

interface Props {
  resource: Resource;
  onDelete: () => void;
}

export function ResourceCard({ resource, onDelete }: Props) {
  const meta = getMeta(resource.category);

  return (
    <Paper p="md" withBorder style={{ borderColor: "var(--epi-border)" }}>
      <Group justify="space-between" wrap="nowrap" align="flex-start">
        <Group gap="sm" wrap="nowrap" align="flex-start" style={{ flex: 1, minWidth: 0 }}>
          <Text c={meta.color} mt={2}>
            {meta.icon}
          </Text>
          <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
            <Anchor
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              fw={600}
              size="sm"
              truncate
            >
              {resource.title}
            </Anchor>
            {resource.description && (
              <Text size="xs" c="dimmed" lineClamp={2}>
                {resource.description}
              </Text>
            )}
            <Text size="xs" c="dimmed" truncate style={{ opacity: 0.6 }}>
              {resource.url}
            </Text>
          </Stack>
        </Group>
        <ActionIcon
          variant="subtle"
          color="red"
          size="sm"
          onClick={onDelete}
          aria-label="Supprimer"
          style={{ flexShrink: 0 }}
        >
          <IconTrash size={14} />
        </ActionIcon>
      </Group>
    </Paper>
  );
}
