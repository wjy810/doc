// 15-04：读取两版流程的检查结果与提示文字，并报告页面高度
module.exports = async page => { await page.waitForFunction(() => window.__fl, null, { timeout: 30000 }); console.log(JSON.stringify(await page.evaluate(() => window.__fl))); console.log('height', await page.evaluate(() => document.documentElement.scrollHeight)); };
