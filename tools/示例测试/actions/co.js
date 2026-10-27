// 11-09：打印协作步骤与迁移结果
module.exports = async page => {
  await page.waitForFunction(() => window.__co, null, { timeout: 30000 });
  const r = await page.evaluate(() => window.__co);
  for (const s of r.steps) console.log(`${s.name} | 甲 ${s.a} | 乙 ${s.b} | ${s.same}`);
  console.log('server same', r.serverSame, '| note', r.finalNote, '| n2', r.n2);
  for (const m of r.report) console.log(`${m.doc}: refs ${m.refs} auto ${m.auto} manual ${m.manual.length}`);
};
