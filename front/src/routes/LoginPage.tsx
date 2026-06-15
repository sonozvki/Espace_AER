import { useEffect } from "react";
import { Center, Loader } from "@mantine/core";

// temporary deactivated for easier debug — auto-login via /api/auth/login (dev bypass)
export function LoginPage() {
  useEffect(() => {
    window.location.href = "/api/auth/login";
  }, []);

  return (
    <Center h="100vh" bg="dark.7">
      <Loader color="epitech.4" />
    </Center>
  );
}
