// 19-05 反馈与布局动画：真实点击、按下移开、失败、中断展开、连点排序、拖拽与键盘
const sleep = ms => new Promise(r => setTimeout(r, ms));
module.exports = async page => {
  const ev = (f, a) => page.evaluate(f, a), R = { A: {}, B: {} };
  const reset = v => ev(v => { __mf.SRV.log.length = 0; __mf.SRV.fail = false; const s = document.querySelector('#b' + v + ' .st'); s.textContent = ''; s.className = 'st'; }, v);
  for (const v of ['A', 'B']) {
    const btn = page.locator(`#b${v} button`);
    // 连点三次
    await reset(v); await btn.click({ clickCount: 3, delay: 30 }); await sleep(700);
    R[v].triple = await ev(v => __mf.SRV.log.filter(x => x === v).length, v);
    // 按下后移开再松手（用户想取消）
    await reset(v); const b = await btn.boundingBox();
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.mouse.down(); await page.mouse.move(b.x + b.width / 2, b.y + b.height + 80, { steps: 5 }); await page.mouse.up(); await sleep(700);
    R[v].cancel = await ev(v => __mf.SRV.log.filter(x => x === v).length, v);
    // 服务器失败
    await reset(v); await ev(() => { __mf.SRV.fail = true; }); await btn.click(); await sleep(800);
    R[v].fail = await ev(v => document.querySelector('#b' + v + ' .st').textContent, v);
    R[v].failShot = 'data:image/png;base64,' + (await page.locator(`#b${v}`).screenshot()).toString('base64');
    await ev(() => { __mf.SRV.fail = false; });
  }
  // 卡片展开：点开 0.15 秒后按 Esc
  for (const v of ['A', 'B']) {
    const sample = ev(v => __mf.sampleDetail(v, 1100), v);
    await page.locator(`#x${v} .c`).first().click();
    const inside = await ev(v => !!document.activeElement.closest('#x' + v + ' .detail'), v);
    await sleep(150); await page.keyboard.press('Escape');
    const s = await sample;
    const back = await ev(v => document.activeElement === document.querySelector('#x' + v + ' .c'), v);
    R[v].card = { inside, jump: s.jump, last: s.last, back };
  }
  // 列表：0.1 秒内先按价格、再按时间
  for (const v of ['A', 'B']) {
    await page.locator(`#l${v} [data-k="1"]`).click(); await sleep(100); await page.locator(`#l${v} [data-k="2"]`).click(); await sleep(900);
    R[v].list = await ev(v => { const st = document.getElementById('l' + v), vis = [...st.querySelectorAll('.row')].sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top).map(e => +e.dataset.i), data = __mf.LIST[v].order; return { vis: vis.map(i => __mf.ROWS[i][0].slice(0, 4)), data: data.map(i => __mf.ROWS[i][0].slice(0, 4)), wrong: vis.filter((x, i) => x !== data[i]).length, status: (st.querySelector('[role=status]') || {}).textContent }; }, v);
  }
  // 拖拽：拖到画板右边外面；Ctrl+Z；方向键
  for (const v of ['A', 'B']) {
    const n = page.locator(`#d${v} .node`), nb = await n.boundingBox(), sb = await page.locator('#d' + v).boundingBox();
    await page.mouse.move(nb.x + 30, nb.y + 20); await page.mouse.down(); await page.mouse.move(sb.x + sb.width + 60, nb.y + 47, { steps: 8 }); await page.mouse.up(); await sleep(50);
    const pos = await ev(v => { const n = document.querySelector('#d' + v + ' .node'), b = document.querySelector('#d' + v + ' .board'); return { l: n.offsetLeft, t: n.offsetTop, out: n.offsetLeft + 60 > b.offsetLeft + b.clientWidth + 1 }; }, v);
    await page.keyboard.press('Control+z'); await sleep(50);
    const undo = await ev(v => { const n = document.querySelector('#d' + v + ' .node'); return { l: n.offsetLeft, t: n.offsetTop }; }, v);
    await n.focus().catch(() => {}); const before = await ev(v => document.querySelector('#d' + v + ' .node').offsetLeft, v);
    await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowRight'); await sleep(50);
    const after = await ev(v => document.querySelector('#d' + v + ' .node').offsetLeft, v);
    R[v].drag = { pos, undo: undo.l === 28 && undo.t === 28, snapped: (pos.l - 8) % 20 === 0, key: after - before };
  }
  console.log(JSON.stringify(R, (k, x) => typeof x === 'string' && x.startsWith('data:') ? '…' : typeof x === 'number' ? +x.toFixed(1) : x));
  await ev(R => {
    const c = (ok, t) => `<td class="${ok ? 'good' : 'poor'}">${t}</td>`;
    __mf.fill('tB', `<tr><th></th><th>连点三次</th><th>按下后移开</th><th>服务器失败时显示</th></tr>` + ['A', 'B'].map(v => `<tr><th>${v}</th>${c(R[v].triple === 1, R[v].triple + ' 次提交')}${c(!R[v].cancel, R[v].cancel + ' 次提交')}${c(!/已加入/.test(R[v].fail), '“' + R[v].fail + '”')}</tr>`).join(''));
    __mf.fill('tX', `<tr><th></th><th>打开后焦点在详情里</th><th>展开中按 Esc：详情存在时一帧内最大的宽度变化</th><th>消失前的宽度（卡片宽 76）</th><th>关闭后焦点回到卡片</th></tr>` + ['A', 'B'].map(v => { const x = R[v].card; return `<tr><th>${v}</th>${c(x.inside, x.inside ? '是' : '否')}${c(x.jump < 60, Math.round(x.jump) + ' 像素')}${c(x.last < 110, Math.round(x.last) + ' 像素' + (x.last < 110 ? '，与卡片重合' : '，整块突然消失'))}${c(x.back, x.back ? '是' : '否')}</tr>`; }).join(''));
    __mf.fill('tL', `<tr><th></th><th>数据顺序（按时间）</th><th>画面顺序</th><th>不一致</th></tr>` + ['A', 'B'].map(v => { const x = R[v].list; return `<tr><th>${v}</th><td>${x.data.join('、')}</td><td>${x.vis.join('、')}</td>${c(!x.wrong, x.wrong + '／5' + (x.status ? '；提示“' + x.status + '”' : ''))}</tr>`; }).join(''));
    __mf.fill('tD', `<tr><th></th><th>拖到画板外</th><th>松手吸附到格点</th><th>Ctrl＋Z</th><th>方向键 → 两次</th></tr>` + ['A', 'B'].map(v => { const x = R[v].drag; return `<tr><th>${v}</th>${c(!x.pos.out, x.pos.out ? '拖出去了，找不回来' : '停在边界内')}${c(x.snapped, x.snapped ? '是' : '否')}${c(x.undo, x.undo ? '回到原处' : '没有反应')}${c(x.key === 40, x.key ? '移动 ' + x.key + ' 像素' : '不能用键盘')}</tr>`; }).join(''));
  }, R);
  await ev(() => { document.activeElement.blur(); window.scrollTo(0, 0); });
  console.log('height', await ev(() => document.documentElement.scrollHeight));
};
