// 17-08：读取报修流程的规则检查与随机操作结果
module.exports = async page => { await page.waitForFunction(() => window.__rs, null, { timeout: 30000 }); console.log(JSON.stringify(await page.evaluate(() => window.__rs))); console.log('height', await page.evaluate(() => document.documentElement.scrollHeight)); };
