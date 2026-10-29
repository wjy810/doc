// 21-04 项目 03：对初版与完成版执行同一组上传操作，结果写回完成版页面
const file = (name, mimeType = 'application/pdf', size = 240000) => ({ name, mimeType, buffer: Buffer.alloc(size, 1) });
const LONG = '2026年第三季度用户研究访谈记录整理（含附录、原始录音转写与编码表）_最终版_修订3_请勿外传_final_final_v2_2026-10-29.pdf';
module.exports = async page => {
  const base = page.url().split('?')[0], R = {};
  const fresh = async v => { await page.goto(base + (v === 'A' ? '?v=a' : '?v=b')); await page.waitForTimeout(150); };
  const st = () => page.evaluate(() => window.__up.state());
  const srv = () => page.evaluate(() => ({ ...window.__up.SERVER }));
  const clickIf = async sel => { const el = page.locator(sel); if (await el.isVisible()) { await el.click(); return true; } return false; };
  for (const v of ['A', 'B']) {
    const r = {};
    // 重复提交
    await fresh(v); await page.setInputFiles('#file', file('季度报告.pdf'));
    const box = await page.locator('#start').boundingBox();
    for (let i = 0; i < 3; i++) { await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2); await page.waitForTimeout(40); }
    await page.waitForTimeout(2000); let s = await srv();
    r.dup = { ok: s.uploads === 1, text: `${s.uploads} 次上传请求` };
    // 断网与恢复
    await fresh(v); await page.evaluate(() => window.__up.NET.offline = true); await page.setInputFiles('#file', file('季度报告.pdf')); await page.click('#start');
    await page.waitForTimeout(4000); let t = await st();
    r.offline = { ok: /失败/.test(t.status), text: t.status || `没有任何提示（进度条停在 ${t.bar || '0%'}）` };
    await page.evaluate(() => window.__up.NET.offline = false);
    const used = (await clickIf('#retry')) ? '重试' : (await clickIf('#start')) ? '再点一次“开始上传”' : '无法操作';
    await page.waitForTimeout(2000); t = await st(); s = await srv();
    const hanging = s.uploads - s.completed - s.aborted, done = /完成/.test(t.status) || t.result !== '';
    r.retry = { ok: done && hanging === 0, text: `${used}：${done ? '完成' : '未完成'}；仍挂起的请求 ${hanging} 个` };
    // 超长文件名
    await fresh(v); await page.setInputFiles('#file', file(LONG)); await page.waitForTimeout(100);
    const over = await page.evaluate(() => window.__up.overflow());
    r.long = { ok: over === 0, text: over ? `超出 ${over} 像素` : '没有超出（中间省略，悬停显示全名）' };
    // 取消后等待
    await fresh(v); await page.setInputFiles('#file', file('季度报告.pdf')); await page.click('#start'); await page.waitForTimeout(300); await page.click('#cancel'); await page.waitForTimeout(1500);
    t = await st(); s = await srv();
    r.cancel = { ok: t.result === '', text: t.result ? `取消后仍出现了结果（${t.result.split('\n').length} 项）` : `${t.status}（请求已中止 ${s.aborted} 个）` };
    // 空结果
    await fresh(v); await page.setInputFiles('#file', file('empty-scan.pdf')); await page.click('#start'); await page.waitForTimeout(1800); t = await st();
    r.empty = { ok: /没有/.test(t.status), text: t.status || '结果区一片空白，没有说明' };
    // 不支持的文件
    await fresh(v); await page.setInputFiles('#file', file('setup.exe', 'application/octet-stream')); await clickIf('#start'); await page.waitForTimeout(1500); t = await st(); s = await srv();
    r.invalid = { ok: s.uploads === 0 && /不支持/.test(t.status), text: s.uploads ? `照常上传并分析（${s.uploads} 次请求）` : t.status };
    // 进度文字
    await fresh(v); await page.setInputFiles('#file', file('季度报告.pdf')); await page.click('#start'); await page.waitForTimeout(350); t = await st();
    r.progress = { ok: /\d+%/.test(t.status), text: t.status || `只有进度条（${t.bar}），没有文字` };
    R[v] = r;
  }
  await fresh('B'); await page.evaluate(R => window.__up.report(R), R);
  await page.setInputFiles('#file', file('季度报告.pdf')); await page.click('#start'); await page.waitForTimeout(1600);
  console.log(JSON.stringify(R));
  console.log('height', await page.evaluate(() => document.documentElement.scrollHeight));
};
