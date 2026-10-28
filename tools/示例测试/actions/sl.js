// 13-04：读取两个版本的显著性排名与帧差结果
module.exports = async page => { await page.waitForFunction(() => window.__sal, null, { timeout: 30000 }); console.log(JSON.stringify(await page.evaluate(() => window.__sal), (k, v) => typeof v === 'number' ? +v.toFixed(3) : v)); };
