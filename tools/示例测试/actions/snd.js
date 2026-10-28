// 16-07：读取离线渲染的测量结果，并报告页面高度
module.exports = async page => { await page.waitForFunction(() => window.__snd, null, { timeout: 60000 }); console.log(JSON.stringify(await page.evaluate(() => window.__snd))); console.log('height', await page.evaluate(() => document.documentElement.scrollHeight)); };
