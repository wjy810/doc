// 17-04：用真实的点击和输入完成一次分析任务：纠正、编辑、局部改写、比较、恢复、查看来源、导出、发送前预览
module.exports = async page => {
  await page.click('#run');
  await page.waitForFunction(() => document.querySelectorAll('#report .para').length === 5, null, { timeout: 10000 });
  await page.click('button[data-no="D3作业说明"]');
  await page.click('button[data-yes="D1视频长度"]');
  await page.locator('#p4').fill('建议（已和助教商量）：① 本周五前发布 Windows 与 macOS 两份安装说明；② 作业 2 的说明里加一个 zip 提交示例；③ 把第 5 讲拆成两段，每段后面加 3 道小练习。');
  await page.click('#scope');
  await page.click('button[data-short="1"]');
  const vs = await page.evaluate(() => window.__aa.versions());
  const cmp = await page.evaluate(([a, b]) => window.__aa.compare(a, b), [vs.length - 1, vs.length]);
  await page.evaluate(n => window.__aa.restore(n), vs.length - 1);
  await page.click('#report .chip[data-doc="D5"]');
  await page.click('#export');
  await page.click('#send');
  await page.click('#sendCancel');
  await page.click('#send');
  await page.evaluate(() => window.__aa.haxTable());
  const out = await page.evaluate(() => ({ versions: window.__aa.versions(), R: window.__aa.R }));
  console.log(JSON.stringify({ cmp, ...out }));
  console.log('height', await page.evaluate(() => document.documentElement.scrollHeight));
};
