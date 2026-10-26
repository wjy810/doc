// POST_MODE：默认（全部打开）、bad（辉光在输出之后）、fixglass（玻璃不写入深度）
module.exports = async page => {
  const mode = process.env.POST_MODE || '';
  await page.evaluate(m => {
    const p = window.__post; p.stop();
    if (m === 'bad') { document.getElementById('badOrder').checked = true; }
    if (m === 'fixglass') { document.getElementById('glassDepth').checked = false; }
    p.arrange();
    p.render(1.0);
  }, mode);
  await page.waitForTimeout(400);
  console.log('hint:', await page.textContent('#hint'));
};
