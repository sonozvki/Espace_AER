import { Modal, TextInput, Button, Group, Text, Loader, Center, Stack, SegmentedControl } from "@mantine/core";
import { useState, useEffect } from "react";
import { useMediaQuery } from "@mantine/hooks";
import MDEditor from "@uiw/react-md-editor";
import { useMemo, useCreateMemo, useUpdateMemo } from "../hooks";

// autre template
// | Jour        | AER |
// |-------------|-----|
// | Lundi       |     |
// | Mardi       |     |
// | Mercredi    |     |
// | Jeudi       |     |
// | Vendredi    |     |
// | Samedi      |     |


const DEFAULT_TEMPLATE = `## Les gardes

- Lundi :
- Mardi :
- Mercredi :
- Jeudi :
- Vendredi :
- Samedi :

## Activités PGE


## Activités Bachelor


## Autres

`;

function todayTitle() {
  const s = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

interface Props {
  opened: boolean;
  onClose: () => void;
  memoId?: number | null;
}

export function MemoEditorModal({ opened, onClose, memoId }: Props) {
  const isEdit = !!memoId;
  const { data: memo, isLoading } = useMemo(memoId ?? null);
  const createMemo = useCreateMemo();
  const updateMemo = useUpdateMemo();
  const isMobile = !useMediaQuery("(min-width: 768px)");

  const [title, setTitle] = useState(todayTitle());
  const [content, setContent] = useState(DEFAULT_TEMPLATE);
  const [titleError, setTitleError] = useState("");
  const [previewMode, setPreviewMode] = useState<"edit" | "preview">("edit");

  useEffect(() => {
    if (isEdit && memo) {
      setTitle(memo.title);
      setContent(memo.content);
    }
  }, [memo?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (opened && !isEdit) {
      setTitle(todayTitle());
      setContent(DEFAULT_TEMPLATE);
      setTitleError("");
    }
  }, [opened, isEdit]);

  function handleSave() {
    if (!title.trim()) { setTitleError("Titre requis"); return; }
    const data = { title: title.trim(), content };
    if (isEdit && memoId) {
      updateMemo.mutate({ id: memoId, data }, { onSuccess: onClose });
    } else {
      createMemo.mutate(data, { onSuccess: onClose });
    }
  }

  const isPending = createMemo.isPending || updateMemo.isPending;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={isEdit ? "Modifier le mémo" : "Nouveau mémo"}
      size="calc(100vw - 40px)"
      styles={{
        body: {
          display: "flex",
          flexDirection: "column",
          height: "calc(100vh - 120px)",
          padding: 0,
          overflow: "hidden",
        },
        content: { display: "flex", flexDirection: "column" },
      }}
    >
      {isEdit && isLoading ? (
        <Center h={300}><Loader /></Center>
      ) : (
        <Stack gap="md" style={{ flex: 1, overflow: "hidden", padding: "16px 24px" }}>
          <TextInput
            label="Titre"
            value={title}
            onChange={(e) => { setTitle(e.currentTarget.value); setTitleError(""); }}
            error={titleError}
            size="md"
            styles={{ input: { fontFamily: '"Anton", sans-serif', fontSize: 18 } }}
          />

          {isMobile && (
            <SegmentedControl
              value={previewMode}
              onChange={(v) => setPreviewMode(v as "edit" | "preview")}
              data={[
                { value: "edit", label: "Édition" },
                { value: "preview", label: "Aperçu" },
              ]}
              fullWidth
              size="sm"
            />
          )}

          {!isMobile && (
            <Text size="xs" c="dimmed">
              Markdown supporté, aperçu en temps réel à droite.
            </Text>
          )}

          <div data-color-mode="dark" style={{ flex: 1, overflow: "hidden" }}>
            <MDEditor
              value={content}
              onChange={(v) => setContent(v ?? "")}
              preview={isMobile ? previewMode : "live"}
              height="100%"
              style={{ height: "100%" }}
              visibleDragbar={isMobile ? false : true}
            />
          </div>

          <Group
            justify="flex-end"
            pt="md"
            style={{ borderTop: "1px solid var(--epi-border)", flexShrink: 0 }}
          >
            <Button variant="default" onClick={onClose}>
              Annuler
            </Button>
            <Button onClick={handleSave} loading={isPending}>
              {isEdit ? "Enregistrer" : "Créer le mémo"}
            </Button>
          </Group>
        </Stack>
      )}
    </Modal>
  );
}
