import { AppShell, Burger, Group, NavLink, Text, ActionIcon, useMantineColorScheme, Drawer, Stack, Divider } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconSun, IconMoon } from "@tabler/icons-react";
import { Outlet, useNavigate, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { BASE_URL } from "@/lib/api";

const NAV_ITEMS = [
  { path: "/dashboard", label: "Tableau de bord" },
  { path: "/memos", label: "Mémos" },
  { path: "/guards", label: "Gardes" },
  { path: "/toolbox", label: "Toolbox" },
  { path: "/whitelist", label: "Whitelist" },
  { path: "/settings", label: "Mon compte" },
];

export function Layout() {
  const [opened, { toggle, close }] = useDisclosure();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoading, isAuthenticated } = useAuth();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();

  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  async function handleLogout() {
    await fetch(`${BASE_URL}/auth/logout`, { method: "POST", credentials: "include" });
    navigate("/login");
  }

  function navTo(path: string) {
    navigate(path);
    close();
  }

  return (
    <>
      <Drawer
        opened={opened}
        onClose={close}
        size={240}
        padding="md"
        withCloseButton={false}
        styles={{ body: { display: "flex", flexDirection: "column", height: "100%", padding: 0 } }}
      >
        <Group px="md" h={56} style={{ borderBottom: "1px solid var(--epi-border)", flexShrink: 0 }}>
          <Burger opened size="sm" onClick={close} />
          <Text ff="Anton, sans-serif" size="xl" c="epitech.4">Espace AER</Text>
        </Group>

        <Stack gap={4} p="xs" style={{ flex: 1, overflowY: "auto" }}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              label={item.label}
              active={location.pathname.startsWith(item.path)}
              onClick={() => navTo(item.path)}
            />
          ))}
        </Stack>

        <Divider />
        <Stack p="xs">
          <NavLink label="Se déconnecter" c="red" onClick={handleLogout} />
        </Stack>
      </Drawer>

      <AppShell header={{ height: 56 }} padding="md">
        <AppShell.Header
          bg={colorScheme === "light" ? "var(--epi-blue)" : "var(--epi-panel)"}
          style={{ borderBottom: colorScheme === "light" ? "none" : "1px solid var(--epi-border)" }}
        >
          <Group h="100%" px="md" justify="space-between">
            <Group>
              <Burger
                opened={opened}
                onClick={toggle}
                size="sm"
                color={colorScheme === "light" ? "white" : undefined}
              />
              <Text ff="Anton, sans-serif" size="xl" c={colorScheme === "light" ? "white" : "epitech.4"}>
                Espace AER
              </Text>
            </Group>
            <Group gap="sm">
              <ActionIcon
                variant="subtle"
                color={colorScheme === "light" ? "white" : "gray"}
                onClick={toggleColorScheme}
                aria-label="Basculer entre mode clair et sombre"
              >
                {colorScheme === "dark" ? <IconSun size={18} /> : <IconMoon size={18} />}
              </ActionIcon>
              <Text size="sm" c={colorScheme === "light" ? "white" : "dimmed"}>
                {user?.name}
              </Text>
            </Group>
          </Group>
        </AppShell.Header>

        <AppShell.Main bg="var(--epi-bg)" className="epi-dotted">
          <Outlet />
        </AppShell.Main>
      </AppShell>
    </>
  );
}
