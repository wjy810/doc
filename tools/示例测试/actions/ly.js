// 19-03 版式效果：依次测量静态页、杂志、Bento，再让瀑布流的图片陆续到达
module.exports = async page => {
  const r = await page.evaluate(async () => { const a = __ly.staticPage(), b = __ly.magazine(), c = __ly.bento(); await __ly.feeds(); await new Promise(r => setTimeout(r, 300)); const d = __ly.feedReport(); return { a, b, c, d }; });
  console.log(JSON.stringify(r.a.map(x => [x.v, x.w, x.fs, x.titleLines, x.orphan, x.cpl, x.over])));
  console.log(JSON.stringify(r.b.map(x => [x.v, x.wrong])), JSON.stringify(r.c));
  console.log(JSON.stringify(r.d.map(x => [x.k, x.row, x.cnt, x.cls.toFixed(3)])));
  console.log('height', await page.evaluate(() => document.documentElement.scrollHeight));
};
