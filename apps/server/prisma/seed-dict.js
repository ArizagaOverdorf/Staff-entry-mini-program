const { PrismaClient } = require('@prisma/client');

const DICT_SEEDS = [
  // Service categories
  { dictGroup: 'service_category', dictKey: 'home_cleaning', dictValue: '家庭保洁', sortOrder: 0 },
  { dictGroup: 'service_category', dictKey: 'deep_cleaning', dictValue: '深度保洁', sortOrder: 1 },
  { dictGroup: 'service_category', dictKey: 'window_cleaning', dictValue: '擦窗服务', sortOrder: 2 },
  { dictGroup: 'service_category', dictKey: 'babysitting', dictValue: '育儿嫂', sortOrder: 3 },
  { dictGroup: 'service_category', dictKey: 'elderly_care', dictValue: '老人护理', sortOrder: 4 },
  { dictGroup: 'service_category', dictKey: 'month_nanny', dictValue: '月嫂', sortOrder: 5 },
  { dictGroup: 'service_category', dictKey: 'hourly_work', dictValue: '钟点工', sortOrder: 6 },
  { dictGroup: 'service_category', dictKey: 'cooking', dictValue: '做饭服务', sortOrder: 7 },

  // Credential types
  { dictGroup: 'credential_type', dictKey: 'id_card', dictValue: '身份证', sortOrder: 0 },
  { dictGroup: 'credential_type', dictKey: 'health_cert', dictValue: '健康证', sortOrder: 1 },
  { dictGroup: 'credential_type', dictKey: 'professional_cert', dictValue: '专业技能证书', sortOrder: 2 },
  { dictGroup: 'credential_type', dictKey: 'background_check', dictValue: '背景调查报告', sortOrder: 3 },
  { dictGroup: 'credential_type', dictKey: 'other', dictValue: '其他证件', sortOrder: 4 },

  // Reject reasons
  { dictGroup: 'reject_reason', dictKey: 'info_incomplete', dictValue: '资料不完整', sortOrder: 0 },
  { dictGroup: 'reject_reason', dictKey: 'credential_invalid', dictValue: '证件不符合要求', sortOrder: 1 },
  { dictGroup: 'reject_reason', dictKey: 'qualification_insufficient', dictValue: '资质不满足要求', sortOrder: 2 },
  { dictGroup: 'reject_reason', dictKey: 'duplicate_entry', dictValue: '重复入驻', sortOrder: 3 },
  { dictGroup: 'reject_reason', dictKey: 'other', dictValue: '其他原因', sortOrder: 4 },

  // Intake status (for display)
  { dictGroup: 'intake_status', dictKey: 'draft', dictValue: '草稿', sortOrder: 0 },
  { dictGroup: 'intake_status', dictKey: 'pending_review', dictValue: '待审核', sortOrder: 1 },
  { dictGroup: 'intake_status', dictKey: 'approved', dictValue: '已通过', sortOrder: 2 },
  { dictGroup: 'intake_status', dictKey: 'rejected', dictValue: '已驳回', sortOrder: 3 },
  { dictGroup: 'intake_status', dictKey: 'needs_more_info', dictValue: '需补充资料', sortOrder: 4 },

  // Listing status (for display)
  { dictGroup: 'listing_status', dictKey: 'online', dictValue: '已上架', sortOrder: 0 },
  { dictGroup: 'listing_status', dictKey: 'offline', dictValue: '未上架', sortOrder: 1 },
  { dictGroup: 'listing_status', dictKey: 'paused', dictValue: '已暂停', sortOrder: 2 },
];

async function main() {
  const prisma = new PrismaClient();

  try {
    let created = 0;
    for (const item of DICT_SEEDS) {
      const existing = await prisma.dictItem.findUnique({
        where: { dictGroup_dictKey: { dictGroup: item.dictGroup, dictKey: item.dictKey } },
      });
      if (!existing) {
        await prisma.dictItem.create({ data: item });
        created++;
      }
    }
    console.log(`${created} dict items seeded (${DICT_SEEDS.length} total, skipped existing).`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
