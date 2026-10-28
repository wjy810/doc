// 12-05：读取三部分的模拟结果
module.exports = async page => {
  const r = await page.evaluate(() => ({ tm: window.__tan.tm, truth: window.__tan.truthEv, naive: window.__tan.naiveEv.length, rob: window.__tan.robEv.map(e => `${e.id}${e.type}@${(e.f / 30).toFixed(2)}`), pins: window.__pins, serial: window.__serial }));
  console.log(JSON.stringify(r, null, 1));
};
