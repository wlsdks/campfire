/**
 * One-time migration: create courses from existing sessions.
 *
 * For each unique courseName in sessions:
 * 1. Creates a courses/{id} node with ownerId = master admin
 * 2. Updates each session with courseId and creatorId
 *
 * Run: node --env-file=.env scripts/migrate-courses.mjs
 */

const DB_URL = process.env.VITE_FIREBASE_DATABASE_URL;
if (!DB_URL) {
  console.error('VITE_FIREBASE_DATABASE_URL 누락 — `node --env-file=.env scripts/migrate-courses.mjs` 형태로 실행하세요.');
  process.exit(1);
}

function uid() {
  return 'crs_' + Math.random().toString(36).slice(2, 10);
}

async function fbGet(path) {
  const res = await fetch(`${DB_URL}/${path}.json`);
  return res.json();
}

async function fbPatch(path, data) {
  const res = await fetch(`${DB_URL}/${path}.json`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

async function fbPut(path, data) {
  const res = await fetch(`${DB_URL}/${path}.json`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

async function main() {
  console.log('🔄 Fetching admins...');
  const admins = await fbGet('admins');
  if (!admins) { console.log('❌ No admins found'); return; }

  // Find master admin
  const masterEntry = Object.entries(admins).find(([, a]) => a.role === 'master');
  if (!masterEntry) { console.log('❌ No master admin found'); return; }
  const [masterUid, masterData] = masterEntry;
  console.log(`✅ Master: ${masterData.displayName} (${masterUid})`);

  console.log('🔄 Fetching sessions...');
  const sessions = await fbGet('sessions');
  if (!sessions) { console.log('❌ No sessions found'); return; }

  // Group sessions by courseName
  const courseGroups = {};
  Object.entries(sessions).forEach(([id, s]) => {
    const name = s.courseName;
    if (!name) return;
    if (!courseGroups[name]) courseGroups[name] = [];
    courseGroups[name].push(id);
  });

  console.log(`📦 Found ${Object.keys(courseGroups).length} unique courses\n`);

  // Check existing courses to avoid duplicates
  const existingCourses = await fbGet('courses') || {};
  const existingNames = new Set(Object.values(existingCourses).map((c) => c.name));

  let created = 0;
  let updated = 0;

  for (const [name, sessionIds] of Object.entries(courseGroups)) {
    if (existingNames.has(name)) {
      // Find existing courseId
      const existingId = Object.entries(existingCourses).find(([, c]) => c.name === name)?.[0];
      console.log(`⏭️  "${name}" already exists (${existingId}), updating sessions...`);
      for (const sid of sessionIds) {
        if (!sessions[sid].courseId) {
          await fbPatch(`sessions/${sid}`, { courseId: existingId, creatorId: sessions[sid].creatorId || masterUid });
          updated++;
        }
      }
      continue;
    }

    const courseId = uid();
    console.log(`📝 Creating course: "${name}" → ${courseId}`);
    await fbPut(`courses/${courseId}`, {
      name,
      ownerId: masterUid,
      ownerName: masterData.displayName || '',
      createdAt: Date.now(),
    });
    created++;

    // Update sessions with courseId and creatorId
    for (const sid of sessionIds) {
      await fbPatch(`sessions/${sid}`, {
        courseId,
        creatorId: sessions[sid].creatorId || masterUid,
      });
      updated++;
    }
  }

  // Handle sessions without courseName
  const orphanSessions = Object.entries(sessions).filter(([, s]) => !s.courseName);
  for (const [sid, s] of orphanSessions) {
    if (!s.creatorId) {
      await fbPatch(`sessions/${sid}`, { creatorId: masterUid });
      updated++;
    }
  }

  console.log(`\n✅ Done! Created ${created} courses, updated ${updated} sessions`);
}

main().catch(console.error);
