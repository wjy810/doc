// 在无头 Chromium 中运行示例页面：把 jsDelivr 上的依赖映射到本地 node_modules，
// 收集控制台错误、页面异常与失败请求，并可截图。
// 用法：node run_example.js 页面.html [--out 截图.png] [--wait 毫秒] [--width 800] [--height 500] [--actions 动作.js] [--selector 元素]
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const LOCAL = path.join(__dirname, 'node_modules');
const CDN = /^https:\/\/cdn\.jsdelivr\.net\/npm\/((?:@[^/]+\/)?[^@/]+)@([^/]+)\/(.*)$/;
const TYPES = { '.js': 'application/javascript', '.mjs': 'application/javascript', '.json': 'application/json', '.css': 'text/css', '.woff2': 'font/woff2', '.woff': 'font/woff' };

async function main() {
  const args = process.argv.slice(2);
  const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
  const file = path.resolve(args[0]);
  const out = opt('out');
  const wait = Number(opt('wait', 1500));
  const width = Number(opt('width', 800));
  const height = Number(opt('height', 500));
  const actions = opt('actions');
  const selector = opt('selector');
  const allow = opt('allow') ? new RegExp(opt('allow')) : null; // 预期出现的问题（例如演示加载失败）

  const flags = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'];
  if (args.includes('--webgpu')) flags.push('--enable-unsafe-webgpu', '--enable-features=Vulkan,WebGPUService', '--use-webgpu-adapter=swiftshader');   // 用软件适配器运行 WebGPU
  const browser = await chromium.launch({ args: flags });
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: Number(opt('dpr', 1)) });
  const problems = [];
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') problems.push(`[${m.type()}] ${m.text()}`); });
  page.on('pageerror', e => problems.push('[pageerror] ' + e.message));
  page.on('requestfailed', r => problems.push('[requestfailed] ' + r.url() + ' ' + (r.failure() || {}).errorText));

  await page.route(/^https?:\/\//, async route => {
    const url = route.request().url().split('?')[0];
    if (/^http:\/\/(localhost|127\.0\.0\.1)[:/]/.test(url)) return route.continue();
    const m = url.match(CDN);
    if (!m) { problems.push('[external] ' + url); return route.abort(); }
    const local = path.join(LOCAL, m[1], m[3]);
    if (!fs.existsSync(local)) { problems.push('[missing-local] ' + local); return route.abort(); }
    return route.fulfill({ path: local, contentType: TYPES[path.extname(local)] || 'application/octet-stream', headers: { 'access-control-allow-origin': '*' } });
  });

  await page.goto(/^https?:\/\//.test(args[0]) ? args[0] : 'file://' + file);
  await page.waitForTimeout(wait);
  if (actions) { await require(path.resolve(actions))(page); }
  if (out) await (selector ? page.locator(selector).first().screenshot({ path: out }) : page.screenshot({ path: out }));
  const real = allow ? problems.filter(p => !allow.test(p)) : problems;
  console.log(real.length ? 'PROBLEMS:\n' + real.join('\n') : 'OK' + (problems.length ? ` (${problems.length} expected)` : ''));
  await browser.close();
  process.exit(real.length ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(2); });
