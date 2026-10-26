// 方案 A：先点“我的”（走错），回到“工具”找到；方案 B：直接找到
module.exports = async page => {
  const a = page.locator('#treeA'), b = page.locator('#treeB');
  const click = async (root, name) => { await root.getByRole('button', { name, exact: true }).first().click(); await page.waitForTimeout(250); };
  await click(a, '我的'); await click(a, '账号设置'); await click(a, '我的');
  await click(a, '工具'); await click(a, '文件管理'); await click(a, '我的文档');
  await a.locator('li.leaf', { hasText: '重命名' }).getByRole('button', { name: '选这里' }).click();
  await click(b, '简历'); await click(b, '我的简历');
  await b.locator('li.leaf', { hasText: '重命名' }).getByRole('button', { name: '选这里' }).click();
  await page.waitForTimeout(200);
  console.log('A:', await page.textContent('#resA'));
  console.log('B:', await page.textContent('#resB'));
};
