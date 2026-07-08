import { useState, useEffect } from "react";
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
import { useCreateResource, useUploadResource, useUpdateResource } from "../hooks";
import { CATEGORIES } from "../types";
import type { Resource } from "../types";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 Mo, aligné sur le backend

// Ajoute https:// si le protocole manque ; null si l'URL reste invalide
function normalizeUrl(raw: string): string | null {
  const v = raw.trim();
  if (!v) return null;
  const withScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(v) ? v : `https://${v}`;
  try {
    new URL(withScheme);
    return withScheme;
  } catch {
    return null;
  }
}

interface Props {
  opened: boolean;
  onClose: () => void;
  /** Ressource à modifier — absent en mode création */
  resource?: Resource;
}

export function ResourceFormModal({ opened, onClose, resource }: Props) {
  const create = useCreateResource();
  const upload = useUploadResource();
  const update = useUpdateResource();

  const isEdit = !!resource;
  const isFileResource = !!resource?.fileName;
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
        return normalizeUrl(v) ? null : "URL invalide";
      },
      file: (v) => {
        if (mode !== "pdf") return null;
        if (!v) return isEdit ? null : "Fichier requis"; // en édition, remplacer est optionnel
        if (v.type !== "application/pdf") return "Seuls les PDF sont acceptés";
        if (v.size > MAX_FILE_SIZE) return "Fichier trop volumineux (10 Mo max)";
        return null;
      },
    },
  });

  // Préremplit le formulaire quand une ressource à éditer est fournie
  useEffect(() => {
    if (resource) {
      form.setValues({
        title: resource.title,
        url: resource.url ?? "",
        description: resource.description,
        category: resource.category,
        file: null,
      });
      setMode(resource.fileName ? "pdf" : "link");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resource?.id]);

  function handleSubmit(values: typeof form.values) {
    const common = {
      title: values.title.trim(),
      description: values.description,
      category: values.category,
    };
    const onSuccess = () => { form.reset(); setMode("link"); onClose(); };
    if (isEdit && resource) {
      const data = isFileResource ? common : { ...common, url: normalizeUrl(values.url) ?? values.url };
      update.mutate(
        { id: resource.id, data, file: isFileResource ? values.file : undefined },
        { onSuccess }
      );
    } else if (mode === "pdf") {
      upload.mutate({ ...common, file: values.file as File }, { onSuccess });
    } else {
      create.mutate({ ...common, url: normalizeUrl(values.url) ?? values.url }, { onSuccess });
    }
  }

  function handleClose() {
    form.reset();
    setMode("link");
    onClose();
  }

  const showUrlField = isEdit ? !isFileResource : mode === "link";

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={isEdit ? "Modifier la ressource" : "Ajouter une ressource"}
      size="md"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="sm">
          {!isEdit && (
            <SegmentedControl
              value={mode}
              onChange={(v) => setMode(v as "link" | "pdf")}
              data={[
                { label: "Lien", value: "link" },
                { label: "Fichier PDF", value: "pdf" },
              ]}
              fullWidth
            />
          )}
          <TextInput
            label="Titre"
            placeholder={mode === "pdf" ? "Guide de survie AER" : "Intranet Epitech"}
            required
            {...form.getInputProps("title")}
          />
          {showUrlField && (
            <TextInput
              label="URL"
              placeholder="https://intra.epitech.eu"
              required
              {...form.getInputProps("url")}
            />
          )}
          {!isEdit && mode === "pdf" && (
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
          {isEdit && isFileResource && (
            <FileInput
              label="Remplacer le PDF"
              description={`Fichier actuel : ${resource?.fileName}`}
              placeholder="Sélectionner un nouveau PDF (optionnel)"
              accept="application/pdf"
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
            <Button
              type="submit"
              loading={create.isPending || upload.isPending || update.isPending}
            >
              {isEdit ? "Enregistrer" : "Ajouter"}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
