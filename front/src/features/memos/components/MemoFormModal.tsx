import { Modal, TextInput, Button, Group, Stack } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useCreateMemo } from "../hooks";

interface Props {
  opened: boolean;
  onClose: () => void;
}

export function MemoFormModal({ opened, onClose }: Props) {
  const createMemo = useCreateMemo();

  const form = useForm({
    initialValues: {
      title: "",
      chosesADire: "",
      activitesPge: "",
      activitesBachelor: "",
      autres: "",
    },
    validate: {
      title: (v) => (v.trim().length === 0 ? "Titre requis" : null),
    },
  });

  function handleSubmit(values: typeof form.values) {
    createMemo.mutate(values, {
      onSuccess: () => {
        form.reset();
        onClose();
      },
    });
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Nouveau mémo" size="sm">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="sm">
          <TextInput
            label="Titre"
            placeholder="Réunion AER — 20 juin 2026"
            {...form.getInputProps("title")}
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
