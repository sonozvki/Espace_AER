import { prisma } from "@/db/prisma";
import { getIntraPromos, getIntraStudents, saveStudentsToCache } from "@/modules/epitech/epitech.service";

const LOCATIONS = ["FR/NCE"];
const SYNC_INTERVAL_MS = 4 * 60 * 60 * 1000; // 4h

async function syncStudents() {
  const user = await prisma.user.findFirst({
    where: { epitechToken: { not: null } },
    select: { id: true },
  });
  if (!user) return;

  for (const location of LOCATIONS) {
    let promos: string[];
    try {
      promos = await getIntraPromos(user.id, location);
    } catch {
      console.error(`[sync-students] failed to fetch promos for ${location}`);
      continue;
    }

    for (const promo of promos) {
      try {
        const students = await getIntraStudents(user.id, { location, promo });
        await saveStudentsToCache(students, promo, location);
        console.log(`[sync-students] ${students.length} students cached for ${promo}@${location}`);
      } catch {
        console.error(`[sync-students] failed for ${promo}@${location}`);
      }
    }
  }
}

export function startStudentSyncJob() {
  syncStudents().catch((e) => console.error("[sync-students] initial sync failed:", e));
  setInterval(() => syncStudents().catch((e) => console.error("[sync-students] sync failed:", e)), SYNC_INTERVAL_MS);
}
