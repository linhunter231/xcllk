// 验证草诀谱字库
const fs = require('fs');
const content = fs.readFileSync('chars.js', 'utf-8');

// 提取 CAOJUE_CHARS
const caojueMatch = content.match(/const CAOJUE_CHARS = '([^']+)';/);
if (!caojueMatch) {
    console.log('❌ 未找到 CAOJUE_CHARS');
    process.exit(1);
}

const caojue = caojueMatch[1];
console.log('草诀谱字库原始字符数:', caojue.length);

// 去重
const uniqueChars = [...new Set(caojue)].join('');
console.log('去重后字符数:', uniqueChars.length);

// 验证函数
eval(content);
const pairs = getCharsByLevel(4);
console.log('getCharsByLevel(4) 返回字对数:', pairs.length);
console.log('前10个字对:', pairs.slice(0, 10).map(p => p.simplified + '→' + p.traditional).join(', '));
console.log('');
console.log('✅ 草诀谱字库验证完成！');
