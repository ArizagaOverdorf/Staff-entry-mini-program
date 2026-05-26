const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;

    const separatorIndex = trimmed.indexOf('=');
    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

async function main() {
  loadEnvFile(path.resolve(__dirname, '../../../.env'));
  loadEnvFile(path.resolve(__dirname, '../.env'));

  const prisma = new PrismaClient();
  try {
    const accounts = await prisma.staffAccount.findMany({
      where: { staffId: { in: ['DEMO1001', 'DEMO1003'] } },
      include: {
        credentials: {
          where: {
            isCurrent: true,
            credentialType: { in: ['education', 'student_card'] },
          },
          include: { files: true },
        },
      },
      orderBy: { staffId: 'asc' },
    });

    if (accounts.length !== 2) {
      throw new Error(`Expected DEMO1001 and DEMO1003, found ${accounts.length}.`);
    }

    for (const account of accounts) {
      if (account.credentials.length < 1) {
        throw new Error(`${account.staffId} needs at least one education/student-card credential.`);
      }
      for (const credential of account.credentials) {
        if (!credential.credentialName) {
          throw new Error(`${account.staffId} education credential is missing credentialName.`);
        }
        if (credential.files.length < 1) {
          throw new Error(`${account.staffId} education credential is missing file attachment.`);
        }
      }
    }

    console.log('Stage 4.2 demo consistency check passed:');
    for (const account of accounts) {
      const names = account.credentials
        .map((credential) => `${credential.credentialType}:${credential.credentialName}`)
        .join(', ');
      console.log(`- ${account.staffId} ${names}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
