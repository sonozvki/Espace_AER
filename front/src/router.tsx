import { createBrowserRouter, Navigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { LoginPage } from "@/routes/LoginPage";
import { MemosPage } from "@/routes/MemosPage";
import { GuardsPage } from "@/routes/GuardsPage";
import { ToolboxPage } from "@/routes/ToolboxPage";
import "@/styles/global.css";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Navigate to="/memos" replace /> },
      { path: "memos", element: <MemosPage /> },
      { path: "guards", element: <GuardsPage /> },
      { path: "toolbox", element: <ToolboxPage /> },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);
