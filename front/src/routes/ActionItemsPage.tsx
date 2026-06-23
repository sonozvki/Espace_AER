import { useState } from "react";
import {
  Stack,
  Group,
  Title,
  Button,
  Loader,
  Center,
  Modal,
  Select,
  TextInput,
  Text,
} from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { useActionItems, useCreateActionItem } from "@/features/action-items/hooks";
import { ActionItemList } from "@/features/action-items/components/ActionItemList";
import { useMemos } from "@/features/memos/hooks";
import { useUsers } from "@/features/guards/hooks";

function CreateActionItemModal({
  opened,
  onClose,
}: {
  opened: boolean;
  onClose: () => void;
}) {
  const create = useCreateActionItem();
  const { data: memos } = useMemos();
  const { data: users } = useUsers();

  const [memoId, setMemoId] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [deadline, setDeadline] = useState("");
  const [errors, setErrors] = useState<{ memoId?: string; content?: string }>({});

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newErrors: typeof errors = {};
    if (!memoId) newErrors.memoId = "Mémo requis";
    if (!content.trim()) newErrors.content = "Contenu requis";
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    create.mutate(
      {
        memoId: Number(memoId),
        content: content.trim(),
        assigneeId: assigneeId ? Number(assigneeId) : undefined,
        deadline: deadline || undefined,
      },
      {
        onSuccess: () => {
          setMemoId(null); setContent(""); setAssigneeId(null); setDeadline(""); setErrors({});
          onClose();
        },
      }
    );
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Nouvelle action" size="sm">
      <form onSubmit={handleSubmit}>
        <Stack gap="sm">
          <Select
            label="Mémo associé"
            placeholder="Choisir un mémo"
            data={(memos ?? []).map((m) => ({ value: String(m.id), label: m.title }))}
            value={memoId}
            onChange={(v) => { setMemoId(v); setErrors((e) => ({ ...e, memoId: undefined })); }}
            error={errors.memoId}
            searchable
          />
          <TextInput
            label="Contenu"
            placeholder="Décrire l'action à faire"
            value={content}
            onChange={(e) => { setContent(e.currentTarget.value); setErrors((e2) => ({ ...e2, content: undefined })); }}
            error={errors.content}
          />
          <Select
            label="Assigné à"
            placeholder="Optionnel"
            clearable
            data={(users ?? []).map((u) => ({ value: String(u.id), label: u.name }))}
            value={assigneeId}
            onChange={setAssigneeId}
          />
          <TextInput
            label="Deadline"
            placeholder="YYYY-MM-DD"
            value={deadline}
            onChange={(e) => setDeadline(e.currentTarget.value)}
          />
          <Group justify="flex-end" mt="xs">
            <Button variant="default" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" loading={create.isPending}>
              Créer
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

export function ActionItemsPage() {
  const { data: actionItems, isLoading } = useActionItems();
  const [createOpen, setCreateOpen] = useState(false);
  const [filterAssignee, setFilterAssignee] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  const pendingCount = (actionItems ?? []).filter((i) => i.status === "PENDING").length;

  return (
    <>
      <Stack gap="md">
        <Group justify="space-between">
          <Group gap="sm">
            <Title order={2} ff="Anton, sans-serif">
              Actions
            </Title>
            {pendingCount > 0 && (
              <Text size="sm" c="orange">
                {pendingCount} à faire
              </Text>
            )}
          </Group>
          <Button leftSection={<IconPlus size={16} />} onClick={() => setCreateOpen(true)}>
            Nouvelle action
          </Button>
        </Group>

        {isLoading ? (
          <Center py="xl">
            <Loader />
          </Center>
        ) : (
          <ActionItemList
            items={actionItems ?? []}
            filterAssignee={filterAssignee}
            filterStatus={filterStatus}
            onFilterAssignee={setFilterAssignee}
            onFilterStatus={setFilterStatus}
          />
        )}
      </Stack>

      <CreateActionItemModal opened={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  );
}
