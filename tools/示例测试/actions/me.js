// 13-10：读取热区图差异、置信区间、时间统计与 SUS 得分
module.exports = async page => { await page.waitForFunction(() => window.__meas, null, { timeout: 30000 }); console.log(JSON.stringify(await page.evaluate(() => window.__meas))); };
