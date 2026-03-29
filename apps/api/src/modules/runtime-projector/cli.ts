import { PrismaClient } from '@prisma/client';
import { replayOpenClawSessions } from './projector.js';

function getArg(name: string) {
  const prefix = `${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
}

async function main() {
  const indexPath = getArg('--index') ?? process.env.OPENCLAW_SESSION_INDEX_PATH ?? '/home/open/.openclaw/agents/main/sessions/sessions.json';
  const sourceRoot = getArg('--source-root') ?? process.env.OPENCLAW_SESSION_SOURCE_ROOT;
  const prisma = new PrismaClient();

  try {
    const summary = await replayOpenClawSessions(prisma, { indexPath, sourceRoot });
    console.log(JSON.stringify({ ok: true, ...summary, indexPath, sourceRoot: sourceRoot ?? null }, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
