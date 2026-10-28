// 15-07：读取投影与聚合标注的测量，并报告页面高度
module.exports = async page => { await page.waitForFunction(() => window.__map, null, { timeout: 30000 }); console.log(JSON.stringify(await page.evaluate(() => window.__map))); console.log('height', await page.evaluate(() => document.documentElement.scrollHeight)); };
