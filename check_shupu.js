// 验证书谱字库
const fs = require('fs');
const content = fs.readFileSync('chars.js', 'utf-8');

// 提取 SHUPU_CHARS
const shupuMatch = content.match(/const SHUPU_CHARS = '([^']+)';/);
if (!shupuMatch) {
    console.log('❌ 未找到 SHUPU_CHARS');
    process.exit(1);
}

const shupu = shupuMatch[1];
console.log('书谱字库原始字符数:', shupu.length);

// 去重
const uniqueChars = [...new Set(shupu)].join('');
console.log('去重后字符数:', uniqueChars.length);

// 验证函数
eval(content);
const pairs = getCharsByLevel(5);
console.log('getCharsByLevel(5) 返回字对数:', pairs.length);
console.log('前10个字对:', pairs.slice(0, 10).map(p => p.simplified + '→' + p.traditional).join(', '));

// 检查书谱特色字
const keyTerms = ['书', '谱', '钟', '张', '羲', '献', '笔', '墨', '法', '碑', '帖', '草', '真', '隶', '篆', '行', '孙', '庭', '吴', '郡'];
console.log('\n=== 书谱特色字检查 ===');
for (const term of keyTerms) {
    const found = pairs.some(p => p.simplified === term);
    console.log(`${term} → ${found ? '✓' : '✗'}`);
}
console.log('\n✅ 书谱字库验证完成！');
