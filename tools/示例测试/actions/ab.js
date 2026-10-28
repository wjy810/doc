// 13-11：两位模拟参与者（P01 先 A 后 B，P02 先 B 后 A），每人在两个版本上各做一项任务，用真实点击指出答案所在的行
module.exports = async page => {
  await page.waitForFunction(() => window.__ab);
  const run = async (pid, ver, task, rows, result, explain) => { await page.evaluate(([p, v, t]) => window.__start(p, v, t), [pid, ver, task]); for (const r of rows) { await page.click(`#${ver} [data-r="${r}"]`); await page.waitForTimeout(80); } await page.evaluate(([r, e]) => window.__end(r, e), [result, explain]); };
  await run('P01', 'A', 'T1 到岗时间', ['时间', '到岗'], '成功', '先看到“时间”，以为是到岗时间，再往下看才找到');
  await run('P01', 'B', 'T4 试用期', ['试用期'], '成功', '先找“入职”那一组');
  await run('P02', 'B', 'T1 到岗时间', ['到岗'], '成功', '看到“入职”就知道在这里');
  await run('P02', 'A', 'T4 试用期', ['面试', '试用期'], '成功', '一行一行往下看，先点错了“面试”');
  console.log(JSON.stringify(await page.evaluate(() => ({ ctrl: window.__ab.ctrl, preds: window.__ab.preds, log: window.__ab.LOG }))));
};
