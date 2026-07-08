import { useState } from "react";
import {
  Modal,
  TextInput,
  Textarea,
  Select,
  Button,
  Group,
  Stack,
  SegmentedControl,
  FileInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconFileTypePdf } from "@tabler/icons-react";
import { useCreateResource, useUploadResource } from "../hooks";
import { CATEGORIES } from "../types";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 Mo, aligné sur le backend

interface Props {
  opened: boolean;
  onClose: () => void;
}

export function ResourceFormModal({ opened, onClose }: Props) {
  const create = useCreateResource();
  const upload = useUploadResource();
  const [mode, setMode] = useState<"link" | "pdf">("link");

  const form = useForm({
    initialValues: {
      title: "",
      url: "",
      description: "",
      category: "Divers",
      file: null as File | null,
    },
    validate: {
      title: (v) => (v.trim() ? null : "Titre requis"),
      url: (v) => {
        if (mode !== "link") return null;
        if (!v.trim()) return "URL requise";
        try { new URL(v); return null; } catch { return "URL invalide"; }
      },
      file: (v) => {
        if (mode !== "pdf") return null;
        if (!v) return "Fichier requis";
        if (v.type !== "application/pdf") return "Seuls les PDF sont acceptés";
        if (v.size > MAX_FILE_SIZE) return "Fichier trop volumineux (10 Mo max)";
        return null;
      },
    },
  });

  function handleSubmit(values: typeof form.values) {
    const common = {
      title: values.title.trim(),
      description: values.description,
      category: values.category,
    };
    const onSuccess = () => { form.reset(); setMode("link"); onClose(); };
    if (mode === "pdf") {
      upload.mutate({ ...common, file: values.file as File }, { onSuccess });
    } else {
      create.mutate({ ...common, url: values.url.trim() }, { onSuccess });
    }
  }

  function handleClose() {
    form.reset();
    setMode("link");
    onClose();
  }

  return (
    <Modal opened={opened} onClose={handleClose} title="Ajouter une ressource" size="md">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="sm">
          <SegmentedControl
            value={mode}
            onChange={(v) => setMode(v as "link" | "pdf")}
            data={[
              { label: "Lien", value: "link" },
              { label: "Fichier PDF", value: "pdf" },
            ]}
            fullWidth
          />
          <TextInput
            label="Titre"
            placeholder={mode === "pdf" ? "Guide de survie AER" : "Intranet Epitech"}
            required
            {...form.getInputProps("title")}
          />
          {mode === "link" ? (
            <TextInput
              label="URL"
              placeholder="https://intra.epitech.eu"
              required
              {...form.getInputProps("url")}
            />
          ) : (
            <FileInput
              label="Fichier PDF"
              placeholder="Sélectionner un PDF (10 Mo max)"
              accept="application/pdf"
              required
              clearable
              leftSection={<IconFileTypePdf size={16} />}
              {...form.getInputProps("file")}
            />
          )}
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
            <Button type="submit" loading={create.isPending || upload.isPending}>
              Ajouter
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
