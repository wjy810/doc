// 12-04：选取测试；真实鼠标点击被遮挡的物体两次（循环选择）；拖动近处与远处的物体各 100 像素；旋转、聚焦、换视角检查标注遮挡
module.exports = async page => {
  const box = await page.locator('#main').boundingBox(), S = box.width / 640;
  const at = (x, y) => [box.x + x * S, box.y + y * S];
  const center = name => page.evaluate(n => { const o = window.__sp.objects.find(o => o.name === n), s = window.__sp.screenInfo(o); return [s.cx, s.cy]; }, name);
  console.log('pick', JSON.stringify(await page.evaluate(() => window.__sp.pickTest())));
  console.log('occluded at start', JSON.stringify(await page.evaluate(() => window.__sp.occState)));
  // 循环选择：在圆柱的位置连点两次
  const c = await center('隔板后的圆柱');
  await page.mouse.click(...at(...c)); await page.waitForTimeout(200); console.log('click1', await page.evaluate(() => window.__sp.getSel()));
  await page.mouse.click(...at(...c)); await page.waitForTimeout(200); console.log('click2', await page.evaluate(() => window.__sp.getSel()));
  // 拖动 100 像素：先算不吸附时的位移，再用真实鼠标拖动（吸附开启）
  const rows = [];
  for (const name of ['近处的箱子', '远处的小球']) {
    const [x, y] = await center(name);
    const info = await page.evaluate(([n, x, y]) => { const sp = window.__sp, o = sp.objects.find(o => o.name === n); const THREE = o.position.constructor; return { dist: o.position.distanceTo(sp.camera.position), start: o.position.toArray() }; }, [name, x, y]);
    await page.mouse.move(...at(x, y)); await page.mouse.down(); await page.mouse.move(...at(x + 100, y), { steps: 10 }); await page.mouse.up(); await page.waitForTimeout(150);
    const snapped = await page.evaluate(n => window.__sp.pos(n), name);
    rows.push({ name, dist: info.dist, start: info.start, snapped });
  }
  // 不吸附的位移：关闭吸附后把物体放回原处再拖一次
  await page.click('#snap');
  for (const r of rows) {
    await page.evaluate(([n, p]) => window.__sp.objects.find(o => o.name === n).position.fromArray(p), [r.name, r.start]); await page.waitForTimeout(100);
    const [x, y] = await center(r.name);
    await page.mouse.move(...at(x, y)); await page.mouse.down(); await page.mouse.move(...at(x + 100, y), { steps: 10 }); await page.mouse.up(); await page.waitForTimeout(150);
    r.raw = await page.evaluate(n => window.__sp.pos(n), r.name);
  }
  await page.click('#snap');
  const d = (a, b) => Math.hypot(a[0] - b[0], a[2] - b[2]);
  await page.evaluate(rows => { const t = document.getElementById('drag'); for (const r of rows) t.insertAdjacentHTML('beforeend', `<tr><td>${r.name}</td><td class="num">${r.dist.toFixed(1)} 米</td><td class="num">${r.rawD.toFixed(2)} 米</td><td class="num">${r.snapD.toFixed(2)} 米</td></tr>`); }, rows.map(r => ({ ...r, rawD: d(r.raw, r.start), snapD: d(r.snapped, r.start) })));
  for (const r of rows) console.log('drag', r.name, r.dist.toFixed(2), d(r.raw, r.start).toFixed(3), d(r.snapped, r.start).toFixed(3));
  // 旋转与聚焦
  const b = await center('近处的箱子'); await page.mouse.click(...at(...b)); await page.focus('#main'); await page.keyboard.press('q'); await page.keyboard.press('q');
  const s = await center('远处的小球'); await page.mouse.click(...at(...s)); await page.keyboard.press('f'); await page.waitForTimeout(300);
  console.log('after focus occ', JSON.stringify(await page.evaluate(() => window.__sp.occState)));
  await page.click('#reset'); await page.waitForTimeout(200);
  await page.evaluate(() => { const sp = window.__sp; sp.camera.position.set(9, 4, -9); sp.controls.update(); }); await page.waitForTimeout(300);
  console.log('side view occ', JSON.stringify(await page.evaluate(() => window.__sp.occState)));
  await page.evaluate(() => { const sp = window.__sp; sp.logRows.push(['换到侧后方视角', `隔板后的圆柱：${sp.occState['隔板后的圆柱'] ? '仍被遮挡' : '标注恢复正常显示'}`]); });
  await page.click('#reset'); await page.waitForTimeout(200);
  const c2 = await center('隔板后的圆柱'); await page.mouse.click(...at(...c2)); await page.waitForTimeout(100); await page.mouse.click(...at(...c2)); await page.waitForTimeout(300);
  for (const r of await page.evaluate(() => window.__sp.logRows)) console.log('log', r.join(' | '));
  console.log(await page.locator('#cond').innerText());
};
