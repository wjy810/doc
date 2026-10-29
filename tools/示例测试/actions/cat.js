// 18-04：读取组件清点、迁移表、目录完整度与“只读目录的新同事”的结果
module.exports = async page => { await page.waitForFunction(() => window.__cat, null, { timeout: 30000 }); console.log(JSON.stringify(await page.evaluate(() => window.__cat))); console.log('height', await page.evaluate(() => document.documentElement.scrollHeight)); };
