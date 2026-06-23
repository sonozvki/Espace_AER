import { Box, Text, Button, Stack, Tooltip, Badge } from "@mantine/core";
import type { Guard } from "../types";
import type { User } from "@/features/shared/types";
import { useAssignGuard } from "../hooks";

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
  currentUser: User | null;
}

function DayCell({ day, guard, currentUser }: DayCellProps) {
  const assign = useAssignGuard();
  const past = isPast(day);
  const today = isToday(day);
  const isMyGuard = guard?.aerId === currentUser?.id;
  const isFree = !guard?.aerId;
  const isAdmin = currentUser?.role === "ADMIN";

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
        borderRadius: 6,
        padding: "6px 8px",
        minHeight: 72,
        background: bgColor,
        opacity: past ? 0.5 : 1,
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <Text size="xs" fw={today ? 700 : 400} c={today ? "epitech.4" : "dimmed"}>
        {day.getDate()}
      </Text>

      {guard ? (
        <Stack gap={2} style={{ flex: 1 }}>
          {guard.aer ? (
            <Tooltip label={guard.aer.email} withArrow>
              <Badge size="xs" color={isMyGuard ? "epitech" : "gray"} variant="light" maw="100%">
                {guard.aer.name.split(" ")[0]}
              </Badge>
            </Tooltip>
          ) : (
            <Text size="xs" c="dimmed" fs="italic">
              Libre
            </Text>
          )}

          {!past && currentUser && (
            <>
              {isFree && (
                <Button
                  size="compact-xs"
                  variant="light"
                  color="epitech"
                  mt="auto"
                  loading={assign.isPending}
                  onClick={() => assign.mutate({ id: guard.id, aerId: currentUser.id })}
                >
                  Prendre
                </Button>
              )}
              {(isMyGuard || isAdmin) && guard.aer && (
                <Button
                  size="compact-xs"
                  variant="subtle"
                  color="red"
                  mt="auto"
                  loading={assign.isPending}
                  onClick={() => assign.mutate({ id: guard.id, aerId: null })}
                >
                  Libérer
                </Button>
              )}
            </>
          )}
        </Stack>
      ) : (
        <Text size="xs" c="dimmed" fs="italic">
        </Text>
      )}
    </Box>
  );
}

interface Props {
  year: number;
  month: number;
  guardsByDate: Map<string, Guard>;
  currentUser: User | null;
}

export function GuardCalendar({ year, month, guardsByDate, currentUser }: Props) {
  const weeks = buildWeeks(year, month);

  return (
    <Box>
      {/* Header */}
      <Box
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(6, 1fr)",
          gap: 4,
          marginBottom: 4,
        }}
      >
        {DAY_HEADERS.map((h) => (
          <Text key={h} size="xs" fw={600} c="dimmed" ta="center" py={4}>
            {h}
          </Text>
        ))}
      </Box>

      {/* Weeks */}
      <Stack gap={4}>
        {weeks.map((week, wi) => (
          <Box
            key={wi}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(6, 1fr)",
              gap: 4,
            }}
          >
            {week.map((day, di) =>
              day ? (
                <DayCell
                  key={day.toISOString()}
                  day={day}
                  guard={guardsByDate.get(toDateKey(day)) ?? null}
                  currentUser={currentUser}
                />
              ) : (
                <Box key={`empty-${wi}-${di}`} style={{ minHeight: 72 }} />
              )
            )}
          </Box>
        ))}
      </Stack>
    </Box>
  );
}
