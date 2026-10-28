// 13-08：读取颜色差与渲染出的提示音分析结果
module.exports = async page => { await page.waitForFunction(() => window.__ms, null, { timeout: 30000 }); console.log(JSON.stringify(await page.evaluate(() => window.__ms))); };
