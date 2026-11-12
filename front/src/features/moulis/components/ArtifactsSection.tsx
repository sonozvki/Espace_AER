import { useState } from "react";
import {
  Stack, Group, Text, Button, ActionIcon, Tooltip, Modal, Code, ScrollArea, Center, Loader, Badge, rem,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconDownload, IconEye, IconFileText } from "@tabler/icons-react";
import { fetchArtifact } from "../api";
import type { BuildArtifact } from "../types";

// Affichés en texte brut dans l'Espace AER (jamais interprétés, même le HTML)
const TEXT_EXT = /\.(txt|log|json|xml|md|csv|ya?ml|html?|out|err|c|h|py|sh)$/i;

function isTrace(a: BuildArtifact) {
  return /trace/i.test(a.relativePath);
}

function prettify(fileName: string, text: string) {
  if (!/\.json$/i.test(fileName)) return text;
  try { return JSON.stringify(JSON.parse(text), null, 2); } catch { return text; }
}

function triggerDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function ArtifactsSection({
  module, project, group, buildNumber, artifacts,
}: {
  module: string;
  project: string;
  group: string;
  buildNumber: number | null;
  artifacts: BuildArtifact[];
}) {
  const [viewing, setViewing] = useState<{ artifact: BuildArtifact; content: string | null } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  if (buildNumber === null || artifacts.length === 0) {
    return <Text size="sm" c="dimmed">Aucun fichier généré pour ce build.</Text>;
  }
  const build = buildNumber;

  // Trace pédago en premier, puis ordre alphabétique
  const sorted = [...artifacts].sort((a, b) =>
    Number(isTrace(b)) - Number(isTrace(a)) || a.relativePath.localeCompare(b.relativePath)
  );

  async function load(a: BuildArtifact) {
    setBusy(a.relativePath);
    try {
      return await fetchArtifact(module, project, group, build, a.relativePath);
    } catch {
      notifications.show({ message: `Impossible de récupérer ${a.fileName}`, color: "red" });
      return null;
    } finally {
      setBusy(null);
    }
  }

  async function view(a: BuildArtifact) {
    setViewing({ artifact: a, content: null });
    const blob = await load(a);
    if (!blob) { setViewing(null); return; }
    setViewing({ artifact: a, content: prettify(a.fileName, await blob.text()) });
  }

  async function download(a: BuildArtifact) {
    const blob = await load(a);
    if (blob) triggerDownload(blob, a.fileName);
  }

  return (
    <>
      <Stack gap={6}>
        {sorted.map((a) => (
          <Group key={a.relativePath} justify="space-between" wrap="nowrap" gap="xs">
            <Group gap="xs" wrap="nowrap" style={{ minWidth: 0 }}>
              <IconFileText size={14} style={{ flexShrink: 0 }} />
              <Text size="xs" ff="monospace" truncate title={a.relativePath}>{a.relativePath}</Text>
              {isTrace(a) && <Badge size="xs" variant="light" color="epitech">trace</Badge>}
            </Group>
            <Group gap={4} wrap="nowrap">
              {TEXT_EXT.test(a.fileName) && (
                <Tooltip label="Afficher" withArrow>
                  <ActionIcon variant="subtle" size="sm" onClick={() => view(a)} aria-label={`Afficher ${a.fileName}`}>
                    <IconEye size={14} />
                  </ActionIcon>
                </Tooltip>
              )}
              <Tooltip label="Télécharger" withArrow>
                <ActionIcon
                  variant="subtle"
                  size="sm"
                  loading={busy === a.relativePath && !viewing}
                  onClick={() => download(a)}
                  aria-label={`Télécharger ${a.fileName}`}
                >
                  <IconDownload size={14} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Group>
        ))}
      </Stack>

      <Modal
        opened={!!viewing}
        onClose={() => setViewing(null)}
        size="80%"
        centered
        title={<Text fw={600} ff="monospace" size="sm">{viewing?.artifact.relativePath} · #{build}</Text>}
        scrollAreaComponent={ScrollArea.Autosize}
      >
        {viewing?.content === null ? (
          <Center py="xl"><Loader /></Center>
        ) : (
          <Stack gap="sm">
            <Group justify="flex-end">
              <Button
                size="xs"
                variant="light"
                leftSection={<IconDownload size={14} />}
                onClick={() => viewing && download(viewing.artifact)}
              >
                Télécharger
              </Button>
            </Group>
            <Code block style={{ fontSize: rem(12), whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
              {viewing?.content || "(fichier vide)"}
            </Code>
          </Stack>
        )}
      </Modal>
    </>
  );
}
