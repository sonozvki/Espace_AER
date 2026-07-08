import { z } from "zod";

export const GenerateGuardsSchema = z.object({
  year: z.number().int().min(2024).max(2030),
});

export const AssignGuardSchema = z.object({
  guardAerId: z.number().int().nullable(),
});

export type GenerateGuardsInput = z.infer<typeof GenerateGuardsSchema>;
export type AssignGuardInput = z.infer<typeof AssignGuardSchema>;
