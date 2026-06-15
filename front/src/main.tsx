import { createRoot } from "react-dom/client";
import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import { theme } from "@/lib/theme";
import { router } from "@/router";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

createRoot(document.getElementById("root")!).render(
  <MantineProvider theme={theme} defaultColorScheme="dark">
    <Notifications />
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </MantineProvider>
);
