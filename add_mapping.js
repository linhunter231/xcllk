const fs = require('fs');
let content = fs.readFileSync('chars.js', 'utf-8');

// 添加 '认':'認' 和 '仅':'僅' 到 TRAD_MAP
// 在 '单':'單' 后面添加
if (!content.includes("'认':'認'")) {
    content = content.replace("'单':'單',", "'单':'單','认':'認','仅':'僅',");
    fs.writeFileSync('chars.js', content, 'utf-8');
    console.log('✅ 已添加 "认":"認" 和 "仅":"僅"');
} else {
    console.log('映射已存在');
}

// 验证
const evalContent = content.replace(/const TRAD_MAP = /, 'const TRAD_MAP_TEST = ');
eval(evalContent);
console.log('认 →', TRAD_MAP_TEST['认']);
console.log('仅 →', TRAD_MAP_TEST['仅']);
