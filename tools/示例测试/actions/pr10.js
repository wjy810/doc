// 14-10：读取规则提炼、对照与熵，并报告页面高度
module.exports = async page => { await page.waitForFunction(() => window.__pr10, null, { timeout: 30000 }); console.log(JSON.stringify(await page.evaluate(() => window.__pr10))); console.log('height', await page.evaluate(() => document.documentElement.scrollHeight)); };
