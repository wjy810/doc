// 播放弹簧动画并定格在一半，检查 linear() 是否被浏览器接受
module.exports = async page => {
  const ok = await page.evaluate(() => CSS.supports('transition-timing-function', document.getElementById('ball').dataset.easing));
  console.log('linear() accepted:', ok, '|', await page.textContent('#settle'));
  await page.click("#play"); await page.waitForTimeout(70);
  await page.evaluate(() => document.getAnimations().forEach(a => a.pause()));
};
