import { useMemo, useState } from "react";
import {
  Grid,
  Paper,
  Text,
  Stack,
  Group,
  ActionIcon,
  Badge,
  Box,
  Tooltip,
} from "@mantine/core";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import type { Memo } from "../types";

const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

interface Props {
  memos: Memo[];
  onOpenMemo: (id: number) => void;
}

export function MemoCalendarView({ memos, onOpenMemo }: Props) {
  const [year, setYear] = useState(new Date().getFullYear());

  const byMonth = useMemo(() => {
    const map = new Map<number, Memo[]>();
    for (let i = 0; i < 12; i++) map.set(i, []);
    for (const memo of memos) {
      const d = new Date(memo.createdAt);
      if (d.getFullYear() === year) {
        map.get(d.getMonth())!.push(memo);
      }
    }
    return map;
  }, [memos, year]);

  const totalYear = memos.filter((m) => new Date(m.createdAt).getFullYear() === year).length;
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  return (
    <Stack gap="md">
      {/* Sélecteur d'année */}
      <Group justify="center" gap="xs">
        <ActionIcon variant="subtle" onClick={() => setYear((y) => y - 1)}>
          <IconChevronLeft size={18} />
        </ActionIcon>
        <Text fw={700} size="xl" ff="Anton, sans-serif" w={80} ta="center">
          {year}
        </Text>
        <ActionIcon
          variant="subtle"
          onClick={() => setYear((y) => y + 1)}
          disabled={year >= new Date().getFullYear()}
        >
          <IconChevronRight size={18} />
        </ActionIcon>
        {totalYear > 0 && (
          <Text size="sm" c="dimmed" ml="xs">
            {totalYear} mémo{totalYear > 1 ? "s" : ""}
          </Text>
        )}
      </Group>

      {/* Grille 12 mois */}
      <Grid gutter="sm">
        {MONTHS.map((label, idx) => {
          const monthMemos = byMonth.get(idx) ?? [];
          const isCurrentMonth = idx === currentMonth && year === currentYear;

          return (
            <Grid.Col key={idx} span={{ base: 12, xs: 6, sm: 4, md: 3 }}>
              <Paper
                p="sm"
                withBorder
                h="100%"
                style={{
                  borderColor: isCurrentMonth
                    ? "var(--mantine-color-epitech-4)"
                    : "var(--epi-border)",
                  minHeight: 120,
                }}
              >
                <Stack gap={6}>
                  <Group justify="space-between" mb={4}>
                    <Text
                      size="xs"
                      fw={700}
                      tt="uppercase"
                      c={isCurrentMonth ? "epitech.4" : "dimmed"}
                      style={{ letterSpacing: "0.05em" }}
                    >
                      {label}
                    </Text>
                    {monthMemos.length > 0 && (
                      <Badge size="xs" variant="light" color="epitech">
                        {monthMemos.length}
                      </Badge>
                    )}
                  </Group>

                  {monthMemos.length === 0 ? (
                    <Text size="xs" c="dark.3" fs="italic">
                      Aucun mémo
                    </Text>
                  ) : (
                    <Stack gap={4}>
                      {monthMemos.map((memo) => (
                        <Tooltip key={memo.id} label={memo.title} position="top" withArrow openDelay={400}>
                          <Box
                            onClick={() => onOpenMemo(memo.id)}
                            style={{
                              cursor: "pointer",
                              padding: "3px 6px",
                              borderRadius: 4,
                              backgroundColor: "var(--mantine-color-dark-5)",
                              borderLeft: "2px solid var(--mantine-color-epitech-4)",
                            }}
                          >
                            <Text size="xs" truncate>
                              {memo.title}
                            </Text>
                          </Box>
                        </Tooltip>
                      ))}
                    </Stack>
                  )}
                </Stack>
              </Paper>
            </Grid.Col>
          );
        })}
      </Grid>
    </Stack>
  );
}
