// 09-11：打印首次测量结果，再测一次看波动
module.exports = async page => {
  const show = r => console.log(JSON.stringify({ A: r.m.A.toFixed(1), B: r.m.B.toFixed(1), Bmove: r.m.Bmove.toFixed(1), Ap95: r.m.Ap95.toFixed(1), Bp95: r.m.Bp95.toFixed(1), bake: r.firstBakeMs?.toFixed(1), diffs: r.diffs.map(d => `${d.name} ${d.mean.toFixed(1)} ${d.overPct.toFixed(1)}% ${d.psnr.toFixed(1)}dB`) }));
  show(await page.evaluate(() => window.__cmp.first));
  if (process.env.AGAIN) show(await page.evaluate(() => window.__cmp.run()));
  console.log(await page.evaluate(() => JSON.stringify(window.__cmp.first.cond)));
};
