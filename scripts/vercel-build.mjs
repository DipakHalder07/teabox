// Vercel runs this instead of `npm run build` (package.json "vercel-build"):
// 1. creates or updates the database tables (prisma db push), so a new database needs no manual
//    step. It never deletes data: a schema change that would lose data stops the deploy instead.
// 2. adds catalog products missing from the database (admin edits are never overwritten).
// 3. builds the shop.
import { execSync } from "node:child_process";

function run(command, env = {}) {
  execSync(command, { stdio: "inherit", env: { ...process.env, ...env } });
}

/** Schema changes need Neon's direct address, not the pooled one. */
function directDatabaseUrl() {
  const raw = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL || "";
  if (!raw) return null;
  try {
    const url = new URL(raw);
    url.hostname = url.hostname.replace("-pooler", "");
    url.searchParams.delete("pgbouncer");
    url.searchParams.delete("connection_limit");
    url.searchParams.set("connect_timeout", "30");
    return url;
  } catch {
    return null;
  }
}

const db = directDatabaseUrl();
if (!db) {
  console.warn("\n⚠️  DATABASE_URL is not set: the shop will run without a database (orders are not kept).\n");
} else if (["127.0.0.1", "localhost"].includes(db.hostname)) {
  console.warn(
    "\n⚠️  DATABASE_URL points to 127.0.0.1, the database on your own computer, which Vercel cannot reach.\n" +
      "   Create a Neon database in Vercel → Storage, remove this DATABASE_URL, and redeploy.\n"
  );
} else {
  console.log(`\n🗄️  Updating database tables on ${db.hostname} …`);
  run("npx prisma db push --skip-generate", { DATABASE_URL: db.toString() });
  run("npx tsx prisma/sync-products.ts", { DATABASE_URL: db.toString() });
}

run("npx next build");
