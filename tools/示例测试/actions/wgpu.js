module.exports = async page => {
  await page.waitForFunction(() => window.__wgpu, null, { timeout: 30000 });
  console.log('result:', JSON.stringify(await page.evaluate(() => window.__wgpu)));
  console.log('s2:', await page.textContent('#s2'));
  console.log('s3:', await page.textContent('#s3'));
  console.log('gen first lines:', (await page.textContent('#gen')).split('\n').slice(0, 6).join(' ⏎ '));
};
