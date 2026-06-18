// 从 dalao.net 抓取通用规范汉字表
const https = require('https');
const fs = require('fs');

function fetchPage(url) {
    return new Promise((resolve, reject) => {
        https.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml',
                'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            },
            timeout: 30000,
        }, (res) => {
            if (res.statusCode === 301 || res.statusCode === 302) {
                const redirectUrl = new URL(res.headers.location, url).href;
                fetchPage(redirectUrl).then(resolve).catch(reject);
                return;
            }
            if (res.statusCode !== 200) {
                reject(new Error(`HTTP ${res.statusCode}`));
                return;
            }
            let data = '';
            res.setEncoding('utf8');
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => resolve(data));
        }).on('error', reject)
          .on('timeout', function() { this.destroy(new Error('Timeout')); });
    });
}

// 从页面提取文本块中提取纯汉字
function extractPureChars(text) {
    const chars = [];
    for (const ch of text) {
        if (ch >= '\u4e00' && ch <= '\u9fff') {
            chars.push(ch);
        }
    }
    return chars.join('');
}

async function main() {
    const url = 'https://www.dalao.net/thread-51960.htm?sort=asc';
    console.log('Fetching page...');
    const html = await fetchPage(url);
    console.log('Page size:', html.length, 'bytes');
    
    // 保存原始HTML
    fs.writeFileSync('raw_page.html', html);
    
    // 找到各级字表位置
    const l1Idx = html.indexOf('一级字表');
    const l2Idx = html.indexOf('二级字表');
    const l3Idx = html.indexOf('三级字表');
    
    console.log('L1 start:', l1Idx);
    console.log('L2 start:', l2Idx);
    console.log('L3 start:', l3Idx);
    
    // 提取各段（去除HTML标签后提取汉字
    function getCharsBetween(startIdx, endIdx) {
        const segment = html.substring(startIdx, endIdx);
        // 移除 HTML 标签
        const cleaned = segment.replace(/<[^>]+>/g, ' ');
        return extractPureChars(cleaned);
    }
    
    // 一级字表
    const l1Raw = getCharsBetween(l1Idx, l2Idx);
    const l2Raw = getCharsBetween(l2Idx, l3Idx);
    const l3Raw = getCharsBetween(l3Idx, html.length);
    
    console.log('Level 1 (before dedup):', [...l1Raw].length);
    console.log('Level 2 (before dedup):', [...l2Raw].length);
    console.log('Level 3 (before dedup):', [...l3Raw].length);
    
    // 一级字表应该从 '一乙二十丁厂...' 开始到 '疆攘' 结束
    // 需要去除前面的说明文字
    // 尝试用更精确的方法: 找到 '一乙二十丁厂七卜八人...' 这段
    
    // 重新分析 - 找最长的连续汉字块
    const l1Segment = html.substring(l1Idx, l2Idx);
    const l1Cleaned = l1Segment.replace(/<[^>]+>/g, ' ');
    
    // 找最长的汉字序列（去除标点后）
    const l1CharBlocks = l1Cleaned.split(/[^一-龥]+/).filter(s => s.length > 50);
    console.log('\nLevel 1 blocks:', l1CharBlocks.length);
    for (let i = 0; i < Math.min(5, l1CharBlocks.length); i++) {
        console.log(`  Block ${i}: len=${[...l1CharBlocks[i]].length}, start='${l1CharBlocks[i].substring(0, 30)}...'`);
    }
    
    const l2Segment = html.substring(l2Idx, l3Idx);
    const l2Cleaned = l2Segment.replace(/<[^>]+>/g, ' ');
    const l2CharBlocks = l2Cleaned.split(/[^一-龥]+/).filter(s => s.length > 50);
    console.log('\nLevel 2 blocks:', l2CharBlocks.length);
    for (let i = 0; i < Math.min(5, l2CharBlocks.length); i++) {
        console.log(`  Block ${i}: len=${[...l2CharBlocks[i]].length}, start='${l2CharBlocks[i].substring(0, 30)}...'`);
    }
    
    const l3Segment = html.substring(l3Idx);
    const l3Cleaned = l3Segment.replace(/<[^>]+>/g, ' ');
    const l3CharBlocks = l3Cleaned.split(/[^一-龥]+/).filter(s => s.length > 20);
    console.log('\nLevel 3 blocks:', l3CharBlocks.length);
    for (let i = 0; i < Math.min(10, l3CharBlocks.length); i++) {
        console.log(`  Block ${i}: len=${[...l3CharBlocks[i]].length}, start='${l3CharBlocks[i].substring(0, 30)}...'`);
    }
    
    // 合并块
    let l1Combined = l1CharBlocks.join('');
    let l2Combined = l2CharBlocks.join('');
    let l3Combined = l3CharBlocks.join('');
    
    // 去除重复字符（保持顺序）
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
    
    const l1Final = dedup(l1Combined);
    const l2Final = dedup(l2Combined);
    const l3Final = dedup(l3Combined);
    
    console.log('\n=== Final (after dedup) ===');
    console.log('Level 1:', [...l1Final].length);
    console.log('Level 2:', [...l2Final].length);
    console.log('Level 3:', [...l3Final].length);
    
    console.log('\nL1 start:', l1Final.substring(0, 50));
    console.log('L1 end:', l1Final.substring(Math.max(0, [...l1Final].length - 50)));
    console.log('\nL2 start:', l2Final.substring(0, 50));
    console.log('L2 end:', l2Final.substring(Math.max(0, [...l2Final].length - 50)));
    console.log('\nL3 start:', l3Final.substring(0, 50));
    console.log('L3 end:', l3Final.substring(Math.max(0, [...l3Final].length - 50)));
    
    // 保存结果
    fs.writeFileSync('l1_final.txt', l1Final);
    fs.writeFileSync('l2_final.txt', l2Final);
    fs.writeFileSync('l3_final.txt', l3Final);
    
    console.log('\nFiles saved.');
}

main().catch(console.error);
