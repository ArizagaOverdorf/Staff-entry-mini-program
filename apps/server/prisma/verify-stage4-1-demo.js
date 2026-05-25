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
    const account = await prisma.staffAccount.findUnique({
      where: { staffId: 'DEMO1001' },
      include: {
        credentials: {
          where: { isCurrent: true, credentialType: 'skill_cert' },
          include: {
            files: true,
            credentialSkills: { include: { staffSkill: true } },
          },
        },
      },
    });

    if (!account) {
      throw new Error('DEMO1001 was not found.');
    }

    if (account.credentials.length < 2) {
      throw new Error(
        `DEMO1001 should have at least 2 current skill certificates, found ${account.credentials.length}.`,
      );
    }

    const linkedSkillIds = new Set();
    const groupIds = new Set();

    for (const credential of account.credentials) {
      if (!credential.credentialName) {
        throw new Error(`Skill certificate ${credential.id} is missing credentialName.`);
      }
      if (!credential.skillLevel) {
        throw new Error(`Skill certificate ${credential.id} is missing skillLevel.`);
      }
      if (!credential.credentialGroupId) {
        throw new Error(`Skill certificate ${credential.id} is missing credentialGroupId.`);
      }
      if (credential.files.length === 0) {
        throw new Error(`Skill certificate ${credential.id} is missing files.`);
      }
      if (credential.credentialSkills.length === 0) {
        throw new Error(`Skill certificate ${credential.id} is missing linked skills.`);
      }

      groupIds.add(credential.credentialGroupId);
      for (const link of credential.credentialSkills) {
        linkedSkillIds.add(link.staffSkillId);
      }
    }

    if (groupIds.size < 2) {
      throw new Error('Current skill certificates should belong to independent credential groups.');
    }

    if (linkedSkillIds.size < 2) {
      throw new Error('DEMO1001 skill certificates should cover at least 2 different skills.');
    }

    console.log('Stage 4.1 demo consistency check passed:');
    for (const credential of account.credentials) {
      const skills = credential.credentialSkills
        .map((link) => link.staffSkill?.categoryName || link.staffSkillId)
        .join(', ');
      console.log(
        `- ${credential.credentialName} level=${credential.skillLevel} group=${credential.credentialGroupId} skills=${skills}`,
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
