import { AppShell, Burger, Group, NavLink, Text, ActionIcon, useMantineColorScheme } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconSun, IconMoon } from "@tabler/icons-react";
import { Outlet, useNavigate, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { BASE_URL } from "@/lib/api";

const BASE_NAV_ITEMS = [
  { path: "/dashboard", label: "Tableau de bord" },
  { path: "/memos", label: "Mémos" },
  { path: "/guards", label: "Gardes" },
  { path: "/toolbox", label: "Toolbox" },
  { path: "/suivi", label: "Trombi" },
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

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={{ width: 220, breakpoint: "sm", collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header
        bg={colorScheme === "light" ? "var(--epi-blue)" : "var(--epi-panel)"}
        style={{ borderBottom: colorScheme === "light" ? "none" : "1px solid var(--epi-border)" }}
      >
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
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

      <AppShell.Navbar p="xs" bg="var(--epi-panel)" style={{ borderRight: "1px solid var(--epi-border)" }}>
        {[
          ...BASE_NAV_ITEMS.slice(0, 5),
          ...(user?.hasEpitechToken ? [{ path: "/moulis", label: "Moulis" }] : []),
          ...BASE_NAV_ITEMS.slice(5),
        ].map((item) => (
          <NavLink
            key={item.path}
            label={item.label}
            active={location.pathname.startsWith(item.path)}
            onClick={() => {
              navigate(item.path);
              close();
            }}
            mb={4}
          />
        ))}

        <NavLink
          label="Se déconnecter"
          mt="auto"
          c="red"
          onClick={handleLogout}
        />
      </AppShell.Navbar>

      <AppShell.Main bg="var(--epi-bg)" className="epi-dotted">
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
