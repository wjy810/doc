// 15-03：读取审计、徽章与边界核对结果，并报告页面高度
module.exports = async page => { await page.waitForFunction(() => window.__ct, null, { timeout: 30000 }); console.log(JSON.stringify(await page.evaluate(() => window.__ct))); console.log('height', await page.evaluate(() => document.documentElement.scrollHeight)); };
