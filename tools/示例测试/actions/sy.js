// 14-05：读取涨跌解读、色觉差异与工具栏检查结果
module.exports = async page => { await page.waitForTimeout(500); console.log(JSON.stringify(await page.evaluate(() => ({ ...window.__sym, wA: document.getElementById('wA').textContent, wB: document.getElementById('wB').textContent })))); };
