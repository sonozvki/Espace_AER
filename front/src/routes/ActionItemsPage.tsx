import { useState } from "react";
import {
  Stack, Group, Title, Button, Loader, Center,
  Modal, Select, TextInput, Text,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconPlus } from "@tabler/icons-react";
import { useActionItems, useCreateActionItem } from "@/features/action-items/hooks";
import { ActionItemList } from "@/features/action-items/components/ActionItemList";
import { useMemos } from "@/features/memos/hooks";
import { useUsers } from "@/features/guards/hooks";

function CreateActionItemModal({ opened, onClose }: { opened: boolean; onClose: () => void }) {
  const create = useCreateActionItem();
  const { data: memos } = useMemos();
  const { data: users } = useUsers();

  const form = useForm({
    initialValues: {
      memoId: null as string | null,
      content: "",
      assigneeId: null as string | null,
      deadline: "",
    },
    validate: {
      memoId: (v) => v ? null : "Mémo requis",
      content: (v) => v.trim() ? null : "Contenu requis",
    },
  });

  function handleSubmit(values: typeof form.values) {
    create.mutate(
      {
        memoId: Number(values.memoId),
        content: values.content.trim(),
        assigneeId: values.assigneeId ? Number(values.assigneeId) : undefined,
        deadline: values.deadline || undefined,
      },
      { onSuccess: () => { form.reset(); onClose(); } }
    );
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Nouvelle action" size="sm">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="sm">
          <Select
            label="Mémo associé"
            placeholder="Choisir un mémo"
            data={(memos ?? []).map((m) => ({ value: String(m.id), label: m.title }))}
            searchable
            {...form.getInputProps("memoId")}
          />
          <TextInput
            label="Contenu"
            placeholder="Décrire l'action à faire"
            {...form.getInputProps("content")}
          />
          <Select
            label="Assigné à"
            placeholder="Optionnel"
            clearable
            data={(users ?? []).map((u) => ({ value: String(u.id), label: u.name }))}
            {...form.getInputProps("assigneeId")}
          />
          <TextInput
            label="Deadline"
            placeholder="YYYY-MM-DD"
            {...form.getInputProps("deadline")}
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
