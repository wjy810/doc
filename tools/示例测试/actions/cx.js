// 13-09：读取八种情境的检测结果
module.exports = async page => { await page.waitForFunction(() => window.__ctx, null, { timeout: 30000 }); console.log(JSON.stringify(await page.evaluate(() => window.__ctx), null, 0)); };
