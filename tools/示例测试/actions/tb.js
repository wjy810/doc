// 17-11：读取访问权限对照、数据用途对照与操作分类的结果
module.exports = async page => { await page.waitForFunction(() => window.__tb, null, { timeout: 30000 }); console.log(JSON.stringify(await page.evaluate(() => window.__tb))); console.log('height', await page.evaluate(() => document.documentElement.scrollHeight)); };
