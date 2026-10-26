module.exports = async page => {
  const before = await page.evaluate(() => window.__pat.truchet());
  const after = await page.evaluate(() => window.__pat.flip(4, 6));
  console.log('truchet before:', JSON.stringify(before), 'after flipping one tile:', JSON.stringify(after));
  await page.evaluate(() => window.__pat.flip(4, 6));   // 翻回去，截图保持原样
  console.log('ls:', await page.textContent('#lsInfo'));
};
