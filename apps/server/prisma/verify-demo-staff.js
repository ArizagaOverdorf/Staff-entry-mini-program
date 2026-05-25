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
      where: { staffId: { in: ['DEMO1001', 'DEMO1002', 'DEMO1003'] } },
      include: {
        intakeStatus: true,
        credentials: {
          where: { isCurrent: true },
          include: { credentialSkills: true },
        },
      },
      orderBy: { staffId: 'asc' },
    });

    if (accounts.length !== 3) {
      throw new Error(`Expected 3 demo staff accounts, found ${accounts.length}.`);
    }

    const mandatoryCredentialTypes = [
      'id_card',
      'health_cert',
      'no_crime_cert',
      'credit_report',
      'medical_report',
    ];

    for (const account of accounts) {
      for (const credentialType of mandatoryCredentialTypes) {
        const hasCredential = account.credentials.some(
          (credential) => credential.credentialType === credentialType,
        );
        if (!hasCredential) {
          throw new Error(
            `${account.staffId} is missing mandatory credential ${credentialType}.`,
          );
        }
      }
    }

    const linkedSkillCertCount = accounts.reduce((total, account) => {
      return total + account.credentials.filter((credential) => {
        return (
          credential.credentialType === 'skill_cert' &&
          credential.credentialSkills.length > 0
        );
      }).length;
    }, 0);

    if (linkedSkillCertCount < 1) {
      throw new Error(
        'Expected at least one demo skill certificate linked to a staff skill.',
      );
    }

    console.log('Demo staff consistency check passed:');
    for (const account of accounts) {
      console.log(
        `- ${account.staffId} ${account.intakeStatus?.intakeStatus || 'draft'} credentials=${account.credentials.length}`,
      );
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
