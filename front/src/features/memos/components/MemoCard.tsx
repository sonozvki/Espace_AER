import { Paper, Group, Text, Stack, ActionIcon } from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";
import type { Memo } from "../types";

interface Props {
  memo: Memo;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function previewText(text: string, max = 100) {
  const stripped = text.replace(/#{1,6}\s/g, "").replace(/[*_`>-]/g, "").trim();
  const firstLine = stripped.split("\n").find((l) => l.trim().length > 0) ?? "";
  return firstLine.length > max ? firstLine.slice(0, max) + "…" : firstLine || null;
}

export function MemoCard({ memo, onClick, onDelete }: Props) {
  return (
    <Paper
      p="md"
      withBorder
      style={{ cursor: "pointer", borderColor: "var(--epi-border)" }}
      onClick={onClick}
    >
      <Group justify="space-between" wrap="nowrap">
        <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
          <Group gap="xs">
            <Text fw={600} size="sm" truncate>
              {memo.title}
            </Text>
          </Group>
          <Text size="xs" c="dimmed">
            {formatDate(memo.createdAt)}
          </Text>
          {previewText(memo.content) && (
            <Text size="xs" c="dimmed" lineClamp={1}>
              {previewText(memo.content)}
            </Text>
          )}
        </Stack>
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
    </Paper>
  );
}
