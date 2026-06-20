const fs = require('fs');

// Read the existing chars.js
let content = fs.readFileSync('chars.js', 'utf-8');

// Extract the TRAD_MAP from the file
const tradMapMatch = content.match(/const TRAD_MAP = \{([^;]+);/);
if (!tradMapMatch) {
    console.log('Error: Could not find TRAD_MAP');
    process.exit(1);
}

// Get the existing TRAD_MAP
const existingTradMapStr = tradMapMatch[1];

// Additional mappings to add
const additionalMappings = {
    '区': '區', '认': '認', '仅': '僅',
    '干': '幹', '余': '餘', '复': '復', '姜': '薑', '丑': '醜',
    '面': '麵', '须': '須', '千': '仟', '秋': '鞦', '合': '閤',
    '回': '迴', '尽': '盡', '历': '歷', '范': '範', '蜡': '蠟',
    '腊': '臘', '仆': '僕', '朴': '樸', '曲': '麯', '舍': '捨',
    '术': '術', '松': '鬆', '咸': '鹹', '叶': '葉', '吁': '籲',
    '愿': '願', '折': '徹', '征': '徵', '证': '證', '朱': '硃',
    '筑': '築', '准': '準', '郁': '鬱', '御': '禦', '致': '緻',
    '制': '製', '钟': '鍾', '注': '註', '出': '齣', '表': '錶',
    '党': '黨', '冬': '鼕', '动': '動', '斗': '鬥', '儿': '兒',
    '丰': '豐', '个': '個', '广': '廣', '划': '劃', '坏': '壞',
    '汇': '匯', '获': '獲', '击': '擊', '极': '極', '家': '傢',
    '价': '價', '艰': '艱', '荐': '薦', '借': '藉', '卷': '捲',
    '克': '剋', '困': '睏', '厘': '釐', '了': '瞭', '累': '纍',
    '帘': '簾', '凉': '涼', '么': '麼', '蒙': '濛', '弥': '彌',
    '蔑': '衊', '庙': '廟', '灭': '滅', '农': '農', '扑': '撲',
    '墙': '牆', '窃': '竊', '却': '卻', '确': '確', '让': '讓',
    '扰': '擾', '洒': '灑', '晒': '曬', '沈': '瀋', '帅': '帥',
    '响': '響', '向': '嚮', '旋': '鏇', '岩': '巖', '药': '藥',
    '阳': '陽', '养': '養', '痒': '癢', '欲': '慾', '与': '與',
    '云': '雲', '匀': '勻', '扎': '紥', '战': '戰', '症': '癥',
    '种': '種', '众': '眾', '专': '專', '着': '著', '走': '喱',
    '只': '衹', '致': '緻', '周': '週', '转': '轉', '总': '總',
    '纵': '縱', '钻': '鑽', '坐': '墫', '后': '後', '系': '係',
    '别': '彆', '卜': '蔔', '杆': '桿', '适': '適', '仇': '讎',
    '霉': '黴', '扭': '鈕', '千': '韱', '台': '臺', '体': '體',
    '涂': '塗', '网': '網', '佣': '傭', '游': '遊', '丑': '醜',
    '姜': '薑', '复': '複', '伙': '夥', '里': '裡', '昵': '暱',
    '宁': '寧', '切': '竊'
};

// Build the new entries string
const newEntries = Object.entries(additionalMappings)
    .map(([k, v]) => `'${k}':'${v}'`)
    .join(',');

// Insert before the closing brace of TRAD_MAP
const newContent = content.replace(
    /('咸':'鹹','向':'嚮'[^;]+);/,
    (match) => match.replace("};", "," + newEntries + "};")
);

// Write back
fs.writeFileSync('chars.js', newContent, 'utf-8');
console.log('Successfully added traditional character mappings!');
console.log('Added', Object.keys(additionalMappings).length, 'new mappings');
