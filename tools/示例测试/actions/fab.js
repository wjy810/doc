// 16-11：读取单位、切缝、校准件、文件检查与 G 代码的结果
module.exports = async page => { await page.waitForFunction(() => window.__fabReady, null, { timeout: 30000 }); console.log(JSON.stringify(await page.evaluate(() => window.__fab))); console.log('height', await page.evaluate(() => document.documentElement.scrollHeight)); };
