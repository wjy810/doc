// 11-04：打印状态矩阵的检查结果
module.exports = async page => {
  const r = await page.evaluate(() => window.__cp);
  console.log('cells', r.total, 'failed', r.failed);
  for (const i of r.issues) console.log(`${i.where} [${i.states.join(',')}] ${i.item}: ${i.actual}`);
};
