module.exports = async page => { await page.waitForFunction(() => window.__cmp, null, { timeout: 30000 }); console.log(JSON.stringify(await page.evaluate(() => window.__cmp))); };
