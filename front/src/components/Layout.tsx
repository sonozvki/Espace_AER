import { AppShell, Burger, Group, NavLink, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Outlet, useNavigate, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { BASE_URL } from "@/lib/api";

const NAV_ITEMS = [
  { path: "/memos", label: "Mémos" },
  { path: "/guards", label: "Gardes" },
  { path: "/action-items", label: "Actions" },
];

export function Layout() {
  const [opened, { toggle }] = useDisclosure();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoading, isAuthenticated } = useAuth();

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
      <AppShell.Header bg="dark.6" style={{ borderBottom: "1px solid var(--epi-border)" }}>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Text ff="Anton, sans-serif" size="xl" c="epitech.4">
              Espace AER
            </Text>
          </Group>
          <Text size="sm" c="dimmed">
            {user?.name}
          </Text>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="xs" bg="dark.6" style={{ borderRight: "1px solid var(--epi-border)" }}>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            label={item.label}
            active={location.pathname.startsWith(item.path)}
            onClick={() => navigate(item.path)}
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

      <AppShell.Main bg="dark.7">
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
