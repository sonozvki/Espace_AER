import { defineConfig } from "prisma/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

export default defineConfig({
  migrate: {
    adapter: async () => {
      const pool = new Pool({ connectionString: process.env["DATABASE_URL"] });
      return new PrismaPg(pool);
    },
  },
});
