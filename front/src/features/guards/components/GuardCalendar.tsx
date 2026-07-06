import { Box, Text, Button, Stack, Tooltip, Badge, Group } from "@mantine/core";
import type { Guard } from "../types";
import type { User } from "@/features/shared/types";
import type { Absence } from "@/features/absences/types";
import { useAssignGuard } from "../hooks";
import { useDeclareAbsence, useCancelAbsence } from "@/features/absences/hooks";

const DAY_HEADERS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

// Mon→0, Tue→1, Wed→2, Thu→3, Fri→4, Sat→5, Sun→skip
function colIndex(date: Date): number {
  const dow = date.getDay(); // 0=Sun
  return dow === 0 ? -1 : dow - 1;
}

function buildWeeks(year: number, month: number): (Date | null)[][] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const weeks: (Date | null)[][] = [];
  let week: (Date | null)[] = [];

  // Pad start of first week
  const firstCol = colIndex(firstDay);
  const adjustedFirst = firstCol === -1 ? 5 : firstCol; // if month starts on Sunday, treat as Sat+1 row
  for (let i = 0; i < adjustedFirst; i++) week.push(null);

  const d = new Date(firstDay);
  while (d <= lastDay) {
    const col = colIndex(d);
    if (col === -1) {
      // Sunday: close current week, start new one
      while (week.length < 6) week.push(null);
      if (week.some((c) => c !== null)) weeks.push(week);
      week = [];
      d.setDate(d.getDate() + 1);
      continue;
    }
    week.push(new Date(d));
    if (col === 5) {
      // Saturday: end of week
      weeks.push(week);
      week = [];
    }
    d.setDate(d.getDate() + 1);
  }
  // Last partial week
  if (week.length > 0) {
    while (week.length < 6) week.push(null);
    weeks.push(week);
  }
  return weeks;
}

function toDateKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isToday(d: Date) {
  const t = new Date();
  return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
}

function isPast(d: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d < today;
}

interface DayCellProps {
  day: Date;
  guard: Guard | null;
  absences: Absence[];
  currentUser: User | null;
}

function DayCell({ day, guard, absences, currentUser }: DayCellProps) {
  const assign = useAssignGuard();
  const declareAbsence = useDeclareAbsence();
  const cancelAbsence = useCancelAbsence();

  const past = isPast(day);
  const today = isToday(day);
  const isMyGuard = guard?.aerId === currentUser?.id;
  const isFree = !guard?.aerId;
  const isAdmin = currentUser?.role === "ADMIN";
  const myAbsence = absences.find((a) => a.userId === currentUser?.id);

  const bgColor = today
    ? "var(--mantine-color-epitech-9)"
    : guard?.aerId
    ? "var(--epi-surface)"
    : "var(--epi-bg)";

  const borderColor = today
    ? "var(--mantine-color-epitech-4)"
    : isMyGuard
    ? "var(--mantine-color-epitech-6)"
    : "var(--epi-border)";

  return (
    <Box
      style={{
        border: `1px solid ${borderColor}`,
        borderRadius: 8,
        padding: "10px 12px",
        minHeight: 120,
        background: bgColor,
        opacity: past ? 0.5 : 1,
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <Text size="md" fw={today ? 700 : 500} c={today ? "epitech.4" : "dimmed"}>
        {day.getDate()}
      </Text>

      {guard ? (
        <Stack gap={4} style={{ flex: 1 }}>
          {guard.aer ? (
            <Tooltip label={guard.aer.email} withArrow>
              <Badge size="md" color={isMyGuard ? "epitech" : "gray"} variant="light" maw="100%">
                {guard.aer.name.split(" ")[0]}
              </Badge>
            </Tooltip>
          ) : (
            <Text size="sm" c="dimmed" fs="italic">
              Libre
            </Text>
          )}

          {absences.map((a) => (
            <Tooltip key={a.id} label={`${a.user.name} absent ce jour`} withArrow>
              <Badge size="md" color="red" variant="filled" maw="100%">
                {a.user.name.split(" ")[0]} ✕
              </Badge>
            </Tooltip>
          ))}

          {!past && currentUser && (
            <Group gap={6} mt="auto" wrap="wrap">
              {isFree && !myAbsence && (
                <Button
                  size="xs"
                  variant="light"
                  color="epitech"
                  loading={assign.isPending}
                  onClick={() => assign.mutate({ id: guard.id, aerId: currentUser.id })}
                >
                  Prendre
                </Button>
              )}
              {(isMyGuard || isAdmin) && guard.aer && (
                <Button
                  size="xs"
                  variant="subtle"
                  color="red"
                  loading={assign.isPending}
                  onClick={() => assign.mutate({ id: guard.id, aerId: null })}
                >
                  Libérer
                </Button>
              )}
              {!myAbsence ? (
                <Button
                  size="xs"
                  variant="subtle"
                  color="red"
                  loading={declareAbsence.isPending}
                  onClick={() => declareAbsence.mutate(toDateKey(day))}
                >
                  Absent
                </Button>
              ) : (
                <Button
                  size="xs"
                  variant="subtle"
                  color="green"
                  loading={cancelAbsence.isPending}
                  onClick={() => cancelAbsence.mutate(myAbsence.id)}
                >
                  Présent
                </Button>
              )}
            </Group>
          )}
        </Stack>
      ) : (
        <Text size="sm" c="dimmed" fs="italic">
        </Text>
      )}
    </Box>
  );
}

interface Props {
  year: number;
  month: number;
  guardsByDate: Map<string, Guard>;
  absencesByDate: Map<string, Absence[]>;
  currentUser: User | null;
}

export function GuardCalendar({ year, month, guardsByDate, absencesByDate, currentUser }: Props) {
  const weeks = buildWeeks(year, month);

  return (
    <Box>
      {/* Header */}
      <Box
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(6, 1fr)",
          gap: 8,
          marginBottom: 8,
        }}
      >
        {DAY_HEADERS.map((h) => (
          <Text key={h} size="sm" fw={600} c="dimmed" ta="center" py={4}>
            {h}
          </Text>
        ))}
      </Box>

      {/* Weeks */}
      <Stack gap={8}>
        {weeks.map((week, wi) => (
          <Box
            key={wi}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(6, 1fr)",
              gap: 8,
            }}
          >
            {week.map((day, di) =>
              day ? (
                <DayCell
                  key={day.toISOString()}
                  day={day}
                  guard={guardsByDate.get(toDateKey(day)) ?? null}
                  absences={absencesByDate.get(toDateKey(day)) ?? []}
                  currentUser={currentUser}
                />
              ) : (
                <Box key={`empty-${wi}-${di}`} style={{ minHeight: 120 }} />
              )
            )}
          </Box>
        ))}
      </Stack>
    </Box>
  );
}
