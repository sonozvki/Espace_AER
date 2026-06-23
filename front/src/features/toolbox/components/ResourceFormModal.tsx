import { Modal, TextInput, Textarea, Select, Button, Group, Stack } from "@mantine/core";
import { useState } from "react";
import { useCreateResource } from "../hooks";
import { CATEGORIES } from "../types";

interface Props {
  opened: boolean;
  onClose: () => void;
}

const EMPTY = { title: "", url: "", description: "", category: "Divers" };

export function ResourceFormModal({ opened, onClose }: Props) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<Partial<typeof EMPTY>>({});
  const create = useCreateResource();

  function set(field: keyof typeof EMPTY, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: "" }));
  }

  function validate() {
    const e: Partial<typeof EMPTY> = {};
    if (!form.title.trim()) e.title = "Titre requis";
    if (!form.url.trim()) e.url = "URL requise";
    else {
      try { new URL(form.url); } catch { e.url = "URL invalide"; }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    create.mutate(
      { ...form, title: form.title.trim(), url: form.url.trim() },
      {
        onSuccess: () => {
          setForm(EMPTY);
          onClose();
        },
      }
    );
  }

  function handleClose() {
    setForm(EMPTY);
    setErrors({});
    onClose();
  }

  return (
    <Modal opened={opened} onClose={handleClose} title="Ajouter une ressource" size="md">
      <Stack gap="sm">
        <TextInput
          label="Titre"
          placeholder="Intranet Epitech"
          value={form.title}
          onChange={(e) => set("title", e.currentTarget.value)}
          error={errors.title}
          required
        />
        <TextInput
          label="URL"
          placeholder="https://intra.epitech.eu"
          value={form.url}
          onChange={(e) => set("url", e.currentTarget.value)}
          error={errors.url}
          required
        />
        <Select
          label="Catégorie"
          data={CATEGORIES as unknown as string[]}
          value={form.category}
          onChange={(v) => set("category", v ?? "Divers")}
          allowDeselect={false}
        />
        <Textarea
          label="Description"
          placeholder="Accès à l'intranet Epitech (notes, projets…)"
          value={form.description}
          onChange={(e) => set("description", e.currentTarget.value)}
          rows={2}
        />
        <Group justify="flex-end" mt="xs">
          <Button variant="default" onClick={handleClose}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} loading={create.isPending}>
            Ajouter
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
