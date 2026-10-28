// 14-03：读取四种构图的测量结果
module.exports = async page => { await page.waitForFunction(() => window.__comp, null, { timeout: 30000 }); console.log(JSON.stringify(await page.evaluate(() => window.__comp))); };
