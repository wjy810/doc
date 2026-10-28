// 16-04：在两个 iframe 里只用键盘尝试报名：Tab 前进，遇到输入框就输入，到达提交按钮就按 Enter，再按 Esc
module.exports = async page => {
  await page.waitForFunction(() => window.__a4, null, { timeout: 30000 });
  for (const fid of ['fb', 'fa']) {
    const frame = page.frames().find(f => f.parentFrame() === page.mainFrame() && f.name() === '' && f.url() === 'about:srcdoc' && f !== page.mainFrame());
    await page.focus('#' + fid);
    const fr = await (await page.$('#' + fid)).contentFrame();
    let done = false;
    for (let i = 0; i < 12 && !done; i++) {
      await page.keyboard.press('Tab'); await page.waitForTimeout(60);
      const info = await fr.evaluate(() => { const el = document.activeElement; return { tag: el.tagName, text: el.textContent.trim(), ph: el.placeholder || '', label: el.labels && el.labels[0] ? el.labels[0].textContent : '' }; }).catch(() => ({ tag: 'OUT' }));
      if (info.tag === 'OUT' || info.tag === 'BODY') break;
      if (info.tag === 'INPUT') await page.keyboard.type(/手机/.test(info.ph + info.label) ? '13800000000' : '林晓');
      if (info.tag === 'SELECT') await page.keyboard.press('ArrowDown');
      if (info.tag === 'BUTTON' && /提交|报名/.test(info.text)) { await page.keyboard.press('Enter'); await page.waitForTimeout(150); await page.keyboard.press('Escape'); await page.waitForTimeout(150); done = true; }
    }
  }
  await page.mouse.click(5, 5);
  const n = await page.evaluate(() => window.__a4.report());
  console.log(JSON.stringify(await page.evaluate(() => ({ vb: window.__a4.vb.map(v => [v.id, v.n]), va: window.__a4.va.map(v => [v.id, v.n]), zb: window.__a4.zb, za: window.__a4.za, kb: Object.fromEntries(Object.entries(window.__a4.KB).map(([k, v]) => [k, { ...v, steps: v.steps.map(s => s.join('|')) }])), tb: window.__a4.tb, ta: window.__a4.ta }))));
  console.log('log rows', n, 'height', await page.evaluate(() => document.documentElement.scrollHeight));
};
