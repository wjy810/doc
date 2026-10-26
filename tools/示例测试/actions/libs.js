// 三种写法同时重播，等结束后检查最终位置是否一致
module.exports = async page => {
  for (const id of ['css', 'motion', 'gsap']) await page.click(`#${id} button`);
  await page.waitForTimeout(1500);
  const res = await page.evaluate(() => ['css', 'motion', 'gsap'].map(id => {
    const box = document.querySelector(`#${id} .box`), m = new DOMMatrix(getComputedStyle(box).transform);
    const chips = [...document.querySelectorAll(`#${id} .chips span`)].map(s => getComputedStyle(s).opacity).join('');
    return `${id}: x=${Math.round(m.m41)} rot=${Math.round(Math.atan2(m.b, m.a) * 180 / Math.PI)} chipsOpacity=${chips}`;
  }));
  console.log(res.join(' | '), '| lane', await page.evaluate(() => document.querySelector('.lane').clientWidth - 40));
};
