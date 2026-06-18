// 从帖子内容中精确分割字表
const fs = require('fs');
const html = fs.readFileSync('raw_page.html', 'utf8');

// 找到 message div 区域
const msgStart = html.indexOf('class="message break-all box-shadow"');
const contentStart = html.indexOf('>', msgStart) + 1;
const commentStart = html.indexOf('<div class="comment', contentStart);
const endContainer = commentStart > 0 ? commentStart : html.length;

let content = html.substring(contentStart, endContainer);
// 去除 HTML 标签
content = content.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ' ');
content = content.replace(/&nbsp;/g, ' ');

// 保存完整内容用于调试
fs.writeFileSync('full_content.txt', content);

// 在 content 中查找 一乙二十丁厂七卜 的所有出现
const l1Start = '一乙二十丁厂七卜';
let idx = 0;
let positions = [];
while ((idx = content.indexOf(l1Start, idx)) !== -1) {
    positions.push(idx);
    idx++;
}
console.log('Found 一乙二十丁厂七卜 at:', positions);

// 也查找 "二级字表" 的实际内容开始 - 因为L1结束后是L2的字符
// 查找 L1 结束的地方（L1 应该有3500字，大约从某个字符开始到另一个字符结束）
// 我们可以通过字符统计来定位

// 检查每一个位置附近的上下文
for (let p of positions) {
    console.log('\n--- Position', p, '---');
    console.log('Context (200 chars):', content.substring(p, p + 200));
}

// 现在我们知道实际的字表开始字符了
// L1: 一乙二十丁厂七卜... 到3500字
// L2: 乂乜兀弋孑孓幺亓韦...
// L3: 丬凵匚匸夨夬巿亣亍亓仉仂仨... 等

// 查找 L2 的开始字符
const l2Start = '乂乜兀';
let idx2 = 0;
let positions2 = [];
while ((idx2 = content.indexOf(l2Start, idx2)) !== -1) {
    positions2.push(idx2);
    idx2++;
}
console.log('\nFound 乂乜兀 at:', positions2);

// 查找 L3 的开始字符（三级字表通常以生僻字开头）
// 尝试查找一些典型的三级字表开头
const l3Patterns = ['丬凵匚', '亣亍亓', '仉仂仨'];
for (const pattern of l3Patterns) {
    let idx3 = 0;
    let pos3 = [];
    while ((idx3 = content.indexOf(pattern, idx3)) !== -1) {
        pos3.push(idx3);
        idx3++;
    }
    if (pos3.length > 0) {
        console.log('Found', pattern, 'at:', pos3);
    }
}

// 让我们从内容中只提取纯汉字序列（保留空格和换行用于结构分析）
let chineseOnly = [];
let inCJK = false;
let cjkCount = 0;
for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    if (ch >= '\u4e00' && ch <= '\u9fff') {
        chineseOnly.push(ch);
        inCJK = true;
        cjkCount++;
    } else if (inCJK) {
        // 遇到非汉字，添加分隔符标记（如果后面还有汉字的话）
        chineseOnly.push('|');
        inCJK = false;
    }
}
const cjkText = chineseOnly.join('');
console.log('\nTotal CJK chars:', cjkCount);
console.log('CJK text length:', cjkText.length);

// 找到 CJK 块的结构
const segments = cjkText.split('|').filter(s => s.length > 0);
console.log('CJK segments found:', segments.length);
for (let i = 0; i < Math.min(20, segments.length); i++) {
    console.log(`Seg ${i}: len=${[...segments[i]].length}, start='${segments[i].substring(0, 40)}...'`);
}

// 分析大的 segments - 应该就是 L1, L2, L3
const bigSegments = segments.filter(s => [...s].length > 500);
console.log('\n=== BIG SEGMENTS (length > 500) ===');
for (let i = 0; i < bigSegments.length; i++) {
    const seg = bigSegments[i];
    console.log(`BigSeg ${i}: len=${[...seg].length}`);
    console.log(`  start: ${seg.substring(0, 60)}`);
    console.log(`  end: ${seg.substring(Math.max(0, [...seg].length - 60))}`);
}

// 根据长度排序 - 应该分别是 L1 (3500), L2 (3000), L3 (1605)
// 但注意可能在页面上 L1, L2 等的顺序和格式
console.log('\n=== CHECKING SEGMENTS MATCH ===');
for (let i = 0; i < bigSegments.length; i++) {
    const len = [...bigSegments[i]].length;
    // 检查是否接近 3500, 3000 或 1605
    if (Math.abs(len - 3500) < 100) console.log(`Seg ${i} (len ${len}) ~= L1`);
    else if (Math.abs(len - 3000) < 100) console.log(`Seg ${i} (len ${len}) ~= L2`);
    else if (Math.abs(len - 1605) < 200) console.log(`Seg ${i} (len ${len}) ~= L3`);
    else console.log(`Seg ${i} (len ${len}) - UNKNOWN`);
}

// 保存
fs.writeFileSync('cjk_segments.txt', segments.map((s, i) => `SEG ${i} (len ${[...s].length}):\n${s}\n`).join('\n'));
console.log('\nSegments saved to cjk_segments.txt');
