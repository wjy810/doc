// 16-06：读取修正前后的检查结果，并报告页面高度
module.exports = async page => { await page.waitForFunction(() => window.__l2, null, { timeout: 30000 }); console.log(JSON.stringify(await page.evaluate(() => window.__l2))); console.log('height', await page.evaluate(() => document.documentElement.scrollHeight)); };
