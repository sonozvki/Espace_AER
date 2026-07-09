import { Paper, Group, Text, ActionIcon, Anchor, Stack } from "@mantine/core";
import {
  IconTrash,
  IconPencil,
  IconLink,
  IconBrandDiscord,
  IconFileText,
  IconTool,
  IconSchool,
  IconFileTypePdf,
} from "@tabler/icons-react";
import type { Resource } from "../types";
import { toolboxApi } from "../api";

const CATEGORY_META: Record<string, { icon: React.ReactNode; color: string }> = {
  "Intra Epitech": { icon: <IconSchool size={16} />, color: "blue" },
  Workshop: { icon: <IconFileText size={16} />, color: "violet" },
  Documents: { icon: <IconFileText size={16} />, color: "teal" },
  Outils: { icon: <IconTool size={16} />, color: "orange" },
};

function getMeta(category: string) {
  return CATEGORY_META[category] ?? { icon: <IconLink size={16} />, color: "gray" };
}

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  return `${Math.max(1, Math.round(bytes / 1024))} Ko`;
}

interface Props {
  resource: Resource;
  onEdit: () => void;
  onDelete: () => void;
}

export function ResourceCard({ resource, onEdit, onDelete }: Props) {
  const isFile = resource.fileName !== null;
  const meta = isFile
    ? { icon: <IconFileTypePdf size={16} />, color: "red" }
    : getMeta(resource.category);
  const href = isFile ? toolboxApi.fileUrl(resource.id) : resource.url ?? "#";

  return (
    <Paper p="md" withBorder style={{ borderColor: "var(--epi-border)" }}>
      <Group justify="space-between" wrap="nowrap" align="flex-start">
        <Group gap="sm" wrap="nowrap" align="flex-start" style={{ flex: 1, minWidth: 0 }}>
          <Text c={meta.color} mt={2}>
            {meta.icon}
          </Text>
          <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
            <Anchor
              href={href}
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
              {isFile
                ? `${resource.fileName}${resource.fileSize ? ` · ${formatSize(resource.fileSize)}` : ""}`
                : resource.url}
            </Text>
          </Stack>
        </Group>
        <Group gap={2} wrap="nowrap" style={{ flexShrink: 0 }}>
          <ActionIcon
            variant="subtle"
            color="gray"
            size="sm"
            onClick={onEdit}
            aria-label="Modifier"
          >
            <IconPencil size={14} />
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            color="red"
            size="sm"
            onClick={onDelete}
            aria-label="Supprimer"
          >
            <IconTrash size={14} />
          </ActionIcon>
        </Group>
      </Group>
    </Paper>
  );
}
