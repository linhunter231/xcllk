// 从抓取的 HTML 中提取字表
const fs = require('fs');

const html = fs.readFileSync('raw_page.html', 'utf8');

// 找到包含字表的 JSON-LD text 字段
// 先查找 text 字段的开始
const searchStr = '以下是中国官方';
const idx = html.indexOf(searchStr);
console.log('Found 以下是中国官方 at:', idx);

// 找到开始引号和结束引号
let quoteStart = idx;
while (quoteStart > 0 && html[quoteStart] !== '"') quoteStart--;
console.log('Opening quote at:', quoteStart);

// 找到结束引号（处理转义
let i = quoteStart + 1;
let result = '';
let inEscape = false;
while (i < html.length) {
    const ch = html[i];
    if (ch === '\\' && !inEscape) {
        inEscape = true;
        i++;
        continue;
    }
    if (ch === '"' && !inEscape) {
        break;
    }
    result += ch;
    inEscape = false;
    i++;
}

console.log('Extracted text length:', result.length);
console.log('First 300 chars:', result.substring(0, 300));
console.log('Last 300 chars:', result.substring(result.length - 300));

// 从 text 中提取各级字表
const l1Marker = '一级字表 (3500 字)';
const l2Marker = '二级字表 (3000 字)';
const l3Marker = '三级字表 (1605 字)';

const l1Start = result.indexOf(l1Marker);
const l2Start = result.indexOf(l2Marker);
const l3Start = result.indexOf(l3Marker);

console.log('\n=== Markers ===');
console.log('L1:', l1Start);
console.log('L2:', l2Start);
console.log('L3:', l3Start);

if (l1Start < 0 || l2Start < 0 || l3Start < 0) {
    console.error('Could not find all markers!');
    process.exit(1);
}

const l1Text = result.substring(l1Start + l1Marker.length, l2Start);
const l2Text = result.substring(l2Start + l2Marker.length, l3Start);
const l3Text = result.substring(l3Start + l3Marker.length);

// 只保留汉字
function onlyChars(s) {
    const result = [];
    for (const ch of s) {
        if (ch >= '\u4e00' && ch <= '\u9fff') {
            result.push(ch);
        }
    }
    return result.join('');
}

const l1 = onlyChars(l1Text);
const l2 = onlyChars(l2Text);
const l3 = onlyChars(l3Text);

console.log('\n=== CHAR COUNTS ===');
console.log('Level 1:', [...l1].length);
console.log('Level 2:', [...l2].length);
console.log('Level 3:', [...l3].length);

console.log('\nL1 start:', l1.substring(0, 50));
console.log('L1 end:', l1.substring(Math.max(0, [...l1].length - 50)));
console.log('\nL2 start:', l2.substring(0, 50));
console.log('L2 end:', l2.substring(Math.max(0, [...l2].length - 50)));
console.log('\nL3 start:', l3.substring(0, 50));
console.log('L3 end:', l3.substring(Math.max(0, [...l3].length - 50)));

// 去除重复字符（保持顺序）
function dedup(s) {
    const seen = new Set();
    const result = [];
    for (const ch of s) {
        if (!seen.has(ch)) {
            seen.add(ch);
            result.push(ch);
        }
    }
    return result.join('');
}

// 检查重复
const l1Dedup = dedup(l1);
const l2Dedup = dedup(l2);
const l3Dedup = dedup(l3);

console.log('\n=== AFTER DEDUP ===');
console.log('Level 1:', [...l1Dedup].length, '(original:', [...l1].length + ')');
console.log('Level 2:', [...l2Dedup].length, '(original:', [...l2].length + ')');
console.log('Level 3:', [...l3Dedup].length, '(original:', [...l3].length + ')');

// 注意：二级和三级字表中有大量简体繁体重叠
// 因为网页可能同时显示简体和繁体
// 我们需要检查 L2 中是否有繁体字
console.log('\n=== INSPECT L2 ===');
// 检查 L2 中是否有常见简体字（从 L1 中的字）
const l1Set = new Set([...l1Dedup]);
let l2NewChars = 0;
let l2DuplicateChars = 0;
for (const ch of l2Dedup) {
    if (l1Set.has(ch)) l2DuplicateChars++;
    else l2NewChars++;
}
console.log('L2 duplicates from L1:', l2DuplicateChars);
console.log('L2 new chars:', l2NewChars);

// 保存最终结果
fs.writeFileSync('l1_extracted.txt', l1Dedup);
fs.writeFileSync('l2_extracted.txt', l2Dedup);
fs.writeFileSync('l3_extracted.txt', l3Dedup);

console.log('\nSaved extracted files!');
