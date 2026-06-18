// 从论坛帖子提取字表
const fs = require('fs');
const html = fs.readFileSync('raw_page.html', 'utf8');

// 找到 message div 区域
const msgStart = html.indexOf('class="message break-all box-shadow"');
console.log('Message div starts at:', msgStart);

// 找到该 div 结束（看后面的 </div> 或其他标签）
// 从 msgStart 之后开始
// 查找内容直到特定标记结束
const contentStart = html.indexOf('>', msgStart) + 1;

// 查找内容结束位置 - 找一个明显的结束标记（如 </div> 或 comment 部分）
const commentStart = html.indexOf('<div class="comment', contentStart);
const endContainer = commentStart > 0 ? commentStart : html.length;

console.log('Content start:', contentStart);
console.log('Content end:', endContainer);
console.log('Content block size:', endContainer - contentStart);

// 提取内容
let content = html.substring(contentStart, endContainer);

// 去除 HTML 标签
content = content.replace(/<[^>]+>/g, ' ');
console.log('Content (tag removed) length:', content.length);
console.log('First 500 chars:', content.substring(0, 500));

// 从 content 中提取各级字表
const l1Marker = '一级字表 (3500 字)';
const l2Marker = '二级字表 (3000 字)';
const l3Marker = '三级字表 (1605 字)';

const l1Start = content.indexOf(l1Marker);
const l2Start = content.indexOf(l2Marker, l1Start + 1);
const l3Start = content.indexOf(l3Marker, l2Start + 1);

console.log('\n=== Markers in content ===');
console.log('L1:', l1Start);
console.log('L2:', l2Start);
console.log('L3:', l3Start);

if (l1Start < 0 || l2Start < 0 || l3Start < 0) {
    console.error('Could not find all markers!');
    process.exit(1);
}

const l1Text = content.substring(l1Start + l1Marker.length, l2Start);
const l2Text = content.substring(l2Start + l2Marker.length, l3Start);
const l3Text = content.substring(l3Start + l3Marker.length);

// 只保留汉字（注意：扩展 B 区汉字需要特殊处理）
function onlyCJK(s) {
    const result = [];
    for (const ch of s) {
        if (ch >= '\u4e00' && ch <= '\u9fff') {
            result.push(ch);
        }
    }
    return result.join('');
}

const l1 = onlyCJK(l1Text);
const l2 = onlyCJK(l2Text);
const l3 = onlyCJK(l3Text);

console.log('\n=== RAW CHAR COUNTS ===');
console.log('Level 1:', [...l1].length);
console.log('Level 2:', [...l2].length);
console.log('Level 3:', [...l3].length);

console.log('\nL1 start:', l1.substring(0, 50));
console.log('L1 end:', l1.substring(Math.max(0, [...l1].length - 50)));
console.log('\nL2 start:', l2.substring(0, 50));
console.log('L2 end:', l2.substring(Math.max(0, [...l2].length - 50)));
console.log('\nL3 start:', l3.substring(0, 50));
console.log('L3 end:', l3.substring(Math.max(0, [...l3].length - 50)));

// 检查重复字符
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

const l1Dedup = dedup(l1);
const l2Dedup = dedup(l2);
const l3Dedup = dedup(l3);

console.log('\n=== AFTER DEDUP ===');
console.log('Level 1:', [...l1Dedup].length, '(before dedup:', [...l1].length + ')');
console.log('Level 2:', [...l2Dedup].length, '(before dedup:', [...l2].length + ')');
console.log('Level 3:', [...l3Dedup].length, '(before dedup:', [...l3].length + ')');

// 检查 L2 和 L1 的重叠
const l1Set = new Set([...l1Dedup]);
let l2Unique = 0;
let l2Overlap = 0;
for (const ch of l2Dedup) {
    if (l1Set.has(ch)) l2Overlap++;
    else l2Unique++;
}
console.log('\nL2 overlap with L1:', l2Overlap);
console.log('L2 unique chars:', l2Unique);

// 从 L2 中移除 L1 中已有的字符（因为 L2 应该是新增字）
const l2Clean = [...l2Dedup].filter(ch => !l1Set.has(ch)).join('');

const l1l2Set = new Set([...l1Dedup, ...l2Clean]);
let l3Unique = 0;
let l3Overlap = 0;
for (const ch of l3Dedup) {
    if (l1l2Set.has(ch)) l3Overlap++;
    else l3Unique++;
}
console.log('L3 overlap with L1+L2:', l3Overlap);
console.log('L3 unique chars:', l3Unique);

const l3Clean = [...l3Dedup].filter(ch => !l1l2Set.has(ch)).join('');

console.log('\n=== FINAL CLEAN COUNTS ===');
console.log('Level 1:', [...l1Dedup].length, '(target: 3500)');
console.log('Level 2:', [...l2Clean].length, '(target: 3000)');
console.log('Level 3:', [...l3Clean].length, '(target: 1605)');

// 检查是否达标
const diff1 = 3500 - [...l1Dedup].length;
const diff2 = 3000 - [...l2Clean].length;
const diff3 = 1605 - [...l3Clean].length;

console.log('\n=== DIFF FROM TARGET ===');
console.log('L1 diff:', diff1 > 0 ? 'MISSING ' + diff1 : (diff1 < 0 ? 'EXTRA ' + (-diff1) : 'PERFECT'));
console.log('L2 diff:', diff2 > 0 ? 'MISSING ' + diff2 : (diff2 < 0 ? 'EXTRA ' + (-diff2) : 'PERFECT'));
console.log('L3 diff:', diff3 > 0 ? 'MISSING ' + diff3 : (diff3 < 0 ? 'EXTRA ' + (-diff3) : 'PERFECT'));

// 保存
fs.writeFileSync('l1_clean.txt', l1Dedup);
fs.writeFileSync('l2_clean.txt', l2Clean);
fs.writeFileSync('l3_clean.txt', l3Clean);
console.log('\nSaved clean character files!');
