import { db, schema } from "../src/lib/db";
try { process.loadEnvFile(".env.local"); } catch {}
async function main() {
  const [r] = await db().select({ id: schema.graves.id, slug: schema.graves.slug }).from(schema.graves).limit(1);
  console.log(`${r.id} ${r.slug}`);
}
main();
