const { PrismaClient } = require('@prisma/client');

const SERVICE_CATEGORIES = [
  ['maternity_matron', '月嫂'],
  ['childcare_nanny', '育儿嫂'],
  ['live_in_nanny', '住家保姆'],
  ['daytime_nanny', '白班保姆'],
  ['elderly_nanny', '养老保姆'],
];

const AREA_GROUPS = [
  ['nationwide', '全国'],
  ['foreign', '国外'],
  ['北京市', ['北京市']],
  ['天津市', ['天津市']],
  ['河北省', ['石家庄市', '唐山市', '秦皇岛市', '邯郸市', '保定市', '张家口市']],
  ['山西省', ['太原市', '大同市', '长治市', '晋中市', '临汾市']],
  ['内蒙古自治区', ['呼和浩特市', '包头市', '鄂尔多斯市', '赤峰市']],
  ['辽宁省', ['沈阳市', '大连市', '鞍山市', '抚顺市']],
  ['吉林省', ['长春市', '吉林市', '延边朝鲜族自治州']],
  ['黑龙江省', ['哈尔滨市', '齐齐哈尔市', '大庆市']],
  ['上海市', ['上海市']],
  ['江苏省', ['南京市', '苏州市', '无锡市', '常州市', '南通市', '徐州市']],
  ['浙江省', ['杭州市', '宁波市', '温州市', '嘉兴市', '绍兴市', '金华市']],
  ['安徽省', ['合肥市', '芜湖市', '蚌埠市', '安庆市']],
  ['福建省', ['福州市', '厦门市', '泉州市', '漳州市']],
  ['江西省', ['南昌市', '九江市', '赣州市']],
  ['山东省', ['济南市', '青岛市', '烟台市', '潍坊市', '临沂市']],
  ['河南省', ['郑州市', '洛阳市', '开封市', '南阳市']],
  ['湖北省', ['武汉市', '宜昌市', '襄阳市']],
  ['湖南省', ['长沙市', '株洲市', '岳阳市', '衡阳市']],
  ['广东省', ['广州市', '深圳市', '佛山市', '东莞市', '珠海市', '惠州市', '中山市', '江门市', '汕头市', '湛江市']],
  ['广西壮族自治区', ['南宁市', '柳州市', '桂林市', '北海市']],
  ['海南省', ['海口市', '三亚市']],
  ['重庆市', ['重庆市']],
  ['四川省', ['成都市', '绵阳市', '德阳市', '乐山市', '宜宾市']],
  ['贵州省', ['贵阳市', '遵义市']],
  ['云南省', ['昆明市', '大理白族自治州', '丽江市', '曲靖市']],
  ['西藏自治区', ['拉萨市']],
  ['陕西省', ['西安市', '咸阳市', '宝鸡市', '渭南市']],
  ['甘肃省', ['兰州市', '天水市']],
  ['青海省', ['西宁市']],
  ['宁夏回族自治区', ['银川市']],
  ['新疆维吾尔自治区', ['乌鲁木齐市', '克拉玛依市', '喀什地区', '伊犁哈萨克自治州']],
];

function buildServiceAreaSeeds() {
  const seeds = [];
  let sortOrder = 0;

  for (const [province, cities] of AREA_GROUPS) {
    if (typeof cities === 'string') {
      seeds.push({
        dictGroup: 'service_area',
        dictKey: province,
        dictValue: cities,
        sortOrder: sortOrder++,
      });
      continue;
    }

    for (const city of cities) {
      seeds.push({
        dictGroup: 'service_area',
        dictKey: `${province}_${city}`,
        dictValue: `${province}${city === province ? '' : city}`,
        sortOrder: sortOrder++,
      });
    }
  }

  return seeds;
}

const DICT_SEEDS = [
  ...SERVICE_CATEGORIES.map(([dictKey, dictValue], sortOrder) => ({
    dictGroup: 'service_category',
    dictKey,
    dictValue,
    sortOrder,
  })),
  ...buildServiceAreaSeeds(),

  { dictGroup: 'credential_type', dictKey: 'id_card', dictValue: '身份证', sortOrder: 0 },
  { dictGroup: 'credential_type', dictKey: 'health_cert', dictValue: '健康证', sortOrder: 1 },
  { dictGroup: 'credential_type', dictKey: 'no_crime_cert', dictValue: '无犯罪记录证明', sortOrder: 2 },
  { dictGroup: 'credential_type', dictKey: 'credit_report', dictValue: '征信报告', sortOrder: 3 },
  { dictGroup: 'credential_type', dictKey: 'medical_report', dictValue: '体检报告', sortOrder: 4 },
  { dictGroup: 'credential_type', dictKey: 'skill_cert', dictValue: '技能证书', sortOrder: 5 },
  { dictGroup: 'credential_type', dictKey: 'education', dictValue: '学历/毕业证', sortOrder: 6 },
  { dictGroup: 'credential_type', dictKey: 'student_card', dictValue: '学生证', sortOrder: 7 },
  { dictGroup: 'credential_type', dictKey: 'insurance', dictValue: '保险', sortOrder: 8 },
  { dictGroup: 'credential_type', dictKey: 'other', dictValue: '其他资料', sortOrder: 9 },

  { dictGroup: 'reject_reason', dictKey: 'info_incomplete', dictValue: '资料不完整', sortOrder: 0 },
  { dictGroup: 'reject_reason', dictKey: 'credential_invalid', dictValue: '证件不符合要求', sortOrder: 1 },
  { dictGroup: 'reject_reason', dictKey: 'qualification_insufficient', dictValue: '资质不满足要求', sortOrder: 2 },
  { dictGroup: 'reject_reason', dictKey: 'duplicate_entry', dictValue: '重复入驻', sortOrder: 3 },
  { dictGroup: 'reject_reason', dictKey: 'other', dictValue: '其他原因', sortOrder: 4 },

  { dictGroup: 'intake_status', dictKey: 'draft', dictValue: '未提交', sortOrder: 0 },
  { dictGroup: 'intake_status', dictKey: 'pending_review', dictValue: '审核中', sortOrder: 1 },
  { dictGroup: 'intake_status', dictKey: 'approved', dictValue: '正常', sortOrder: 2 },
  { dictGroup: 'intake_status', dictKey: 'credential_expired', dictValue: '资料过期', sortOrder: 3 },
  { dictGroup: 'intake_status', dictKey: 'paused', dictValue: '暂停', sortOrder: 4 },
  { dictGroup: 'intake_status', dictKey: 'banned', dictValue: '封禁', sortOrder: 5 },
  { dictGroup: 'intake_status', dictKey: 'rejected', dictValue: '审核未通过', sortOrder: 6 },
  { dictGroup: 'intake_status', dictKey: 'needs_more_info', dictValue: '资料需补充', sortOrder: 7 },

  { dictGroup: 'listing_status', dictKey: 'on', dictValue: '上线中', sortOrder: 0 },
  { dictGroup: 'listing_status', dictKey: 'off', dictValue: '休息中', sortOrder: 1 },
];

async function main() {
  const prisma = new PrismaClient();

  try {
    let upserted = 0;
    for (const item of DICT_SEEDS) {
      await prisma.dictItem.upsert({
        where: {
          dictGroup_dictKey: {
            dictGroup: item.dictGroup,
            dictKey: item.dictKey,
          },
        },
        update: {
          dictValue: item.dictValue,
          sortOrder: item.sortOrder,
          isActive: true,
        },
        create: item,
      });
      upserted++;
    }

    const managedGroups = ['service_category', 'service_area', 'credential_type', 'intake_status', 'listing_status'];
    for (const dictGroup of managedGroups) {
      const activeKeys = DICT_SEEDS
        .filter((item) => item.dictGroup === dictGroup)
        .map((item) => item.dictKey);

      await prisma.dictItem.updateMany({
        where: {
          dictGroup,
          dictKey: { notIn: activeKeys },
        },
        data: { isActive: false },
      });
    }

    console.log(`${upserted} dict items seeded or updated.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
