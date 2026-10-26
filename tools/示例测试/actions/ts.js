module.exports = async page => {
  console.log(JSON.stringify(await page.evaluate(() => ({ ways: window.__ts.ways, gap: window.__ts.gap }))));
  console.log(await page.$$eval('#t1 tr', r => r.map(x => x.textContent.replace(/\s+/g, ' ')).join(' | ')));
};
