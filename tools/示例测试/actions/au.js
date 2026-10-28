// 11-12：打印审计结果
module.exports = async page => {
  const r = await page.evaluate(() => window.__au);
  console.log('rules', r.rules, 'colors', r.colors, 'sizes', r.sizes);
  for (const c of r.colorRows) console.log(`${c.name} ${JSON.stringify(c.roles)}: ${c.raws.join(' ')} x${c.n}`);
  console.log(JSON.stringify(r.comps));
  console.log(await page.locator('#sizes').innerText());
};
