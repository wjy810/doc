// 14-04：读取四种风格的检查结果
module.exports = async page => { await page.waitForFunction(() => window.__style, null, { timeout: 30000 }); console.log(JSON.stringify(await page.evaluate(() => window.__style))); };
