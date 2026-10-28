// 13-03：读取四个版本的测量与预测
module.exports = async page => { await page.waitForFunction(() => window.__grp); console.log(JSON.stringify(await page.evaluate(() => window.__grp))); };
