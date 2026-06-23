import { useState } from "react";
import {
  Stack,
  Group,
  Title,
  Button,
  TextInput,
  Loader,
  Center,
  Text,
  Modal,
} from "@mantine/core";
import { IconPlus, IconSearch } from "@tabler/icons-react";
import { useMemos, useDeleteMemo } from "@/features/memos/hooks";
import { MemoCard } from "@/features/memos/components/MemoCard";
import { MemoFormModal } from "@/features/memos/components/MemoFormModal";
import { MemoDetailDrawer } from "@/features/memos/components/MemoDetailDrawer";

export function MemosPage() {
  const { data: memos, isLoading } = useMemos();
  const deleteMemo = useDeleteMemo();

  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  const filtered = (memos ?? []).filter((m) =>
    m.title.toLowerCase().includes(search.toLowerCase())
  );

  function handleDeleteConfirm() {
    if (deleteTarget === null) return;
    deleteMemo.mutate(deleteTarget, {
      onSuccess: () => {
        if (selectedId === deleteTarget) setSelectedId(null);
        setDeleteTarget(null);
      },
    });
  }

  return (
    <>
      <Stack gap="md">
        <Group justify="space-between">
          <Title order={2} ff="Anton, sans-serif">
            Mémos
          </Title>
          <Button leftSection={<IconPlus size={16} />} onClick={() => setCreateOpen(true)}>
            Nouveau mémo
          </Button>
        </Group>

        <TextInput
          placeholder="Rechercher un mémo…"
          leftSection={<IconSearch size={14} />}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
        />

        {isLoading ? (
          <Center py="xl">
            <Loader />
          </Center>
        ) : filtered.length === 0 ? (
          <Text c="dimmed" ta="center" py="xl">
            {search ? "Aucun mémo trouvé" : "Aucun mémo, créez-en un !"}
          </Text>
        ) : (
          <Stack gap="xs">
            {filtered.map((memo) => (
              <MemoCard
                key={memo.id}
                memo={memo}
                onClick={() => setSelectedId(memo.id)}
                onDelete={(e) => {
                  e.stopPropagation();
                  setDeleteTarget(memo.id);
                }}
              />
            ))}
          </Stack>
        )}
      </Stack>

      <MemoFormModal opened={createOpen} onClose={() => setCreateOpen(false)} />

      {selectedId !== null && (
        <MemoDetailDrawer memoId={selectedId} onClose={() => setSelectedId(null)} />
      )}

      <Modal
        opened={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Supprimer le mémo ?"
        size="sm"
      >
        <Text size="sm" c="dimmed" mb="md">
          Cette action est irréversible. Les actions associées seront également supprimées.
        </Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={() => setDeleteTarget(null)}>
            Annuler
          </Button>
          <Button color="red" loading={deleteMemo.isPending} onClick={handleDeleteConfirm}>
            Supprimer
          </Button>
        </Group>
      </Modal>
    </>
  );
}
