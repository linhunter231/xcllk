// 检查 TRAD_MAP 覆盖情况
const fs = require('fs');
const content = fs.readFileSync('chars.js', 'utf-8');

// 提取 TRAD_MAP
const tradMapMatch = content.match(/const TRAD_MAP = ({[^}]+});/);
if (!tradMapMatch) {
    console.log('❌ 未找到 TRAD_MAP');
    process.exit(1);
}

// 评估代码
eval(content);

console.log('=== TRAD_MAP 覆盖情况检查 ===\n');

// 检查一级字表中有多少字有繁体映射
let coveredInLevel1 = 0;
let missingInLevel1 = [];
for (let i = 0; i < LEVEL1_CHARS.length; i++) {
    const char = LEVEL1_CHARS[i];
    if (TRAD_MAP[char] && TRAD_MAP[char] !== char) {
        coveredInLevel1++;
    } else {
        missingInLevel1.push(char);
    }
}
console.log(`一级字表总字数: ${LEVEL1_CHARS.length}`);
console.log(`有繁体映射的字数: ${coveredInLevel1}`);
console.log(`没有繁体映射的字数: ${missingInLevel1.length}`);
console.log(`覆盖率: ${((coveredInLevel1 / LEVEL1_CHARS.length) * 100).toFixed(1)}%`);
console.log(`\n前50个没有繁体映射的字: ${missingInLevel1.slice(0, 50).join(', ')}`);

console.log('\n=== 检查"邓"字 ===');
console.log(`"邓"在一级字表中: ${LEVEL1_CHARS.includes('邓') ? '是' : '否'}`);
console.log(`"邓"的繁体映射: ${TRAD_MAP['邓'] || '无 (显示简体)'}`);
console.log(`"邓"的正确繁体应该是: 鄧`);
