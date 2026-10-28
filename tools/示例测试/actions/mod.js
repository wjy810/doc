// 16-12：读取模块尺寸、组装检查（含故意改错）、抽屉、排版与分阶段的结果
module.exports = async page => { await page.waitForFunction(() => window.__modReady, null, { timeout: 30000 }); await page.waitForTimeout(300); console.log(JSON.stringify(await page.evaluate(() => window.__mod))); console.log('height', await page.evaluate(() => document.documentElement.scrollHeight)); };
