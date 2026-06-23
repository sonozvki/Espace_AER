import { Modal, TextInput, Button, Group, Stack } from "@mantine/core";
import { useState } from "react";
import { useCreateMemo } from "../hooks";

interface Props {
  opened: boolean;
  onClose: () => void;
}

export function MemoFormModal({ opened, onClose }: Props) {
  const createMemo = useCreateMemo();
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError("Titre requis"); return; }
    createMemo.mutate(
      { title: title.trim(), chosesADire: "", activitesPge: "", activitesBachelor: "", autres: "" },
      {
        onSuccess: () => {
          setTitle("");
          setError("");
          onClose();
        },
      }
    );
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Nouveau mémo" size="sm">
      <form onSubmit={handleSubmit}>
        <Stack gap="sm">
          <TextInput
            label="Titre"
            placeholder="Réunion AER — 23 juin 2026"
            value={title}
            onChange={(e) => { setTitle(e.currentTarget.value); setError(""); }}
            error={error}
            data-autofocus
          />
          <Group justify="flex-end" mt="xs">
            <Button variant="default" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" loading={createMemo.isPending}>
              Créer
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
