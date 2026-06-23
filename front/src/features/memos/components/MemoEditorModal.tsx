import { Modal, TextInput, Button, Group, Tabs, Text, Loader, Center, Stack } from "@mantine/core";
import { useState, useEffect } from "react";
import MDEditor from "@uiw/react-md-editor";
import { useMemo, useCreateMemo, useUpdateMemo } from "../hooks";

const SECTIONS = [
  { key: "chosesADire" as const, label: "Choses à dire" },
  { key: "activitesPge" as const, label: "Activités PGE" },
  { key: "activitesBachelor" as const, label: "Activités Bachelor" },
  { key: "autres" as const, label: "Autres" },
];

type SectionKey = (typeof SECTIONS)[number]["key"];
type Fields = { title: string } & Record<SectionKey, string>;

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
  /** Si fourni : mode édition. Sinon : mode création. */
  memoId?: number | null;
}

export function MemoEditorModal({ opened, onClose, memoId }: Props) {
  const isEdit = !!memoId;
  const { data: memo, isLoading } = useMemo(memoId ?? null);
  const createMemo = useCreateMemo();
  const updateMemo = useUpdateMemo();

  const [fields, setFields] = useState<Fields>({
    title: todayTitle(),
    chosesADire: "",
    activitesPge: "",
    activitesBachelor: "",
    autres: "",
  });
  const [titleError, setTitleError] = useState("");

  // En mode édition, charger les données dès que le mémo est disponible
  useEffect(() => {
    if (isEdit && memo) {
      setFields({
        title: memo.title,
        chosesADire: memo.chosesADire,
        activitesPge: memo.activitesPge,
        activitesBachelor: memo.activitesBachelor,
        autres: memo.autres,
      });
    }
  }, [memo?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // En mode création, reset à chaque ouverture
  useEffect(() => {
    if (opened && !isEdit) {
      setFields({ title: todayTitle(), chosesADire: "", activitesPge: "", activitesBachelor: "", autres: "" });
      setTitleError("");
    }
  }, [opened, isEdit]);

  function set(key: keyof Fields, val: string) {
    setFields((f) => ({ ...f, [key]: val }));
  }

  function handleSave() {
    if (!fields.title.trim()) { setTitleError("Titre requis"); return; }
    const data = {
      title: fields.title.trim(),
      chosesADire: fields.chosesADire,
      activitesPge: fields.activitesPge,
      activitesBachelor: fields.activitesBachelor,
      autres: fields.autres,
    };
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
        body: { display: "flex", flexDirection: "column", height: "calc(100vh - 120px)", padding: 0 },
        content: { display: "flex", flexDirection: "column" },
      }}
    >
      {isEdit && isLoading ? (
        <Center h={300}><Loader /></Center>
      ) : (
        <Stack gap="md" style={{ flex: 1, overflow: "hidden", padding: "16px 24px" }}>
          <TextInput
            label="Titre"
            value={fields.title}
            onChange={(e) => { set("title", e.currentTarget.value); setTitleError(""); }}
            error={titleError}
            size="md"
            styles={{ input: { fontFamily: '"Anton", sans-serif', fontSize: 18 } }}
          />

          <Tabs
            defaultValue="chosesADire"
            style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}
            styles={{ panel: { flex: 1, overflow: "auto", paddingTop: 12 } }}
          >
            <Tabs.List>
              {SECTIONS.map((s) => (
                <Tabs.Tab key={s.key} value={s.key}>
                  {s.label}
                </Tabs.Tab>
              ))}
            </Tabs.List>

            {SECTIONS.map((s) => (
              <Tabs.Panel key={s.key} value={s.key}>
                <Text size="xs" c="dimmed" mb={6}>
                  Markdown supporté — l'aperçu s'affiche en temps réel à droite.
                </Text>
                <div data-color-mode="dark">
                  <MDEditor
                    value={fields[s.key]}
                    onChange={(v) => set(s.key, v ?? "")}
                    preview="live"
                    height={400}
                    style={{ background: "var(--epi-surface)" }}
                  />
                </div>
              </Tabs.Panel>
            ))}
          </Tabs>

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
