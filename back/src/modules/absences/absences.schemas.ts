import { z } from "zod";

export const CreateAbsenceSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format attendu : YYYY-MM-DD"),
});

export type CreateAbsenceInput = z.infer<typeof CreateAbsenceSchema>;
