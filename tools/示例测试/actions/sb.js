// 17-07：读取服务蓝图的结构比较与 40 个预约的模拟结果
module.exports = async page => { await page.waitForFunction(() => window.__sb, null, { timeout: 30000 }); console.log(JSON.stringify(await page.evaluate(() => window.__sb))); console.log('height', await page.evaluate(() => document.documentElement.scrollHeight)); };
