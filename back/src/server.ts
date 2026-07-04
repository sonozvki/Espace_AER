import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { authController } from "@/auth/auth.controller";
import { memosController } from "@/modules/memos/memos.controller";
import { guardsController } from "@/modules/guards/guards.controller";
import { actionItemsController } from "@/modules/action-items/action-items.controller";
import { resourcesController } from "@/modules/resources/resources.controller";
import { epitechController } from "@/modules/epitech/epitech.controller";
import { syncWhitelistFromEnv } from "@/auth/whitelist";

await syncWhitelistFromEnv();

export const app = new Elysia()
  .use(
    cors({
      origin: process.env["FRONTEND_URL"] ?? "http://localhost:5173",
      credentials: true,
    })
  )
  .use(authController)
  .group("/api", (app) =>
    app
      .use(memosController)
      .use(guardsController)
      .use(actionItemsController)
      .use(resourcesController)
      .use(epitechController)
  )
  .listen(process.env["PORT"] ?? 3000);

export type App = typeof app;

console.log(`Server running on port ${process.env["PORT"] ?? 3000}`);
