import { Box, Text, Button, Stack, Tooltip, Badge, Group, SimpleGrid } from "@mantine/core";
import type { Guard } from "../types";
import type { User } from "@/features/shared/types";
import { useAssignGuard, useAddAbsent, useRemoveAbsent, useAddUnavailable, useRemoveUnavailable } from "../hooks";

const DAY_HEADERS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

// Mon→0, Tue→1, Wed→2, Thu→3, Fri→4, Sat→5, Sun→6
function colIndex(date: Date): number {
  const dow = date.getUTCDay();
  return dow === 0 ? 6 : dow - 1;
}

function buildWeeks(year: number, month: number): (Date | null)[][] {
  const firstDay = new Date(Date.UTC(year, month, 1));
  const lastDay = new Date(Date.UTC(year, month + 1, 0));
  const weeks: (Date | null)[][] = [];
  let week: (Date | null)[] = [];

  for (let i = 0; i < colIndex(firstDay); i++) week.push(null);

  const d = new Date(firstDay);
  while (d <= lastDay) {
    week.push(new Date(d));
    if (colIndex(d) === 6) {
      weeks.push(week);
      week = [];
    }
    d.setUTCDate(d.getUTCDate() + 1);
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }
  return weeks;
}

function toDateKey(d: Date) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isToday(d: Date) {
  const t = new Date();
  return (
    d.getUTCFullYear() === t.getFullYear() &&
    d.getUTCMonth() === t.getMonth() &&
    d.getUTCDate() === t.getDate()
  );
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
  const addAbsent = useAddAbsent();
  const removeAbsent = useRemoveAbsent();
  const addUnavailable = useAddUnavailable();
  const removeUnavailable = useRemoveUnavailable();

  const past = isPast(day);
  const today = isToday(day);
  const isMyGuard = guard?.guardAerId === currentUser?.id;
  const isFree = !guard?.guardAerId;
  const myAbsence = guard?.absentAers.find((u) => u.id === currentUser?.id);
  const myUnavailability = guard?.unavailableAers.find((u) => u.id === currentUser?.id);

  const isHoliday = guard?.isPublicHoliday;
  const isVacation = guard?.isSchoolHoliday && !guard?.isPublicHoliday;

  const bgColor = isHoliday
    ? "var(--mantine-color-yellow-0)"
    : isVacation
    ? "var(--mantine-color-blue-0)"
    : today
    ? "var(--epi-today-bg)"
    : guard?.guardAerId
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
        padding: "12px 14px",
        minHeight: 170,
        background: bgColor,
        opacity: past ? 0.5 : 1,
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <Group gap={4} align="flex-start" wrap="nowrap">
        <Text size="md" fw={today ? 700 : 500} c={today ? "epitech.4" : "dimmed"} style={{ flexShrink: 0 }}>
          {day.getUTCDate()}
        </Text>
        {guard?.isPublicHoliday && guard.publicHolidayName && (
          <Text size="xs" c="yellow.7" fw={600} style={{ lineHeight: 1.3 }} lineClamp={2}>
            {guard.publicHolidayName}
          </Text>
        )}
        {guard?.isSchoolHoliday && !guard.isPublicHoliday && guard.schoolHolidayName && (
          <Text size="xs" c="blue.5" style={{ lineHeight: 1.3 }} lineClamp={2}>
            {guard.schoolHolidayName}
          </Text>
        )}
      </Group>

      {guard ? (
        <Stack gap={4} style={{ flex: 1 }}>
          {guard.guardAer ? (
            <Tooltip label={guard.guardAer.email} withArrow>
              <Badge size="md" color={isMyGuard ? "epitechVivid" : "blue"} variant="filled" maw="100%">
                {guard.guardAer.name.split(" ")[0]}
              </Badge>
            </Tooltip>
          ) : (
            <Text size="sm" c="dimmed" fs="italic">
              Libre
            </Text>
          )}

          {guard.absentAers.map((u) => (
            <Tooltip key={u.id} label={`${u.name} absent ce jour`} withArrow>
              <Badge size="sm" color="red" variant="filled" maw="100%">
                {u.name.split(" ")[0]} ✕
              </Badge>
            </Tooltip>
          ))}

          {guard.unavailableAers.map((u) => (
            <Tooltip key={u.id} label={`${u.name} indisponible ce jour`} withArrow>
              <Badge size="sm" color="violet" variant="filled" maw="100%">
                {u.name.split(" ")[0]} —
              </Badge>
            </Tooltip>
          ))}

          {!past && currentUser && (
            <Group gap={6} mt="auto" wrap="wrap">
              {isFree && !myAbsence && !myUnavailability && (
                <Button
                  size="xs"
                  variant="filled"
                  color="epitech"
                  loading={assign.isPending}
                  onClick={() => assign.mutate({ id: guard.id, guardAerId: currentUser.id })}
                >
                  Prendre
                </Button>
              )}
              {guard.guardAer && (
                <Button
                  size="xs"
                  variant="filled"
                  color="red"
                  loading={assign.isPending}
                  onClick={() => assign.mutate({ id: guard.id, guardAerId: null })}
                >
                  Libérer
                </Button>
              )}
              {!myAbsence ? (
                <Button
                  size="xs"
                  variant="filled"
                  color="orange"
                  loading={addAbsent.isPending}
                  onClick={() => addAbsent.mutate(guard.id)}
                >
                  Absent
                </Button>
              ) : (
                <Button
                  size="xs"
                  variant="filled"
                  color="green"
                  loading={removeAbsent.isPending}
                  onClick={() => removeAbsent.mutate(guard.id)}
                >
                  Présent
                </Button>
              )}
              {!myUnavailability ? (
                <Button
                  size="xs"
                  variant="filled"
                  color="violet"
                  loading={addUnavailable.isPending}
                  onClick={() => addUnavailable.mutate(guard.id)}
                >
                  Indispo
                </Button>
              ) : (
                <Button
                  size="xs"
                  variant="filled"
                  color="green"
                  loading={removeUnavailable.isPending}
                  onClick={() => removeUnavailable.mutate(guard.id)}
                >
                  Dispo
                </Button>
              )}
            </Group>
          )}
        </Stack>
      ) : null}
    </Box>
  );
}

interface Props {
  year: number;
  month: number;
  guardsByDate: Map<string, Guard>;
  currentUser: User | null;
  weekIndex?: number;
  onWeekChange?: (index: number) => void;
  isMobile?: boolean;
}

export function GuardCalendar({
  year,
  month,
  guardsByDate,
  currentUser,
  weekIndex,
  onWeekChange,
  isMobile = false,
}: Props) {
  const weeks = buildWeeks(year, month);
  const displayWeek = isMobile && weekIndex !== undefined ? weeks[weekIndex] : undefined;

  if (isMobile && displayWeek) {
    return (
      <Stack gap={8}>
        {/* Mobile: single week, 1 day per row */}
        <Stack gap={6}>
          {displayWeek.map((day, di) =>
            day ? (
              <Box key={day.toISOString()}>
                <Text size="sm" fw={600} c="dimmed" mb={4}>
                  {DAY_HEADERS[di]} {day.getDate()}
                </Text>
                <DayCell
                  day={day}
                  guard={guardsByDate.get(toDateKey(day)) ?? null}
                  currentUser={currentUser}
                />
              </Box>
            ) : null
          )}
        </Stack>
      </Stack>
    );
  }

  return (
    <Box>
      {/* Desktop: full month, 6 columns */}
      <SimpleGrid cols={{ base: 2, sm: 7 }} spacing={8} mb={8}>
        {DAY_HEADERS.map((h) => (
          <Text key={h} size="sm" fw={600} c="dimmed" ta="center" py={4}>
            {h}
          </Text>
        ))}
      </SimpleGrid>

      <Stack gap={8}>
        {weeks.map((week, wi) => (
          <SimpleGrid key={wi} cols={{ base: 2, sm: 7 }} spacing={8}>
            {week.map((day, di) =>
              day ? (
                <DayCell
                  key={day.toISOString()}
                  day={day}
                  guard={guardsByDate.get(toDateKey(day)) ?? null}
                  currentUser={currentUser}
                />
              ) : (
                <Box key={`empty-${wi}-${di}`} style={{ minHeight: 120 }} />
              )
            )}
          </SimpleGrid>
        ))}
      </Stack>
    </Box>
  );
}
