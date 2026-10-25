// 用 Playwright 自动检查资源列表页（01-12-resource-list.html）的关键行为。
// 运行方法：先安装 Node.js，然后在本目录执行
//   npm install playwright && npx playwright install chromium
//   node 01-10-checks.js
// 每一项检查对应一个容易在修改中被破坏的行为；全部通过时退出码为 0。
const { chromium } = require('playwright');
const path = require('path');
const { pathToFileURL } = require('url');

const PAGE = pathToFileURL(path.join(__dirname, '01-12-resource-list.html')).href;
const results = [];
async function check(name, fn) {
  try {
    await fn();
    results.push(['通过', name]);
  } catch (e) {
    results.push(['失败', `${name}：${e.message}`]);
  }
}
function expect(condition, message) {
  if (!condition) throw new Error(message);
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1000, height: 700 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));

  await page.goto(PAGE);
  await page.waitForSelector('.card');

  await check('长标题不会撑破卡片', async () => {
    // 比较文字与卡片的边界：只看文字元素自身是否溢出不够，它可能被撑宽后再被卡片裁掉
    const bad = await page.$$eval('.card', cards => cards.filter(card => {
      const box = card.getBoundingClientRect();
      return [...card.querySelectorAll('.title, .meta')].some(el => el.getBoundingClientRect().right > box.right + 1);
    }).length);
    expect(bad === 0, `${bad} 张卡片的文字超出边界`);
  });

  await check('没有结果时显示空状态和清除按钮', async () => {
    await page.fill('#q', '薪资谈判');
    await page.waitForSelector('.empty');
    expect((await page.textContent('#status')).includes('0'), '状态文字没有显示 0 项');
    await page.click('.empty button');
    await page.waitForSelector('.card');
  });

  await check('筛选条件写进地址，刷新后恢复', async () => {
    await page.selectOption('#cat', '文章');
    await page.waitForFunction(() => location.search.includes('cat='));
    await page.reload();
    await page.waitForSelector('.card');
    expect(await page.inputValue('#cat') === '文章', '刷新后分类没有恢复');
  });

  await check('快速连续切换时只显示最后一次的结果', async () => {
    for (const c of ['清单', '模型', '文章']) await page.selectOption('#cat', c);
    await page.waitForTimeout(1200);
    const types = await page.$$eval('.card .meta', els => [...new Set(els.map(e => e.textContent.split(' ')[0]))]);
    expect(types.length === 1 && types[0] === '文章', `显示的分类是 ${types.join('、')}`);
  });

  await check('只用键盘可以打开详情', async () => {
    await page.focus('#reset');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    expect(await page.isVisible('#detail'), '按回车后没有显示详情');
  });

  await check('320 像素宽时没有横向滚动条', async () => {
    await page.setViewportSize({ width: 320, height: 640 });
    const scroll = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scroll <= 320, `页面宽度 ${scroll} 像素`);
  });

  await check('加载失败时保留条件并提供重试', async () => {
    await page.goto(PAGE + '?fail=1&cat=%E6%96%87%E7%AB%A0');
    await page.waitForSelector('.error button');
    expect(await page.inputValue('#cat') === '文章', '失败后筛选条件丢失');
  });

  await check('页面没有脚本错误', async () => {
    expect(errors.length === 0, errors.join('；'));
  });

  await browser.close();
  for (const [state, text] of results) console.log(`${state}  ${text}`);
  process.exit(results.some(([state]) => state === '失败') ? 1 : 0);
})();
