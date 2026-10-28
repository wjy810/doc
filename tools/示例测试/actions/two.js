// 14-11：读取两种方向的检查结果与观察者汇总，并报告页面高度
module.exports = async page => { await page.waitForFunction(() => window.__two, null, { timeout: 30000 }); console.log(JSON.stringify(await page.evaluate(() => window.__two), null, 1)); console.log('height', await page.evaluate(() => document.documentElement.scrollHeight)); };
