import { Paper, Group, Text, Badge, Stack, ActionIcon } from "@mantine/core";
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

function previewText(text: string, max = 80) {
  const stripped = text.replace(/[#*_`>-]/g, "").trim();
  return stripped.length > max ? stripped.slice(0, max) + "…" : stripped || null;
}

export function MemoCard({ memo, onClick, onDelete }: Props) {
  const pendingCount = memo.actionItems.filter((a) => a.status === "PENDING").length;

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
            {pendingCount > 0 && (
              <Badge size="xs" color="orange" variant="light">
                {pendingCount} action{pendingCount > 1 ? "s" : ""}
              </Badge>
            )}
          </Group>
          <Text size="xs" c="dimmed">
            {formatDate(memo.createdAt)}
          </Text>
          {previewText(memo.chosesADire) && (
            <Text size="xs" c="dimmed" lineClamp={1}>
              {previewText(memo.chosesADire)}
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
