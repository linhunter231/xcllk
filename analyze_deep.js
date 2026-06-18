// 深度分析已有数据，从第二块内容中分离二级和三级字表
const fs = require('fs');

const content = fs.readFileSync('full_content.txt', 'utf8');

// 找到实际的字符块（从 "一乙二十丁厂七卜..." 之后）
const l1Start = content.indexOf('一乙二十丁厂七卜');
const l2Start = content.indexOf('乂乜兀');

console.log('L1 start:', l1Start);
console.log('L2 start:', l2Start);

// 提取 l1Raw 和 l2Raw（纯汉字）
function onlyCJK(s) {
    const result = [];
    for (const ch of s) {
        if (ch >= '\u4e00' && ch <= '\u9fff') result.push(ch);
    }
    return result.join('');
}

// 从 l1Start 到 l2Start 提取纯汉字
const l1Raw = onlyCJK(content.substring(l1Start, l2Start));
// 从 l2Start 到文件末尾提取纯汉字
const l2Raw = onlyCJK(content.substring(l2Start));

console.log('L1 raw:', [...l1Raw].length);
console.log('L2 raw:', [...l2Raw].length);

// 现在，让我们分析第二块的内容（l2Raw 13634字）
// 可能其中有重复数据，也可能包含二级和三级字表

// 首先，去重
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

const l1Unique = dedup(l1Raw);
const l2AllUnique = dedup(l2Raw);

console.log('L1 unique:', [...l1Unique].length);
console.log('L2+L3 raw unique:', [...l2AllUnique].length);

// 现在 l2AllUnique 包含了第二块中所有唯一的汉字
// 但它可能包含一些重复字符，也可能混合了二级和三级字表

// 检查 L1 中有哪些在 L2 中也有
const l1Set = new Set([...l1Unique]);
let l2L1Overlap = 0;
for (const ch of l2AllUnique) {
    if (l1Set.has(ch)) l2L1Overlap++;
}
console.log('L2 unique chars overlap with L1:', l2L1Overlap);

// 从 L2 中移除 L1 已有的字符
const l2Only = [...l2AllUnique].filter(ch => !l1Set.has(ch)).join('');
console.log('L2 chars (excluding L1):', [...l2Only].length);

// 现在我们可以：
// 1. l1Unique 作为一级字表基础
// 2. l2Only 从中拆分二级和三级字表
// 标准：一级3500，二级3000，三级1605
// 总数应该是 3500+3000+1605 = 8105

console.log('\n=== Analysis ===');
console.log('From source: L1 has', [...l1Unique].length, 'unique chars');
console.log('L2+L3 source has', [...l2Only].length, 'unique chars (excluding L1)');
console.log('Total unique chars available:', [...l1Unique].length + [...l2Only].length);

// 如果总数超过8105，说明我们获得了多于标准的字符
// 这可能是网页数据中有一些不相关的字符

// 让我们看看第二块（l2Only）的开头部分 - 如果它确实是二级字表
// 应该从 "乂乜兀弋孑孓幺亓韦..." 等开始
console.log('\n=== L2+L3 start (first 200 chars) ===');
console.log(l2Only.substring(0, 200));

console.log('\n=== L2+L3 end (last 200 chars) ===');
console.log(l2Only.substring(Math.max(0, [...l2Only].length - 200)));

// 现在的策略：
// 如果一级字表实际只有2435字（从dalao.net提取），我们可以：
// 1. 补充字符达到3500（从L2中提取常见字）
// 2. 把L2中的3000字作为二级字表
// 3. 剩下的作为三级字表

// 或者，让我们尝试从更完整的来源看是否能找到完整的字表
// 实际上，让我们尝试从原始的第二块内容中提取不同的部分

// 分析第二块的结构：可能是 "编号拼音[字]" 格式
const rawL2Segment = content.substring(l2Start);
console.log('\n=== Raw L2 segment (first 500 chars) ===');
console.log(rawL2Segment.substring(0, 500));

// 检查是否有 "3501" 这样的编号
const first3501 = rawL2Segment.indexOf('3501');
console.log('\nFound 3501 at:', first3501);

// 检查是否有像数字+拼音+[字] 的结构
const bracketCharMatch = rawL2Segment.match(/\[\s*([\u4e00-\u9fa5])\s*\]/g);
console.log('Bracket patterns found:', bracketCharMatch ? bracketCharMatch.length : 0);
if (bracketCharMatch && bracketCharMatch.length > 0) {
    console.log('First 10 bracket chars:');
    for (let i = 0; i < Math.min(10, bracketCharMatch.length); i++) {
        console.log(' ', bracketCharMatch[i]);
    }
}

// 检查是否有大量连续汉字（每行或每段一个字）
// 检查是否有换行符分隔的模式
console.log('\n=== Looking for line-by-line format ===');
const lines = rawL2Segment.split(/[\r\n]+/).slice(0, 30);
for (let i = 0; i < Math.min(20, lines.length); i++) {
    const line = lines[i].trim();
    if (line.length > 0) {
        console.log(`Line ${i}: ${line.substring(0, 100)}`);
    }
}

// 让我们看 raw_page.html 中的特殊结构 - 查找 "3500" 和 "3501" 附近
console.log('\n=== Around 3500/3501 marker ===');
const htmlRaw = fs.readFileSync('raw_page.html', 'utf8');
const p3500 = htmlRaw.indexOf('3500');
const p3501 = htmlRaw.indexOf('3501');
console.log('3500 at:', p3500);
console.log('3501 at:', p3501);

if (p3500 > 0) {
    console.log('\nContext around 3500:');
    console.log(htmlRaw.substring(Math.max(0, p3500 - 200), p3500 + 300).replace(/\s+/g, ' '));
}
if (p3501 > 0) {
    console.log('\nContext around 3501:');
    console.log(htmlRaw.substring(Math.max(0, p3501 - 200), p3501 + 300).replace(/\s+/g, ' '));
}

// 检查第二块中是否有 "乂" 等字开头的字符序列
console.log('\n=== Searching for level-2 start marker ===');
// 查找典型二级字表开头
const ercha = htmlRaw.indexOf('乂');
const wuwang = htmlRaw.indexOf('乜');
console.log('乂 at:', ercha);
console.log('乜 at:', wuwang);

if (ercha > 0) {
    console.log('Context around 乂:');
    console.log(htmlRaw.substring(Math.max(0, ercha - 300), ercha + 500).replace(/\s+/g, ' '));
}
