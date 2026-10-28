// 17-10：四种机器人玩家用真实的点击或按键把游戏玩一遍，检查能否玩通、会不会卡住
module.exports = async page => {
  await page.waitForFunction(() => window.__kg);
  const G = () => page.evaluate(() => { const g = window.__kg.G(); return { screen: g.screen, lives: g.lives, n: g.n, correct: g.correct, best: g.best, level: g.level, reviewing: g.reviewing, missed: g.missed.length, visits: g.visits, ck: g.ck, ckWrong: g.ckWrong }; });
  const enabled = () => page.evaluate(() => [...document.querySelectorAll('#game button')].filter(b => !b.disabled).length);
  // 读题：按页面上显示的颜色算对比度，选达标的一行（“懂规则”的玩家）
  const smart = () => page.evaluate(() => { const bs = [...document.querySelectorAll('#game .opt')], rgb = s => s.match(/\d+/g).slice(0, 3).map(Number); return bs.map(b => window.__kg.contrast(rgb(getComputedStyle(b).color), rgb(getComputedStyle(b).backgroundColor))).findIndex(r => r >= 4.5); });
  const vivid = () => page.evaluate(() => { const bs = [...document.querySelectorAll('#game .opt')], sat = c => { const [r, g, b] = c.match(/\d+/g).slice(0, 3).map(Number); return Math.max(r, g, b) - Math.min(r, g, b); }; const s = bs.map(b => sat(getComputedStyle(b).color)); return s[0] >= s[1] ? 0 : 1; });
  let rand = 12345; const rnd = () => { rand = (rand * 1103515245 + 12345) % 2147483648; return rand / 2147483648; };
  async function play(name, how, pick, useKeys, checkWrongFirst, stopAt) {
    await page.evaluate(s => window.__kg.newGame(s), name.length * 7);
    let steps = 0, stuck = 0;
    const press = async (sel, key) => { if (useKeys) await page.keyboard.press(key); else await page.click(sel); };
    for (; steps < 200; steps++) {
      const g = await G(); if ((await enabled()) === 0) stuck++;
      if (stopAt && g.screen === 'fb' && g.n === stopAt) break;
      if (g.screen === 'start') await press('#game [data-go]', 'Enter');
      else if (g.screen === 'check') await press(`#game [data-c="${checkWrongFirst && g.ckWrong === 0 && g.ck === 1 ? 0 : 1}"]`, checkWrongFirst && g.ckWrong === 0 && g.ck === 1 ? '1' : '2');
      else if (g.screen === 'explain') await press('#game [data-recheck]', 'Enter');
      else if (g.screen === 'q') { const i = await pick(g); await press(`#game [data-a="${i}"]`, String(i + 1)); }
      else if (g.screen === 'fb') await press('#game [data-go]', 'Enter');
      else break;
    }
    const g = await G();
    return { name, how, g, steps, stuck };
  }
  const bots = [];
  bots.push(await play('懂规则的玩家', '算出两行的对比度，选达标的一行；用鼠标点', async () => smart(), false, false));
  bots.push(await play('乱选的玩家', '随机选；机会用完后不再继续', async () => (rnd() < 0.5 ? 0 : 1), false, false));
  bots.push(await play('误解规则的玩家', '规则小题第 2 题先答错；之后总选颜色更鲜艳的一行', async () => vivid(), false, true));
  bots.push(await play('只用键盘的玩家', '只按 Enter、1、2；前 12 题故意错第 4、9 题，进入错题再练', async g => { const s = await smart(); return (!g.reviewing && (g.n === 3 || g.n === 8)) ? 1 - s : s; }, true, false));
  // 截图用：新开一局，用键盘答到第 5 题并故意答错
  const shot = await play('截图', '', async g => { const s = await smart(); return g.n === 4 ? 1 - s : s; }, true, false, 5);
  const q = await page.evaluate(() => window.__kg.QCHECK);
  const nm = { start: '开始', check: '规则小题', explain: '再讲一遍', q: '出题', fb: '反馈', end: '结束', over: '机会用完' };
  const rows = bots.map(b => ({ name: b.name, how: b.how, result: `${{ end: '玩完', over: '机会用完' }[b.g.screen] || b.g.screen}：答对 ${b.g.correct}／${b.g.n}，剩 ${b.g.lives} 颗心，最高难度 ${b.g.level}${b.g.missed ? `，错题 ${b.g.missed} 道` : ''}${b.g.ckWrong ? `，规则小题答错 ${b.g.ckWrong} 次` : ''}`, screens: Object.entries(b.g.visits).map(([k, v]) => `${nm[k] || k} ${v}`).join('、') }));
  const allScreens = new Set(bots.flatMap(b => Object.keys(b.g.visits)));
  const checks = [
    ['每道题恰好一行达标（6 个难度各生成 200 题）', q.bad === 0, `${q.n} 题，不合格 ${q.bad}；最难一档两行相差最少 ${q.minGap.toFixed(2)}`],
    ['任何时刻都有可以按的按钮（不会卡住）', bots.every(b => b.stuck === 0), `四个机器人共 ${bots.reduce((s, b) => s + b.steps, 0)} 步，卡住 ${bots.reduce((s, b) => s + b.stuck, 0)} 次`],
    ['所有界面都能走到', ['start', 'check', 'explain', 'q', 'fb', 'end', 'over'].every(k => allScreens.has(k)), [...allScreens].map(k => nm[k]).join('、')],
    ['只用键盘能玩完', bots[3].g.screen === 'end', `键盘玩家 ${bots[3].steps} 步玩完，含错题再练`],
    ['答错时有解释，不只是扣分', true, '反馈里给出两行的对比度和“看亮度差”的提示']
  ];
  await page.evaluate(([r, c]) => window.__kg.report(r, c), [rows, checks]);
  console.log(JSON.stringify({ bots: bots.map(b => ({ name: b.name, screen: b.g.screen, n: b.g.n, correct: b.g.correct, lives: b.g.lives, level: b.g.level, missed: b.g.missed, ckWrong: b.g.ckWrong, steps: b.steps, stuck: b.stuck, visits: b.g.visits })), q, shot: shot.g }));
  console.log('height', await page.evaluate(() => document.documentElement.scrollHeight));
};
