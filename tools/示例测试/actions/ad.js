// 14-07：读取色调、裁切与动作检查的结果
module.exports = async page => { await page.waitForFunction(() => window.__ad, null, { timeout: 30000 }); console.log(JSON.stringify(await page.evaluate(() => window.__ad))); };
