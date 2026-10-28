// 16-09：读取振动模式、能力检测、可达范围与移动距离的结果
module.exports = async page => { await page.waitForFunction(() => window.__hp, null, { timeout: 30000 }); console.log(JSON.stringify(await page.evaluate(() => window.__hp))); console.log('height', await page.evaluate(() => document.documentElement.scrollHeight)); };
