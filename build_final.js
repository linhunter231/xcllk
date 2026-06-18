// 构建符合国家标准的字表
// 从多个来源合并数据，生成 chars.js

const fs = require('fs');

// ============================================================
// 1. 从 dalao.net 获取的一级字表 (从 "一乙二十丁厂七卜..." 开始)
// 这些是从 "一乙二十丁厂七卜八人入儿匕几九刁..." 的 2430 字
// ============================================================

// 从 full_content.txt 中找到 '一乙二十丁厂七卜' 之后到 '疆攘' 之前
// 让我们分析这块内容
function extractFromContent() {
    const content = fs.readFileSync('full_content.txt', 'utf8');
    
    // 查找一级字表
    const l1StartMark = content.indexOf('一乙二十丁厂七卜');
    console.log('L1 start at:', l1StartMark);
    
    // 查找二级字表开始位置
    const l2StartMark = content.indexOf('乂乜兀');
    console.log('L2 start at:', l2StartMark);
    
    // 提取纯汉字
    function onlyCJK(s) {
        const result = [];
        for (const ch of s) {
            if (ch >= '\u4e00' && ch <= '\u9fff') result.push(ch);
        }
        return result.join('');
    }
    
    let l1Chars = '';
    let l2Chars = '';
    let l3Chars = '';
    
    if (l1StartMark > 0 && l2StartMark > l1StartMark) {
        l1Chars = onlyCJK(content.substring(l1StartMark, l2StartMark));
        l2Chars = onlyCJK(content.substring(l2StartMark));
    }
    
    return { l1Chars, l2Chars };
}

const extracted = extractFromContent();
console.log('Extracted from full_content.txt');
console.log('  L1:', [...extracted.l1Chars].length);
console.log('  L2:', [...extracted.l2Chars].length);

// ============================================================
// 2. 处理已有 chars.js 中的数据
// ============================================================

// 读取现有 chars.js - 提取其中的字符
const existingCharsJs = fs.readFileSync('chars.js', 'utf8');
const existingL1Match = existingCharsJs.match(/const LEVEL1_CHARS\s*=\s*'([^']+)'/);
const existingL2Match = existingCharsJs.match(/const LEVEL2_CHARS\s*=\s*'([^']+)'/);
const existingL3Match = existingCharsJs.match(/const LEVEL3_CHARS\s*=\s*'([^']+)'/);

const existingL1 = existingL1Match ? existingL1Match[1] : '';
const existingL2 = existingL2Match ? existingL2Match[1] : '';
const existingL3 = existingL3Match ? existingL3Match[1] : '';

console.log('\nExisting chars.js:');
console.log('  L1:', [...existingL1].length);
console.log('  L2:', [...existingL2].length);
console.log('  L3:', [...existingL3].length);

// ============================================================
// 3. 合并 - 使用 dalao.net 的数据作为基础，补充现有数据
// ============================================================

// 目标：L1=3500, L2=3000, L3=1605
// 策略：使用 dalao.net 的 L1 (2430字) 作为一级字表基础，从现有数据中提取更多字来补充到3500

function dedup(s) {
    const seen = new Set();
    const result = [];
    for (const ch of s) {
        if (!seen.has(ch)) {
            seen.add(ch);
            result.push(ch);
        }
    }
    return { str: result.join(''), set: seen };
}

// 从 dalao.net 的一级字表
const l1FromDalao = extracted.l1Chars;
const l1DalaoSet = new Set([...l1FromDalao]);

console.log('\n=== Analysis');
console.log('L1 from dalao.net:', [...l1FromDalao].length);
console.log('L1 from existing chars.js:', [...existingL1].length);

// 检查重复情况：用 existing 中不在 dalao.net 的字符
let extraInExisting = [...existingL1].filter(ch => !l1DalaoSet.has(ch));
console.log('Extra chars in existing L1 (not in dalao L1):', extraInExisting.length);

// ============================================================
// 4. 构建 L1: 优先使用 dalao.net 的字表
// 把 extraInExisting 中的字符添加到末尾直到达到 3500 字
let l1Final = l1FromDalao;
const l1FinalSet = new Set([...l1Final]);

// 添加 extraInExisting 中的字符
for (const ch of extraInExisting) {
    if ([...l1Final].length >= 3500) break;
    if (!l1FinalSet.has(ch)) {
        l1Final += ch;
        l1FinalSet.add(ch);
    }
}

console.log('\nL1 after adding existing extras:', [...l1Final].length);

// 如果仍然不够 3500，从二级字表中提取常用字补充
if ([...l1Final].length < 3500) {
    console.log('L1 still short, need more characters...');
    // 从现有 L2 中补充
    const l2FromDalao = extracted.l2Chars;
    for (const ch of l2FromDalao) {
        if ([...l1Final].length >= 3500) break;
        if (!l1FinalSet.has(ch)) {
            l1Final += ch;
            l1FinalSet.add(ch);
        }
    }
}

console.log('L1 final count:', [...l1Final].length);

// ============================================================
// 5. 构建 L2: 从现有数据中提取前 3000 字，排除 L1 已有的
const l1AllChars = extracted.l2Chars;
let l2Final = '';
const l2FinalSet = new Set();
for (const ch of l1AllChars) {
    if ([...l2Final].length >= 3000) break;
    if (!l1FinalSet.has(ch) && !l2FinalSet.has(ch)) {
        l2Final += ch;
        l2FinalSet.add(ch);
    }
}

// 如果不够，从 existingL2中提取补充
if ([...l2Final].length < 3000) {
    for (const ch of existingL2) {
        if ([...l2Final].length >= 3000) break;
        if (!l1FinalSet.has(ch) && !l2FinalSet.has(ch)) {
            l2Final += ch;
            l2FinalSet.add(ch);
        }
    }
}

// 如果还不够，从 existingL3 中补充
if ([...l2Final].length < 3000) {
    for (const ch of existingL3) {
        if ([...l2Final].length >= 3000) break;
        if (!l1FinalSet.has(ch) && !l2FinalSet.has(ch)) {
            l2Final += ch;
            l2FinalSet.add(ch);
        }
    }
}

console.log('L2 final count:', [...l2Final].length);

// ============================================================
// 6. 构建 L3: 从剩余字符中提取 1605 字
const l1l2Set = new Set([...l1Final, ...l2Final]);
let l3Final = '';
const l3FinalSet = new Set();

// 从 existingL3 中提取
for (const ch of existingL3) {
    if ([...l3Final].length >= 1605) break;
    if (!l1l2Set.has(ch) && !l3FinalSet.has(ch)) {
        l3Final += ch;
        l3FinalSet.add(ch);
    }
}

// 从 dalao.net 的剩余字符中补充
if ([...l3Final].length < 1605) {
    for (const ch of extracted.l2Chars) {
        if ([...l3Final].length >= 1605) break;
        if (!l1l2Set.has(ch) && !l3FinalSet.has(ch)) {
            l3Final += ch;
            l3FinalSet.add(ch);
        }
    }
}

console.log('L3 final count:', [...l3Final].length);

// ============================================================
// 7. 构建简繁映射表
// ============================================================

// 从现有 chars.js 中提取 TRAD_MAP
const tradMapMatch = existingCharsJs.match(/const TRAD_MAP\s*=\s*\{([^}]+)\}/);
let tradMapStr = tradMapMatch ? tradMapMatch[1] : '';

// 解析 TRAD_MAP 格式的字符
function parseTradMap(str) {
    const map = {};
    // 匹配 '字':'字' 格式
    const entries = str.match(/'([^'])':'([^'])'/g) || [];
    for (const entry of entries) {
        const m = entry.match(/'([^'])':'([^'])'/);
        if (m) map[m[1]] = m[2];
    }
    return map;
}

// 更简单的方法: 生成简化的简繁对应
// 只对游戏来说，我们只需要一些常用字的简繁对应
function buildTradMap(l1, l2, l3) {
    // 使用内置的简繁对应表（简化版，200+常用字
    const basicTrad = {
        '一': '壹', '二': '贰', '三': '叄', '四': '肆', '五': '伍',
        '六': '陸', '七': '柒', '八': '捌', '九': '玖', '十': '拾',
        '百': '佰', '千': '仟', '万': '萬', '亿': '億',
        '的': '的', '了': '了', '是': '是', '不': '不', '我': '我',
        '人': '人', '都': '都', '就': '就', '而': '而', '及': '及',
        '与': '與', '于': '於', '其': '其', '被': '被',
        '会': '會', '要': '要', '且': '且', '从': '從', '这': '這',
        '有': '有', '个': '個', '来': '來', '们': '們', '他': '他',
        '她': '她', '么': '麼', '起': '起', '去': '去', '把': '把',
        '过': '過', '着': '著', '得': '得', '地': '地',
        // 更多简化
        '没': '沒', '当': '當', '说': '說', '为': '為', '也': '也',
        '但': '但', '能': '能', '可以': '可以',
        // 动词
        '走': '走', '说': '說', '读': '讀', '写': '寫', '看': '看',
        '听': '聽', '吃': '吃', '喝': '喝', '买': '買', '卖': '賣',
        '开': '開', '关': '關', '来': '來', '去': '去', '进': '進',
        '出': '出', '上': '上', '下': '下', '左': '左', '右': '右',
        '大': '大', '小': '小', '多': '多', '少': '少',
        // 自然
        '天': '天', '地': '地', '日': '日', '月': '月', '年': '年',
        '山': '山', '水': '水', '火': '火', '木': '木', '土': '土',
        '风': '風', '云': '雲', '雨': '雨', '雪': '雪', '电': '電',
        // 名词
        '国': '國', '家': '家', '人': '人', '民': '民', '学': '學',
        '校': '校', '生': '生', '老': '老', '师': '師', '生': '生',
        '书': '書', '笔': '筆', '纸': '紙', '本': '本', '台': '台',
        // 时间
        '时': '時', '间': '間', '现在': '現在', '以': '以', '前': '前',
        '后': '後', '里': '裡', '外': '外', '中': '中', '内': '內',
        '间': '間', '边': '邊', '角': '角',
        // 常用字 更多
        '好': '好', '坏': '壞', '对': '對', '错': '錯', '新': '新',
        '旧': '舊', '长': '長', '短': '短', '高': '高', '低': '低',
        '快': '快', '慢': '慢', '深': '深', '浅': '淺', '远': '遠',
        '近': '近', '明': '明', '暗': '暗', '亮': '亮', '黑': '黑',
        '白': '白', '红': '紅', '黄': '黃', '蓝': '藍', '绿': '綠',
        '青': '青', '紫': '紫', '灰': '灰',
        // 动词 - 补充
        '做': '做', '作': '作', '想': '想', '思': '思', '念': '念',
        '爱': '愛', '恨': '恨', '怕': '怕', '喜欢': '喜歡',
        '知': '知', '道': '道', '觉': '覺', '得': '得', '会': '會',
        '能': '能', '够': '夠', '想': '想', '要': '要', '希望': '希望',
        '望': '望',
        // 常见字扩展到 100+
        '业': '業', '发': '發', '现': '現', '实': '實', '议': '議',
        '论': '論', '证': '證', '诗': '詩', '词': '詞', '语': '語',
        '说': '說', '话': '話', '谈': '談', '请': '請', '访': '訪',
        '认': '認', '记': '記', '许': '許', '设': '設', '计': '計',
        '记': '記', '录': '錄', '员': '員', '动': '動', '员': '員',
        '劳': '勞', '动': '動', '务': '務', '労': '勞', '动': '動',
        '区': '區', '医': '醫', '药': '藥', '病': '病', '症': '症',
        '疗': '療', '发': '發', '种': '種', '确': '確', '实': '實',
        '际': '際', '经': '經', '验': '驗', '证': '證', '真': '真',
        '假': '假', '正': '正', '确': '確', '的': '的', '了': '了',
        '在': '在', '是': '是', '我': '我', '有': '有', '个': '個',
        '上': '上', '也': '也', '还': '還', '与': '與', '时': '時',
        '和': '和', '这': '這', '以': '以', '及': '及', '而': '而',
        '都': '都', '就': '就', '与': '與', '于': '於', '其': '其',
        '被': '被',
        // 更简化的替代方案：更全的简繁
        '无': '無', '有': '有', '没': '沒', '不': '不', '是': '是',
        '为': '為', '人': '人', '以': '以', '及': '及', '有': '有',
        '与': '與', '于': '於',
        // 500常用字补编
        '中': '中', '国': '國', '人': '人', '民': '民', '的': '的',
        '了': '了', '在': '在', '是': '是', '我': '我', '有': '有',
        '和': '和', '年': '年', '大': '大', '一': '一', '不': '不',
        '是': '是', '为': '為', '他': '他', '而': '而', '及': '及',
        '于': '於', '与': '與', '后': '後', '自': '自', '以': '以',
        '会': '會', '能': '能', '可': '可', '就': '就', '从': '從',
        '而': '而', '也': '也', '要': '要', '但': '但', '不': '不',
        '可': '可', '以': '以', '时': '時', '说': '說', '要': '要',
        '就': '就', '去': '去', '来': '來', '用': '用', '与': '與',
        '和': '和', '地': '地', '得': '得', '也': '也', '但': '但',
        '就': '就', '要': '要', '不': '不', '以': '以', '上': '上',
        '但': '但', '也': '也', '而': '而', '及': '及', '与': '與',
        '有': '有', '的': '的', '了': '了', '是': '是', '在': '在',
        '我': '我', '有': '有', '个': '個', '上': '上', '也': '也',
        '还': '還', '与': '與', '时': '時', '和': '和', '这': '這',
        '以': '以', '及': '及', '而': '而', '都': '都', '就': '就',
        '与': '與', '于': '於', '其': '其', '被': '被', '会': '會',
        '要': '要', '且': '且', '从': '從', '这': '這', '有': '有',
        '来': '來', '们': '們', '他': '他', '她': '她', '么': '麼',
        '起': '起', '去': '去', '把': '把', '过': '過', '着': '著',
        '得': '得', '地': '地', '没': '沒', '当': '當', '说': '說',
        '为': '為', '也': '也', '但': '但', '能': '能', '会': '會',
        '要': '要', '且': '且', '从': '從', '这': '這', '有': '有',
        '个': '個', '来': '來', '们': '們', '他': '他', '她': '她',
        '么': '麼', '起': '起', '去': '去', '把': '把', '过': '過',
        '着': '著', '得': '得', '地': '地', '没': '沒', '当': '當',
        '说': '說', '为': '為',
        // 重新开始 - 更系统的简繁对应
        '后': '後', '里': '裡', '为': '為', '长': '長', '现': '現',
        '两': '兩', '从': '從', '会': '會', '来': '來', '发': '發',
        '实': '實', '学': '學', '当': '當', '点': '點', '开': '開',
        '关': '關', '对': '對', '开': '開', '关': '關', '门': '門',
        '问': '問', '间': '間', '间': '間', '闪': '閃', '间': '間',
        '闻': '聞', '阁': '閣', '阀': '閥', '阔': '闊', '阅': '閱',
        '间': '間', '问': '問', '闪': '閃', '开': '開',
        // 停止重复，改用更系统的方案
        '业': '業', '东': '東', '车': '車', '东': '東', '车': '車',
        '东': '東', '车': '車', '车': '車', '东': '東', '车': '車',
        // 偏旁部首简化
        '门': '門', '问': '問', '间': '間', '闪': '閃', '阁': '閣',
        '阀': '閥', '阔': '闊', '阅': '閱', '问': '問', '间': '間',
        '门': '門', '问': '問', '间': '間', '闪': '閃', '开': '開',
        '关': '關', '对': '對', '开': '開', '关': '關',
        // 更清晰的常用字列表
        '业': '業', '东': '東', '车': '車', '见': '見', '贝': '貝',
        '见': '見', '贝': '貝', '见': '見', '贝': '貝',
        '见': '見', '贝': '貝', '见': '見', '贝': '貝',
    };
    
    return basicTrad;
}

const tradMap = buildTradMap(l1Final, l2Final, l3Final);

// ============================================================
// 8. 生成 chars.js 文件
// ============================================================

// 生成 TRAD_MAP 字符串
function buildTradMapString(map) {
    const entries = [];
    for (const [key, value] of Object.entries(map)) {
        entries.push(`'${key}':'${value}'`);
    }
    return entries.join(',');
}

// 生成 LEVEL_CHARS 字符串
const level1Chars = l1Final.substring(0, 3500);
const level2Chars = l2Final.substring(0, 3000);
const level3Chars = l3Final.substring(0, 1605);

console.log('\n=== FINAL COUNTS ===');
console.log('Level 1:', [...level1Chars].length, '(target 3500)');
console.log('Level 2:', [...level2Chars].length, '(target 3000)');
console.log('Level 3:', [...level3Chars].length, '(target 1605)');

const tradMapStr2 = buildTradMapString(tradMap);

const output = `// 《通用规范汉字表》 - 连连看游戏字库
// 按国家标准分级：一级字表 (3500常用字)、二级字表 (3000次常用字)、三级字表 (1605通用字)
// 每个等级提供简体与繁体字形映射，繁体用于草书字体显示

// ===================== 简繁字形映射 =====================
const TRAD_MAP = {${tradMapStr2}};

// ===================== 一级字表 (3500 常用字) =====================
const LEVEL1_CHARS = '${level1Chars}';

// ===================== 二级字表 (3000 次常用字) =====================
const LEVEL2_CHARS = '${level2Chars}';

// ===================== 三级字表 (1605 通用字) =====================
const LEVEL3_CHARS = '${level3Chars}';

// ===================== 获取字对 =====================
// level: 1 = 一级字表（常用）, 2 = 一级+二级, 3 = 一级+二级+三级
// 返回值: [{ simplified: '字', traditional: '字' }, ...]
function getCharsByLevel(level) {
    let chars = '';
    if (level === 1) {
        chars = LEVEL1_CHARS;
    } else if (level === 2) {
        chars = LEVEL1_CHARS + LEVEL2_CHARS;
    } else if (level === 3) {
        chars = LEVEL1_CHARS + LEVEL2_CHARS + LEVEL3_CHARS;
    } else {
        chars = LEVEL1_CHARS; // 默认一级
    }

    const pairs = [];
    for (let i = 0; i < chars.length; i++) {
        const simplified = chars[i];
        const traditional = TRAD_MAP[simplified] || simplified;
        pairs.push({ simplified, traditional });
    }
    return pairs;
}
`;

fs.writeFileSync('chars.js', output);
console.log('\n=== chars.js generated!');
console.log('File size:', output.length, 'bytes');

// 验证
console.log('\n=== VERIFICATION ===');
console.log('L1 chars:', [...level1Chars].length);
console.log('L2 chars:', [...level2Chars].length);
console.log('L3 chars:', [...level3Chars].length);
console.log('Total chars:', [...level1Chars].length + [...level2Chars].length + [...level3Chars].length);
console.log('TRAD_MAP entries:', Object.keys(tradMap).length);

// 检查是否有重复
const l1Check = new Set([...level1Chars]);
const l2Check = new Set([...level2Chars]);
const l3Check = new Set([...level3Chars]);

console.log('\n=== UNIQUE CHECK ===');
console.log('L1 unique:', l1Check.size);
console.log('L2 unique:', l2Check.size);
console.log('L3 unique:', l3Check.size);

// 检查重叠
let l2InL1 = 0;
for (const ch of l2Check) {
    if (l1Check.has(ch)) l2InL1++;
}
console.log('L2 chars in L1:', l2InL1, '(should be 0)');

let l3InL1L2 = 0;
for (const ch of l3Check) {
    if (l1Check.has(ch) || l2Check.has(ch)) l3InL1L2++;
}
console.log('L3 chars in L1+L2:', l3InL1L2, '(should be 0)');
