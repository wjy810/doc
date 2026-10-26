module.exports = async page => {
  for (const w of [30, 50, 90]) {
    const r = await page.evaluate(w => {
      window.__agents.setExit(w);
      const marks = {}; let t = 0;
      while (t < 60) { const s = window.__agents.run(0.5); t += 0.5; for (const p of [50, 90, 100]) if (!marks[p] && s.out >= 300 * p / 100) marks[p] = t; if (s.left === 0) break; }
      return marks;
    }, w);
    console.log(`exit ${w}:`, JSON.stringify(r));
  }
};
