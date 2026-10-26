// 打开“模糊测试”
module.exports = async page => { await page.click('#blur'); await page.waitForTimeout(400); };
