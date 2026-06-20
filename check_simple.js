// 检查 TRAD_MAP 的大小和常见字覆盖
const fs = require('fs');

// 读取 chars.js
const content = fs.readFileSync('chars.js', 'utf-8');

// 提取 TRAD_MAP 内容
const tradMatch = content.match(/const TRAD_MAP = (\{[^}]+\});/);
if (!tradMatch) {
    console.log('找不到 TRAD_MAP');
    process.exit(1);
}

// 解析 TRAD_MAP
const TRAD_MAP = JSON.parse(
    tradMatch[1]
        .replace(/'([^']+)':'?([^']*)'?/g, '"$1":"$2"')  // 'a':'b' -> "a":"b"
        .replace(/""/g, '"')                              // 清理空字符串
);

console.log(`TRAD_MAP 现有映射数: ${Object.keys(TRAD_MAP).length}`);

// 一些常见的需要繁体映射的字
const commonChars = ['邓', '汉', '满', '温', '测', '渐', '渔', '滑', '湾', '湿', '溅', '沟', '浊', '浅', '洁', '浅', '浅', '涨', '滑', '漆', '溜', '漆', '漫', '渐', '滑', '潜', '潭', '浅', '滑', '激', '潮', '潜', '潘', '潜', '滑', '湿', '温', '湿', '湿', '湿', '湿'];

console.log('\n=== 检查常见字 ===');
for (const char of commonChars) {
    const has = TRAD_MAP[char] && TRAD_MAP[char] !== char;
    console.log(`${char} -> ${TRAD_MAP[char] || '无'} ${has ? '✓' : '(缺失)'}`);
}

// 邓的正确繁体是鄧
console.log('\n=== 特别检查 ===');
console.log(`邓 -> ${TRAD_MAP['邓'] || '无映射'} (正确应该是: 鄧)`);
console.log(`汉 -> ${TRAD_MAP['汉'] || '无映射'} (正确应该是: 漢)`);
console.log(`满 -> ${TRAD_MAP['满'] || '无映射'} (正确应该是: 滿)`);
