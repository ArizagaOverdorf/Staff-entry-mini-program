const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const PASSWORD_HASH_ALGORITHM = 'scrypt';
const PASSWORD_HASH_KEY_LENGTH = 64;

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

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, PASSWORD_HASH_KEY_LENGTH).toString('hex');
  return `${PASSWORD_HASH_ALGORITHM}:${salt}:${hash}`;
}

async function main() {
  loadEnvFile(path.resolve(__dirname, '../../../.env'));
  loadEnvFile(path.resolve(__dirname, '../.env'));

  const username = process.env.ADMIN_SEED_USERNAME || 'admin';
  const password = process.env.ADMIN_SEED_PASSWORD;

  if (!password || password === 'change_me_before_running_seed') {
    throw new Error('Set ADMIN_SEED_PASSWORD in .env before running seed:admin.');
  }

  const prisma = new PrismaClient();

  try {
    await prisma.adminUser.upsert({
      where: { username },
      update: {
        passwordHash: hashPassword(password),
        isActive: true,
        isSuper: true,
      },
      create: {
        username,
        passwordHash: hashPassword(password),
        realName: '系统管理员',
        isActive: true,
        isSuper: true,
      },
    });

    console.log(`Admin user "${username}" is ready.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
