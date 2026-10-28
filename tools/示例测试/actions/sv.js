// 15-09：读取各项测量，并报告页面高度
module.exports = async page => { await page.waitForFunction(() => window.__sv && window.__sv.heat, null, { timeout: 30000 }); console.log(JSON.stringify(await page.evaluate(() => window.__sv))); console.log('height', await page.evaluate(() => document.documentElement.scrollHeight)); };
