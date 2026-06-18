const fs = require('fs');

const content = fs.readFileSync('chars.js', 'utf8');

// 检查 LEVEL1_CHARS
const l1Match = content.match(/const LEVEL1_CHARS = '([^']+)'/);
if (l1Match) {
    const l1 = l1Match[1];
    console.log('=== LEVEL1_CHARS ===');
    console.log('  String length (.length):', l1.length);
    console.log('  Char count (Array.from):', Array.from(l1).length);
    console.log('  First 10 chars:', Array.from(l1).slice(0, 10).join(','));
    console.log('  Last 10 chars:', Array.from(l1).slice(-10).join(','));
    
    // 检查是否有特殊字符
    const specialChars = [];
    for (let i = 0; i < l1.length; i++) {
        const ch = l1[i];
        const code = ch.charCodeAt(0);
        if (code < 0x4E00 && code > 32) {
            specialChars.push({idx: i, char: ch, code: code});
        }
        if (ch === '\'' || ch === '\"' || ch === '\\') {
            specialChars.push({idx: i, char: ch, code: code, special: true});
        }
    }
    if (specialChars.length > 0) {
        console.log('  Special chars found:', specialChars.slice(0, 20));
    } else {
        console.log('  No special chars found');
    }
} else {
    console.log('ERROR: No LEVEL1_CHARS match found!');
}

// 检查 LEVEL2_CHARS
const l2Match = content.match(/const LEVEL2_CHARS = '([^']+)'/);
if (l2Match) {
    const l2 = l2Match[1];
    console.log('\n=== LEVEL2_CHARS ===');
    console.log('  String length (.length):', l2.length);
    console.log('  Char count (Array.from):', Array.from(l2).length);
    console.log('  First 10 chars:', Array.from(l2).slice(0, 10).join(','));
}

// 检查 LEVEL3_CHARS
const l3Match = content.match(/const LEVEL3_CHARS = '([^']+)'/);
if (l3Match) {
    const l3 = l3Match[1];
    console.log('\n=== LEVEL3_CHARS ===');
    console.log('  String length (.length):', l3.length);
    console.log('  Char count (Array.from):', Array.from(l3).length);
    console.log('  First 10 chars:', Array.from(l3).slice(0, 10).join(','));
}

// 尝试在 Node 中模拟浏览器解析
console.log('\n=== TEST: Evaluating chars.js ===');
try {
    eval(content);
    const pairs = getCharsByLevel(1);
    console.log('  getCharsByLevel(1) returned:', pairs.length, 'pairs');
    console.log('  First 5:', pairs.slice(0, 5).map(p => p.simplified + '->' + p.traditional).join(','));
    
    const pairs2 = getCharsByLevel(2);
    console.log('  getCharsByLevel(2) returned:', pairs2.length, 'pairs');
    
    const pairs3 = getCharsByLevel(3);
    console.log('  getCharsByLevel(3) returned:', pairs3.length, 'pairs');
} catch (e) {
    console.log('  ERROR:', e.message);
}
