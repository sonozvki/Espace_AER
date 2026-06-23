import { Drawer, Stack, TextInput, Button, Group, Tabs, Textarea, Text, Loader, Center } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useEffect } from "react";
import { useMemo, useUpdateMemo } from "../hooks";

const SECTIONS = [
  { key: "chosesADire" as const, label: "Choses à dire" },
  { key: "activitesPge" as const, label: "Activités PGE" },
  { key: "activitesBachelor" as const, label: "Activités Bachelor" },
  { key: "autres" as const, label: "Autres" },
];

interface Props {
  memoId: number;
  onClose: () => void;
}

export function MemoDetailDrawer({ memoId, onClose }: Props) {
  const { data: memo, isLoading } = useMemo(memoId);
  const updateMemo = useUpdateMemo();

  const form = useForm({
    initialValues: {
      title: "",
      chosesADire: "",
      activitesPge: "",
      activitesBachelor: "",
      autres: "",
    },
  });

  useEffect(() => {
    if (memo) {
      form.setValues({
        title: memo.title,
        chosesADire: memo.chosesADire,
        activitesPge: memo.activitesPge,
        activitesBachelor: memo.activitesBachelor,
        autres: memo.autres,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memo?.id]);

  function handleSave() {
    updateMemo.mutate({ id: memoId, data: form.values });
  }

  return (
    <Drawer
      opened
      onClose={onClose}
      position="right"
      size="xl"
      title={
        <TextInput
          variant="unstyled"
          fw={600}
          size="md"
          {...form.getInputProps("title")}
          style={{ width: 360 }}
        />
      }
    >
      {isLoading ? (
        <Center h={200}>
          <Loader />
        </Center>
      ) : (
        <Stack gap="md" h="100%" style={{ overflow: "auto" }}>
          <Tabs defaultValue="chosesADire" variant="outline">
            <Tabs.List>
              {SECTIONS.map((s) => (
                <Tabs.Tab key={s.key} value={s.key}>
                  {s.label}
                </Tabs.Tab>
              ))}
            </Tabs.List>

            {SECTIONS.map((s) => (
              <Tabs.Panel key={s.key} value={s.key} pt="md">
                <Tabs variant="pills" defaultValue="edit">
                  <Tabs.List mb="xs">
                    <Tabs.Tab value="edit">Éditer</Tabs.Tab>
                    <Tabs.Tab value="preview">Aperçu</Tabs.Tab>
                  </Tabs.List>
                  <Tabs.Panel value="edit">
                    <Textarea
                      {...form.getInputProps(s.key)}
                      autosize
                      minRows={8}
                      maxRows={20}
                      placeholder={`Contenu Markdown pour «${s.label}»…`}
                      styles={{ input: { fontFamily: "monospace", fontSize: 13 } }}
                    />
                  </Tabs.Panel>
                  <Tabs.Panel value="preview">
                    <Text
                      size="sm"
                      component="pre"
                      style={{
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        fontFamily: '"IBM Plex Sans", sans-serif',
                        margin: 0,
                        padding: "8px 0",
                        minHeight: 120,
                        color: "var(--mantine-color-gray-3)",
                      }}
                    >
                      {form.values[s.key] || (
                        <span style={{ color: "var(--epi-ghost)" }}>Aucun contenu</span>
                      )}
                    </Text>
                  </Tabs.Panel>
                </Tabs>
              </Tabs.Panel>
            ))}
          </Tabs>

          <Group justify="flex-end" mt="auto" pt="md" style={{ borderTop: "1px solid var(--epi-border)" }}>
            <Button variant="default" onClick={onClose}>
              Fermer
            </Button>
            <Button onClick={handleSave} loading={updateMemo.isPending}>
              Enregistrer
            </Button>
          </Group>
        </Stack>
      )}
    </Drawer>
  );
}
