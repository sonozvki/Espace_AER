import {
  Stack,
  Group,
  Text,
  Badge,
  ActionIcon,
  Paper,
  Select,
  Tooltip,
} from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";
import type { ActionItem, ActionStatus } from "../types";
import { STATUS_LABELS, STATUS_COLORS, STATUS_ORDER } from "../types";
import { useUpdateActionItem, useDeleteActionItem } from "../hooks";

function nextStatus(current: ActionStatus): ActionStatus {
  const idx = STATUS_ORDER.indexOf(current);
  return STATUS_ORDER[(idx + 1) % STATUS_ORDER.length]!;
}

function formatDeadline(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  const now = new Date();
  const overdue = d < now;
  const label = d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  return { label, overdue };
}

interface RowProps {
  item: ActionItem;
}

function ActionItemRow({ item }: RowProps) {
  const update = useUpdateActionItem();
  const remove = useDeleteActionItem();
  const deadline = formatDeadline(item.deadline);

  function cycleStatus() {
    update.mutate({ id: item.id, data: { status: nextStatus(item.status) } });
  }

  return (
    <Paper p="sm" withBorder style={{ borderColor: "var(--epi-border)" }}>
      <Group justify="space-between" wrap="nowrap" gap="sm">
        <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
          <Text size="sm" style={{ wordBreak: "break-word" }}>
            {item.content}
          </Text>
          <Group gap="xs">
            <Text size="xs" c="dimmed">
              {item.memo?.title ?? `Mémo #${item.memoId}`}
            </Text>
            {item.assignee && (
              <Text size="xs" c="dimmed">
                · {item.assignee.name}
              </Text>
            )}
            {deadline && (
              <Text size="xs" c={deadline.overdue && item.status !== "DONE" ? "red" : "dimmed"}>
                · {deadline.label}
              </Text>
            )}
          </Group>
        </Stack>

        <Group gap="xs" wrap="nowrap">
          <Tooltip label="Cliquer pour changer le statut" withArrow>
            <Badge
              color={STATUS_COLORS[item.status]}
              variant="light"
              size="sm"
              style={{ cursor: "pointer", userSelect: "none" }}
              onClick={cycleStatus}
            >
              {STATUS_LABELS[item.status]}
            </Badge>
          </Tooltip>

          <ActionIcon
            variant="subtle"
            color="red"
            size="sm"
            loading={remove.isPending}
            onClick={() => remove.mutate(item.id)}
            aria-label="Supprimer"
          >
            <IconTrash size={14} />
          </ActionIcon>
        </Group>
      </Group>
    </Paper>
  );
}

interface Props {
  items: ActionItem[];
  filterAssignee: string | null;
  filterStatus: string | null;
  onFilterAssignee: (v: string | null) => void;
  onFilterStatus: (v: string | null) => void;
}

export function ActionItemList({
  items,
  filterAssignee,
  filterStatus,
  onFilterAssignee,
  onFilterStatus,
}: Props) {
  const assignees = Array.from(
    new Map(
      items.filter((i) => i.assignee).map((i) => [i.assigneeId, i.assignee!])
    ).values()
  );

  const filtered = items.filter((item) => {
    if (filterAssignee && String(item.assigneeId) !== filterAssignee) return false;
    if (filterStatus && item.status !== filterStatus) return false;
    return true;
  });

  return (
    <Stack gap="sm">
      <Group gap="sm">
        <Select
          placeholder="Tous les AERs"
          size="sm"
          clearable
          value={filterAssignee}
          onChange={onFilterAssignee}
          data={assignees.map((u) => ({ value: String(u.id), label: u.name }))}
          style={{ width: 180 }}
        />
        <Select
          placeholder="Tous les statuts"
          size="sm"
          clearable
          value={filterStatus}
          onChange={onFilterStatus}
          data={STATUS_ORDER.map((s) => ({ value: s, label: STATUS_LABELS[s] }))}
          style={{ width: 160 }}
        />
        <Text size="sm" c="dimmed">
          {filtered.length} action{filtered.length !== 1 ? "s" : ""}
        </Text>
      </Group>

      {filtered.length === 0 ? (
        <Text c="dimmed" size="sm" ta="center" py="xl">
          Aucune action
        </Text>
      ) : (
        filtered.map((item) => <ActionItemRow key={item.id} item={item} />)
      )}
    </Stack>
  );
}
