module.exports = async page => {
  await page.click('#samples');
  await page.waitForFunction(() => /已检查/.test(document.getElementById('status').textContent), null, { timeout: 60000 });
  console.log('status:', await page.textContent('#status'));
  const r = await page.evaluate(() => window.__assets.report.map(f => `${f.file}: ${f.result} | ${f.issues.map(i => i.level + ':' + i.text).join(' / ')}`));
  console.log(r.join('\n'));
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#export')]);
  const p = await dl.path(); const json = JSON.parse(require('fs').readFileSync(p, 'utf8'));
  console.log('report tool:', JSON.stringify(json.tool), 'files:', json.files.length, 'hash0:', json.files[0].sha256.slice(0, 12));
};
