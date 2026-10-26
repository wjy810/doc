module.exports = async page => {
  await page.waitForFunction(() => window.__wgpu, null, { timeout: 30000 });
  console.log(JSON.stringify(await page.evaluate(() => window.__wgpu)), await page.textContent('#s3'));
  console.log((await page.textContent('#gen')).split('\n').slice(0, 12).join('\n'));
};
