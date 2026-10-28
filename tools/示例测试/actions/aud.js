// 18-03：读取组件、令牌、图标与资产目录的审计结果
module.exports = async page => { await page.waitForFunction(() => window.__aud, null, { timeout: 30000 }); console.log(JSON.stringify(await page.evaluate(() => window.__aud))); console.log('height', await page.evaluate(() => document.documentElement.scrollHeight)); };
