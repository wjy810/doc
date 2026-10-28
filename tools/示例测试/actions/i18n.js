// 16-05：读取文本扩展、复数、排序、搜索与资源检查的结果
module.exports = async page => { await page.waitForFunction(() => window.__i18n && window.__i18n.cut, null, { timeout: 30000 }); console.log(JSON.stringify(await page.evaluate(() => window.__i18n))); console.log('height', await page.evaluate(() => document.documentElement.scrollHeight)); };
