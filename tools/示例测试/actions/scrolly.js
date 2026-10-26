module.exports = async page => {
  const state = () => page.evaluate(() => ({ step: document.getElementById('stage').dataset.step,
    active: document.querySelector('.chapter.active')?.dataset.step, current: document.querySelector('[aria-current="step"]')?.dataset.go,
    bar: getComputedStyle(document.getElementById('bar')).transform }));
  await page.click('[data-go="4"]'); await page.waitForTimeout(1200);
  console.log('nav → 4:', JSON.stringify(await state()));
  const box = await page.locator('#scroller').boundingBox();
  await page.mouse.move(box.x + 100, box.y + 100);
  for (let i = 0; i < 6; i++) { await page.mouse.wheel(0, -120); await page.waitForTimeout(120); }
  await page.waitForTimeout(800);
  console.log('wheel up:', JSON.stringify(await state()));
  await page.click('[data-go="3"]'); await page.waitForTimeout(1200);
  console.log('nav → 3:', JSON.stringify(await state()));
};
