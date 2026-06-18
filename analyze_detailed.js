// 仔细分析已抓取的数据结构
const fs = require('fs');

const segments = fs.readFileSync('cjk_segments.txt', 'utf8');
const fullContent = fs.readFileSync('full_content.txt', 'utf8');

// 分析内容中的数字/字符混合模式 - 可能有 "3501" 这样的编号
// 这些编号可能用来分隔不同级别字表

// 首先，看看 full_content 中有多少数字 3500 附近的数字
const numPattern = /(\d{3,4})/g;
let match;
const numCounts = {};
while ((match = numPattern.exec(fullContent)) !== null) {
    const num = parseInt(match[1]);
    if (num >= 1 && num <= 8500) {
        numCounts[num] = (numCounts[num] || 0) + 1;
    }
}

// 找出高频数字（应该是字表边界：3500, 6500, 8105）
const sorted = Object.entries(numCounts).sort((a, b) => b[1] - a[1]).slice(0, 20);
console.log('=== Frequent numbers in content ===');
for (const [num, count] of sorted) {
    console.log(`  ${num}: ${count} times`);
}

// 也检查是否有 "3500" 字符作为边界
console.log('\n=== Checking boundary markers ===');
console.log('Position of 3500:', fullContent.indexOf('3500'));
console.log('Position of 3501:', fullContent.indexOf('3501'));
console.log('Position of 6500:', fullContent.indexOf('6500'));
console.log('Position of 6501:', fullContent.indexOf('6501'));

// 让我们从 full_content 中的实际内容来分析
// 找到 一级字表 后到 二级字表 前的所有内容
console.log('\n=== Full content around L1/L2 boundary ===');
// 查找最后出现的 "一级字表" 和之后的 "二级字表"
let l1LastIdx = fullContent.lastIndexOf('一级字表');
let l2FirstIdx = fullContent.indexOf('二级字表', l1LastIdx + 1);
let l2LastIdx = fullContent.lastIndexOf('二级字表');
let l3FirstIdx = fullContent.indexOf('三级字表', l2LastIdx + 1);
let l3LastIdx = fullContent.lastIndexOf('三级字表');

console.log('l1LastIdx:', l1LastIdx);
console.log('l2FirstIdx:', l2FirstIdx);
console.log('l2LastIdx:', l2LastIdx);
console.log('l3FirstIdx:', l3FirstIdx);
console.log('l3LastIdx:', l3LastIdx);

// 如果存在清晰的分隔
if (l1LastIdx > 0 && l2LastIdx > l1LastIdx && l3LastIdx > l2LastIdx) {
    console.log('\n=== Using last occurrences for boundaries ===');
    
    const l1Start = l1LastIdx + 4; // 跳过 "一级字表"
    const l2Start = l2LastIdx + 4; // 跳过 "二级字表"
    const l3Start = l3LastIdx + 4; // 跳过 "三级字表"
    
    const l1Block = fullContent.substring(l1Start, l2LastIdx);
    const l2Block = fullContent.substring(l2Start, l3LastIdx);
    const l3Block = fullContent.substring(l3Start);
    
    function onlyCJK(s) {
        const result = [];
        for (const ch of s) {
            if (ch >= '\u4e00' && ch <= '\u9fff') result.push(ch);
        }
        return result.join('');
    }
    
    const l1Chars = onlyCJK(l1Block);
    const l2Chars = onlyCJK(l2Block);
    const l3Chars = onlyCJK(l3Block);
    
    console.log('L1 block chars:', [...l1Chars].length);
    console.log('L2 block chars:', [...l2Chars].length);
    console.log('L3 block chars:', [...l3Chars].length);
    
    console.log('L1 first 50:', l1Chars.substring(0, 50));
    console.log('L1 last 50:', l1Chars.substring(Math.max(0, [...l1Chars].length - 50)));
    console.log('L2 first 50:', l2Chars.substring(0, 50));
    console.log('L3 first 50:', l3Chars.substring(0, 50));
}

// 让我们看看实际的大段内容（BigSeg 0 和 BigSeg 1）从 cjk_segments.txt 中获取
const segMatches = segments.split(/SEG \d+ \(len \d+\):\n/).slice(1);
console.log('\n=== Number of segments in file:', segMatches.length);

if (segMatches.length >= 2) {
    const seg0 = segMatches[0].trim();
    const seg1 = segMatches[1].trim();
    
    console.log('Seg 0 length:', [...seg0].length);
    console.log('Seg 1 length:', [...seg1].length);
    console.log('Seg 1 first 200:', seg1.substring(0, 200));
    
    // 分析 seg1 中的模式 - 可能有编号的字符列表
    // 例如 "3501yì[ 乂 ]" 这样的格式
    const bracketPattern = /\[\s*([\u4e00-\u9fff])\s*\]/g;
    let bm;
    const charsFromBrackets = [];
    while ((bm = bracketPattern.exec(seg1)) !== null) {
        charsFromBrackets.push(bm[1]);
    }
    console.log('\nChars from [字] pattern:', charsFromBrackets.length);
    if (charsFromBrackets.length > 0) {
        console.log('First 50:', charsFromBrackets.slice(0, 50).join(''));
    }
    
    // 保存 seg1 的前5000字符分析
    fs.writeFileSync('seg1_analysis.txt', seg1.substring(0, 10000));
    console.log('Seg1 first 10000 chars saved to seg1_analysis.txt');
}
