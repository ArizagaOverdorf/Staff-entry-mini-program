const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const BCRYPT_SALT_ROUNDS = 10;

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
  return bcrypt.hashSync(password, BCRYPT_SALT_ROUNDS);
}

const PERMISSIONS = [
  { code: 'admin_user.manage', name: '管理员管理', description: '创建、编辑、删除管理员账号', parentCode: null },
  { code: 'role.manage', name: '角色权限管理', description: '管理角色和分配权限', parentCode: null },
  { code: 'dict.manage', name: '字典管理', description: '维护系统字典数据', parentCode: null },
  { code: 'staff.view', name: '查看服务人员', description: '查看服务人员列表和详情', parentCode: null },
  { code: 'staff.audit', name: '审核服务人员', description: '审核服务人员入驻申请', parentCode: null },
  { code: 'staff.sensitive.view', name: '查看敏感信息', description: '查看服务人员完整手机号、身份证号、真实姓名', parentCode: null },
];

const ROLES = [
  { code: 'super_admin', name: '超级管理员', description: '拥有所有权限，系统自动绕过权限校验' },
  { code: 'admin', name: '管理员', description: '日常管理权限' },
  { code: 'auditor', name: '审核员', description: '仅查看和审核服务人员' },
];

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
    // Create permissions
    const permissionIds = {};
    for (const perm of PERMISSIONS) {
      const created = await prisma.adminPermission.upsert({
        where: { code: perm.code },
        update: { name: perm.name, description: perm.description },
        create: {
          code: perm.code,
          name: perm.name,
          description: perm.description,
          sortOrder: PERMISSIONS.indexOf(perm),
        },
      });
      permissionIds[perm.code] = created.id;
    }
    console.log(`${PERMISSIONS.length} permissions seeded.`);

    // Create roles — super_admin gets all permissions, auditor gets view+audit
    const rolePermMap = {
      super_admin: PERMISSIONS.map((p) => p.code),
      admin: ['admin_user.manage', 'role.manage', 'dict.manage', 'staff.view', 'staff.audit'],
      auditor: ['staff.view', 'staff.audit'],
    };

    for (const roleDef of ROLES) {
      const role = await prisma.adminRole.upsert({
        where: { code: roleDef.code },
        update: { name: roleDef.name, description: roleDef.description },
        create: {
          code: roleDef.code,
          name: roleDef.name,
          description: roleDef.description,
        },
      });

      // Assign permissions to role
      const permCodes = rolePermMap[roleDef.code] || [];
      await prisma.adminRolePermission.deleteMany({ where: { adminRoleId: role.id } });
      if (permCodes.length > 0) {
        await prisma.adminRolePermission.createMany({
          data: permCodes.map((code) => ({
            adminRoleId: role.id,
            adminPermissionId: permissionIds[code],
          })),
        });
      }
    }
    console.log(`${ROLES.length} roles seeded.`);

    // Create super admin user
    const superAdminRole = await prisma.adminRole.findUnique({ where: { code: 'super_admin' } });

    const adminUser = await prisma.adminUser.upsert({
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

    // Assign super_admin role
    if (superAdminRole) {
      const existing = await prisma.adminUserRole.findUnique({
        where: { adminUserId_adminRoleId: { adminUserId: adminUser.id, adminRoleId: superAdminRole.id } },
      });
      if (!existing) {
        await prisma.adminUserRole.create({
          data: { adminUserId: adminUser.id, adminRoleId: superAdminRole.id },
        });
      }
    }

    console.log(`Admin user "${username}" is ready (isSuper=true, role=super_admin).`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
