import { Modal, TextInput, Textarea, Select, Button, Group, Stack } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useCreateResource } from "../hooks";
import { CATEGORIES } from "../types";

interface Props {
  opened: boolean;
  onClose: () => void;
}

export function ResourceFormModal({ opened, onClose }: Props) {
  const create = useCreateResource();

  const form = useForm({
    initialValues: { title: "", url: "", description: "", category: "Divers" },
    validate: {
      title: (v) => v.trim() ? null : "Titre requis",
      url: (v) => {
        if (!v.trim()) return "URL requise";
        try { new URL(v); return null; } catch { return "URL invalide"; }
      },
    },
  });

  function handleSubmit(values: typeof form.values) {
    create.mutate(
      { ...values, title: values.title.trim(), url: values.url.trim() },
      { onSuccess: () => { form.reset(); onClose(); } }
    );
  }

  function handleClose() {
    form.reset();
    onClose();
  }

  return (
    <Modal opened={opened} onClose={handleClose} title="Ajouter une ressource" size="md">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="sm">
          <TextInput
            label="Titre"
            placeholder="Intranet Epitech"
            required
            {...form.getInputProps("title")}
          />
          <TextInput
            label="URL"
            placeholder="https://intra.epitech.eu"
            required
            {...form.getInputProps("url")}
          />
          <Select
            label="Catégorie"
            data={CATEGORIES as unknown as string[]}
            allowDeselect={false}
            {...form.getInputProps("category")}
          />
          <Textarea
            label="Description"
            placeholder="Accès à l'intranet Epitech (notes, projets…)"
            rows={2}
            {...form.getInputProps("description")}
          />
          <Group justify="flex-end" mt="xs">
            <Button variant="default" onClick={handleClose}>
              Annuler
            </Button>
            <Button type="submit" loading={create.isPending}>
              Ajouter
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
