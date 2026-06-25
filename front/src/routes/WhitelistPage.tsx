import { Stack, Group, Title, Button, Text, Loader, Center, Table, ActionIcon, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconTrash, IconPlus } from "@tabler/icons-react";
import { useWhitelist, useAddToWhitelist, useRemoveFromWhitelist } from "@/features/whitelist/hooks";

export function WhitelistPage() {
  const { data: entries, isLoading } = useWhitelist();
  const add = useAddToWhitelist();
  const remove = useRemoveFromWhitelist();

  const form = useForm({
    initialValues: { email: "" },
    validate: {
      email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : "Email invalide",
    },
  });

  function handleSubmit(values: { email: string }) {
    add.mutate(values.email, { onSuccess: () => form.reset() });
  }

  return (
    <Stack gap="lg">
      <Title order={2} ff="Anton, sans-serif">
        Whitelist
      </Title>

      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Group align="flex-end">
          <TextInput
            label="Ajouter un email"
            placeholder="prenom.nom@epitech.eu"
            style={{ flex: 1 }}
            {...form.getInputProps("email")}
          />
          <Button type="submit" leftSection={<IconPlus size={16} />} loading={add.isPending}>
            Ajouter
          </Button>
        </Group>
      </form>

      {isLoading && (
        <Center h={200}>
          <Loader />
        </Center>
      )}

      {!isLoading && (entries ?? []).length === 0 && (
        <Center h={200}>
          <Text c="dimmed">Aucun email dans la whitelist.</Text>
        </Center>
      )}

      {(entries ?? []).length > 0 && (
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Email</Table.Th>
              <Table.Th>Ajouté le</Table.Th>
              <Table.Th w={48} />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {(entries ?? []).map((entry) => (
              <Table.Tr key={entry.id}>
                <Table.Td>{entry.email}</Table.Td>
                <Table.Td>{new Date(entry.createdAt).toLocaleDateString("fr-FR")}</Table.Td>
                <Table.Td>
                  <ActionIcon
                    color="red"
                    variant="subtle"
                    onClick={() => remove.mutate(entry.email)}
                    loading={remove.isPending}
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Stack>
  );
}
