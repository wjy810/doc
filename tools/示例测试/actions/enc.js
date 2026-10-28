// 15-05：读取各项测量，并报告页面高度
module.exports = async page => { await page.waitForFunction(() => window.__enc, null, { timeout: 30000 }); console.log(JSON.stringify(await page.evaluate(() => window.__enc))); console.log('height', await page.evaluate(() => document.documentElement.scrollHeight)); };
