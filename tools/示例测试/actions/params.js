module.exports = async page => {
  await page.evaluate(() => {
    const P = window.__params;
    P.setCompare(true);
    document.getElementById('presetA').value = '平静'; document.getElementById('presetA').dispatchEvent(new Event('change'));
    document.getElementById('presetB').value = '活泼'; document.getElementById('presetB').dispatchEvent(new Event('change'));
    P.freeze(10); P.ripple(0.5, 0.5);          // 在 10 秒时点击中心
    P.freeze(10.45);                           // 定格在点击后 0.45 秒
  });
  await page.waitForTimeout(400);
  // 重建参数：改变涟漪上限，记录编译用时
  await page.evaluate(() => { const i = document.getElementById('p-maxRipples'); i.value = 16; i.dispatchEvent(new Event('input')); i.dispatchEvent(new Event('change')); });
  console.log('rebuild:', await page.textContent('#msg'));
  await page.evaluate(() => { const i = document.getElementById('p-maxRipples'); i.value = 8; i.dispatchEvent(new Event('change')); });
  // 保存预设并重新加载页面，检查预设仍在
  await page.click('#save');
  console.log('save:', await page.textContent('#msg'));
  await page.reload(); await page.waitForTimeout(1500);
  console.log('after reload options:', await page.$$eval('#presetA option', o => o.map(x => x.value).join(',')));
  // 导入一个参数越界、缺项的预设文件
  const fs = require('fs'), f = require('path').join(require('os').tmpdir(), 'bad-presets.json');
  fs.writeFileSync(f, JSON.stringify({ version: 1, presets: { '越界': { amp: 999, wave: 'abc' } } }));
  await page.setInputFiles('#importP', f);
  await page.waitForTimeout(300);
  console.log('import:', await page.textContent('#msg'), JSON.stringify(await page.evaluate(() => JSON.parse(localStorage.getItem('ripple-presets-v1'))['越界'])));
  // 回到截图状态
  await page.evaluate(() => {
    const P = window.__params; P.setCompare(true);
    document.getElementById('presetA').value = '平静'; document.getElementById('presetA').dispatchEvent(new Event('change'));
    document.getElementById('presetB').value = '活泼'; document.getElementById('presetB').dispatchEvent(new Event('change'));
    P.freeze(10); P.ripple(0.42, 0.55); P.freeze(10.3); P.ripple(0.62, 0.4); P.freeze(10.75);
    document.getElementById('msg').textContent = '';
  });
  await page.waitForTimeout(400);
};
