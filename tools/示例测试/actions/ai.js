// 17-03：读取流式渲染、滚动、实时区域、取消、版本与来源检查的结果
module.exports = async page => { await page.waitForFunction(() => window.__ai, null, { timeout: 30000 }); console.log(JSON.stringify(await page.evaluate(() => window.__ai))); console.log('height', await page.evaluate(() => document.documentElement.scrollHeight)); };
