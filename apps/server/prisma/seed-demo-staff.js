const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');
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

function maskPhone(phone) {
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
}

function maskIdNumber(idNumber) {
  return `${idNumber.slice(0, 6)}********${idNumber.slice(-4)}`;
}

function fakeEncrypted(value) {
  return `demo_encrypted:${Buffer.from(value).toString('base64')}`;
}

function resolveStorageBasePath() {
  const basePath = process.env.STORAGE_LOCAL_BASE_PATH || './uploads';
  return path.isAbsolute(basePath) ? basePath : path.resolve(process.cwd(), basePath);
}

function ensureDemoFile(staffId, credentialType, staffAccountId) {
  const basePath = resolveStorageBasePath();
  fs.mkdirSync(basePath, { recursive: true });

  const storedName = `demo-${staffId}-${credentialType}.txt`;
  const content = Buffer.from(
    `Demo private credential file for ${staffId} / ${credentialType}\n`,
    'utf8',
  );
  const storagePath = path.join(basePath, storedName);
  fs.writeFileSync(storagePath, content);

  return {
    id: randomUUID(),
    originalName: `${credentialType}-demo.txt`,
    storedName,
    mimeType: 'text/plain',
    size: BigInt(content.length),
    storageProvider: 'local',
    storagePath,
    accessLevel: 'private',
    uploadedByStaffAccountId: staffAccountId,
  };
}

const DEMO_STAFF = [
  {
    staffId: 'DEMO1001',
    openid: 'demo_openid_1001',
    name: '王小梅',
    idNumber: '440106199001010001',
    phone: '13800000001',
    gender: 2,
    intakeStatus: 'pending_review',
    reviewRemark: null,
    credentialStatus: 'pending',
  },
  {
    staffId: 'DEMO1002',
    openid: 'demo_openid_1002',
    name: '李师傅',
    idNumber: '440106198502020002',
    phone: '13800000002',
    gender: 1,
    intakeStatus: 'needs_more_info',
    reviewRemark: '请补充健康证有效期照片。',
    credentialStatus: 'pending',
  },
  {
    staffId: 'DEMO1003',
    openid: 'demo_openid_1003',
    name: '张阿姨',
    idNumber: '440106197803030003',
    phone: '13800000003',
    gender: 2,
    intakeStatus: 'approved',
    reviewRemark: '演示数据：已通过审核。',
    credentialStatus: 'approved',
  },
];

async function createDemoStaff(prisma, item) {
  await prisma.staffAccount.deleteMany({ where: { staffId: item.staffId } });

  const account = await prisma.staffAccount.create({
    data: {
      staffId: item.staffId,
      openid: item.openid,
      phoneEncrypted: fakeEncrypted(item.phone),
      phoneMasked: maskPhone(item.phone),
      wechatNickname: item.name,
      privacyAgreed: true,
      privacyAgreedAt: new Date(),
      profile: {
        create: {
          staffId: item.staffId,
          realNameEncrypted: fakeEncrypted(item.name),
          realNameMasked: item.name,
          idNumberEncrypted: fakeEncrypted(item.idNumber),
          idNumberMasked: maskIdNumber(item.idNumber),
          gender: item.gender,
          birthday: new Date('1990-01-01'),
          address: '广州市天河区演示地址',
          emergencyContactName: '紧急联系人',
          emergencyContactPhone: fakeEncrypted('13900000000'),
        },
      },
      skills: {
        create: [
          {
            categoryId: 'cleaning',
            categoryName: '家庭保洁',
            skillLevel: 3,
            description: '演示数据',
          },
          {
            categoryId: 'nanny',
            categoryName: '住家保姆',
            skillLevel: 2,
            description: '演示数据',
          },
        ],
      },
      serviceAreas: {
        create: [
          { province: '广东省', city: '广州市', district: '天河区' },
          { province: '广东省', city: '广州市', district: '越秀区' },
        ],
      },
      intakeStatus: {
        create: {
          intakeStatus: item.intakeStatus,
          submittedAt: new Date(),
          reviewedAt:
            item.intakeStatus === 'pending_review' ? null : new Date(),
          reviewRemark: item.reviewRemark,
        },
      },
      listingStatus: {
        create: {
          listingStatus: 'off',
          isAvailable: false,
        },
      },
      messages: {
        create:
          item.intakeStatus === 'needs_more_info'
            ? [
                {
                  title: '入驻资料需补充',
                  content: item.reviewRemark,
                  messageType: 'audit',
                },
              ]
            : item.intakeStatus === 'approved'
              ? [
                  {
                    title: '入驻审核通过',
                    content: item.reviewRemark,
                    messageType: 'audit',
                  },
                ]
              : [],
      },
    },
  });

  for (const credentialType of ['id_card', 'health_cert']) {
    const fileAsset = ensureDemoFile(item.staffId, credentialType, account.id);
    await prisma.fileAsset.create({ data: fileAsset });

    const credential = await prisma.staffCredential.create({
      data: {
        staffAccountId: account.id,
        credentialType,
        credentialName:
          credentialType === 'id_card' ? '身份证' : '健康证',
        credentialNumber:
          credentialType === 'id_card' ? item.idNumber : `HC-${item.staffId}`,
        issuingAuthority: '演示机构',
        issueDate: new Date('2025-01-01'),
        expiryDate: new Date('2027-12-31'),
        credentialStatus: item.credentialStatus,
        credentialBadge: item.credentialStatus === 'approved' ? 'valid' : null,
        version: 1,
        isCurrent: true,
        files: {
          create: {
            fileAssetId: fileAsset.id,
            fileType: 'credential_image',
          },
        },
      },
    });

    if (item.credentialStatus === 'pending') {
      await prisma.message.create({
        data: {
          staffAccountId: account.id,
          title: '证件待审核',
          content: `${credential.credentialName} 已提交，等待后台审核。`,
          messageType: 'audit',
        },
      });
    }
  }

  return account;
}

async function main() {
  loadEnvFile(path.resolve(__dirname, '../../../.env'));
  loadEnvFile(path.resolve(__dirname, '../.env'));

  const prisma = new PrismaClient();

  try {
    for (const item of DEMO_STAFF) {
      await createDemoStaff(prisma, item);
    }

    console.log('Demo staff data is ready:');
    for (const item of DEMO_STAFF) {
      console.log(`- ${item.staffId} ${item.name} ${item.intakeStatus}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
