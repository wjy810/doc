// 18-06：四种条件 × 10 个组件 × 三个版本（A 改动前、B 改动后、E 只应用声明的修改）逐个截图并比较
module.exports = async page => {
  await page.waitForFunction(() => window.__vr);
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => document.getElementById('stageWrap').classList.add('show'));
  const comps = await page.evaluate(() => window.__vr.COMPONENTS.map(c => [c[0], c[1]]));
  const CONDS = [['light', 360], ['light', 768], ['dark', 360], ['dark', 768]];
  const shots = {};
  for (const [theme, width] of CONDS) for (const v of ['A', 'B', 'E']) {
    await page.evaluate(([v, t, w]) => window.__vr.render(v, t, w), [v, theme, width]);
    for (const [k] of comps) shots[`${theme}-${width}-${v}-${k}`] = (await page.locator(`#c-${k}`).screenshot()).toString('base64');
  }
  const res = [];
  for (const [theme, width] of CONDS) for (const [k, name] of comps) {
    const key = v => shots[`${theme}-${width}-${v}-${k}`];
    const ab = await page.evaluate(([a, b]) => window.__vr.diff(a, b, false), [key('A'), key('B')]);
    const eb = await page.evaluate(([a, b]) => window.__vr.diff(a, b, true), [key('E'), key('B')]);
    const cls = await page.evaluate(([k, x, y]) => window.__vr.classify(k, x, y), [k, ab.n, eb.n]);
    res.push({ theme, width, k, name, ab: ab.n, eb: eb.n, cls, url: eb.n ? eb.url : null, before: eb.n ? key('A') : null, after: eb.n ? key('B') : null });
  }
  await page.evaluate(() => document.getElementById('stageWrap').classList.remove('show'));
  await page.evaluate(([res, comps, CONDS]) => {
    const V = window.__vr, nm = { light: '浅色', dark: '深色' };
    V.fill('grid', '<tr><th>组件</th>' + CONDS.map(([t, w]) => `<th>${nm[t]} ${w}</th>`).join('') + '</tr>' + comps.map(([k, name]) => `<tr><th>${name}${V.DECLARED.includes(k) ? ' <span class="cls exp">已声明</span>' : ''}</th>${CONDS.map(([t, w]) => { const r = res.find(x => x.k === k && x.theme === t && x.width === w); return `<td><span class="cls ${r.cls}">${V.LABEL[r.cls]}</span> <span class="sub">${r.ab}${r.eb ? `／${r.eb}` : ''}</span></td>`; }).join('')}</tr>`).join(''));
    const bad = res.filter(r => r.cls === 'bad'), exp = res.filter(r => r.cls === 'exp');
    V.fill('mgrid', `每格：分类、A 与 B 不同的像素／预期结果 E 与 B 不同的像素。40 格里，${exp.length} 格的变化完全能被变更请求解释；${bad.length} 格有声明以外的变化：${[...new Set(bad.map(r => r.name))].join('、')}。课程卡片里有按钮和标签，它的变化一部分是预期的，所以不能只看“有没有变”，要和“只应用声明修改”的结果比。`);
    const pick = []; for (const r of bad) if (!pick.some(p => p.k === r.k && p.theme === r.theme)) pick.push(r);
    V.fill('shots', pick.slice(0, 4).map(r => `<figure><img src="data:image/png;base64,${r.before}" alt=""><img src="data:image/png;base64,${r.after}" alt="" style="margin-top:2px"><img src="${r.url}" alt="" style="margin-top:2px">${r.name} · ${nm[r.theme]} ${r.width}：上 A，中 B，下 是 B 与预期结果的差异（红色）</figure>`).join(''));
    V.fill('cover', '<tr><th>指标</th><th>值</th><th>说明</th></tr>' + [
      ['快照覆盖率', '100%（10／10 个组件 × 4 种条件）', '只说明每个组件都拍了照'],
      ['A 与 B 有差异的格子', `${res.filter(r => r.ab).length}／40`, '只说明“变了”'],
      ['能被变更请求解释的', `${exp.length}`, '可以直接接受，仍要看一眼'],
      ['有声明以外变化的', `${bad.length}`, '必须有人判断：是问题，还是变更请求漏写了']
    ].map(r => `<tr><th>${r[0]}</th><td>${r[1]}</td><td class="sub">${r[2]}</td></tr>`).join(''));
    V.fill('mcover', '覆盖率 100% 不说明改动是对的：如果习惯“有差异就一键更新基准图”，这次的两个问题会和预期修改一起被接受。追查结果：<b>提示条和课程卡片</b>的间距变窄，是因为同一个间距令牌 --gap-s 被改成了 2（本来只想改标签内部）；<b>输入框在深色主题</b>下边框变成了浅灰，是因为有人在输入框上写死了浅色主题的边框色，浅色主题里看不出来。每一处差异都要写明“预期修改”还是“问题”，问题要修，漏写的要补进变更请求。');
  }, [res, comps, CONDS]);
  console.log(JSON.stringify(res.map(r => [r.theme, r.width, r.k, r.ab, r.eb, r.cls])));
  console.log('height', await page.evaluate(() => document.documentElement.scrollHeight));
};
