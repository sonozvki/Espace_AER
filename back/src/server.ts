import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { authController } from "@/auth/auth.controller";
import { memosController } from "@/modules/memos/memos.controller";
import { guardsController } from "@/modules/guards/guards.controller";
import { resourcesController } from "@/modules/resources/resources.controller";
import { epitechController } from "@/modules/epitech/epitech.controller";
import { statsController } from "@/modules/stats/stats.controller";
import { moulisController } from "@/modules/moulis/moulis.controller";
import { schoolYearController } from "@/modules/school-year/school-year.controller";
import { studentController } from "@/modules/student/student.controller";
import { startStudentSyncJob } from "@/jobs/sync-students";

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
      .use(resourcesController)
      .use(epitechController)
      .use(statsController)
      .use(moulisController)
      .use(schoolYearController)
      .use(studentController) // session étudiante ou AER
  )
  .listen(process.env["PORT"] ?? 3000);

export type App = typeof app;

console.log(`Server running on port ${process.env["PORT"] ?? 3000}`);
startStudentSyncJob();
