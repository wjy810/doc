// 17-05：读取光标、评论锚点、冲突、撤销、权限与离线恢复的结果
module.exports = async page => { await page.waitForFunction(() => window.__collab, null, { timeout: 30000 }); console.log(JSON.stringify(await page.evaluate(() => window.__collab))); console.log('height', await page.evaluate(() => document.documentElement.scrollHeight)); };
