module.exports = async page => {
  await page.evaluate(() => window.__sh.freeze(1.2, 0.6));
  const urls = await page.evaluate(() => [...document.querySelectorAll('figure canvas')].map((c, i) => { return c.toDataURL('image/png'); }));
  const fs = require('fs');
  urls.forEach((u, i) => fs.writeFileSync(process.env.OUT_DIR + `/sh-${i}.png`, Buffer.from(u.split(',')[1], 'base64')));
  console.log('saved', urls.length);
};
