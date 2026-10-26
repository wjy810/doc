module.exports = async page => {
  const t0 = Date.now();
  page.on('pageerror', e => console.log(`pageerror at +${Date.now() - t0}ms:`, e.message));
  page.on('console', m => { if (m.type() !== 'log') console.log(`console ${m.type()} at +${Date.now() - t0}ms:`, m.text().slice(0, 100)); });
  await page.waitForFunction(() => window.__wgpu, null, { timeout: 30000 });
  console.log('ready at', Date.now() - t0);
  await page.waitForTimeout(4000);
  console.log('waited 4s');
};
