import { status } from "elysia";

// Elysia 1.4.x constrain the body type of status() to match the HTTP status string
// (e.g. "Unauthorized" for 401). This wrapper accepts any JSON body.
export const httpStatus = (code: number, body?: unknown) =>
  status(code as Parameters<typeof status>[0], body as never);
