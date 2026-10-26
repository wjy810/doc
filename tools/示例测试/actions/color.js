module.exports = async page => { await page.waitForTimeout(300); console.log(JSON.stringify(await page.evaluate(() => window.__color))); };
