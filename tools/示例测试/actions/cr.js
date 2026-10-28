// 14-09：读取证据与分类结果
module.exports = async page => { await page.waitForFunction(() => window.__cr, null, { timeout: 30000 }); console.log(JSON.stringify(await page.evaluate(() => window.__cr))); };
