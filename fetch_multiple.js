// 从多个来源抓取通用规范汉字表
const https = require('https');
const http = require('http');
const fs = require('fs');
const { URL } = require('url');

function fetchPage(url) {
    return new Promise((resolve, reject) => {
        try {
            const u = new URL(url);
            const protocol = u.protocol === 'https:' ? https : http;
            protocol.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
                },
                timeout: 30000,
            }, (res) => {
                if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 303 || res.statusCode === 307) {
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
        } catch (e) {
            reject(e);
        }
    });
}

async function trySource(name, url) {
    console.log(`\n=== Trying source: ${name} ===`);
    try {
        const html = await fetchPage(url);
        console.log(`Got ${html.length} bytes`);
        
        // 提取纯汉字
        const chars = (html.match(/[\u4e00-\u9fa5]{20,}/g) || []);
        console.log(`Found ${chars.length} long Chinese segments`);
        
        // 查找关键标记
        const hasL1 = html.includes('一级字') || html.includes('常用字');
        const hasL2 = html.includes('二级字') || html.includes('次常用');
        const hasL3 = html.includes('三级字') || html.includes('通用字');
        console.log(`L1 marker: ${hasL1}, L2 marker: ${hasL2}, L3 marker: ${hasL3}`);
        
        // 保存 HTML
        const safeName = name.replace(/[\\/:*?"<>|]/g, '_');
        fs.writeFileSync(`src_${safeName}.html`, html);
        
        // 返回关键信息
        return { chars: chars.length, hasL1, hasL2, hasL3, html };
    } catch (e) {
        console.log(`Error: ${e.message}`);
        return null;
    }
}

async function main() {
    // 多个候选来源
    const sources = [
        // 百度百科或其他中文维基
        ['baijiahao_1', 'https://www.360doc.cn/article/46599637_772069434.html'],
        ['360doc_1', 'https://www.360doc.cn/article/46599637_772069434.html'],
        ['zhihu_1', 'https://zhuanlan.zhihu.com/p/378289187'],
        ['wikipedia_cn', 'https://zh.wikipedia.org/zh-cn/%E9%80%9A%E7%94%A8%E8%A6%8F%E8%8C%83%E6%BC%A2%E5%AD%97%E8%A1%A8'],
        ['hanyuwiki', 'https://www.hanyu.com/zi/biaozhun/'],
    ];

    const results = [];
    for (const [name, url] of sources) {
        const r = await trySource(name, url);
        if (r) results.push({ name, ...r });
    }
    
    console.log('\n\n=== SUMMARY ===');
    for (const r of results) {
        console.log(`${r.name}: ${r.chars} segments, L1=${r.hasL1}, L2=${r.hasL2}, L3=${r.hasL3}`);
    }
}

main().catch(console.error);
