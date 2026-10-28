// 12-06：四人协作的一段过程：软锁、版本冲突与合并、权限、召集、跟随、恢复、决策
module.exports = async page => {
  const r = await page.evaluate(() => {
    const g = window.__tg;
    g.startEdit('甲', 'n3');
    g.startEdit('丁', 'n3');
    g.save('甲', 'n3', '先学 D3：更灵活，适合做作品集');
    g.save('丁', 'n3', '先学 ECharts：上手快');
    g.startEdit('丁', 'n3'); g.save('丁', 'n3', '先用 ECharts 上手，再学 D3 做作品集');
    g.attempt('乙', '评论', () => g.comment('乙', 'n3', 'ECharts 的文档有中文，适合第一个月'), '在 n3 下评论');
    g.attempt('乙', '编辑', () => {}, '修改 n2');
    g.attempt('丙', '评论', () => {}, '在 n1 下评论');
    g.attempt('乙', '删除', () => {}, '删除 n6');
    g.attempt('甲', '导出', () => '完成：导出为 PDF', '导出白板');
    g.attempt('丁', '编辑', () => { g.startEdit('丁', 'n2'); g.save('丁', 'n2', '每周投入：12 小时'); return '完成'; }, '修改 n2');
    g.restore('甲', 'n2', 1);
    g.setPing('甲', 505, 92);
    g.follow('丙', '甲');
    g.startEdit('丁', 'n5');
    g.decide('甲', { title: '先学哪个图表库', options: ['先学 D3', '先学 ECharts', '两个同时学'], discussion: 'n3 三个版本（甲、丁各一版，合并为第 3 版）；乙评论 1 条', choice: '先用 ECharts 上手，再学 D3 做作品集', why: '第一个月要尽快做出能用的图表；作品集需要 D3 的灵活性', links: 'n3（第 3 版）、n4、n5', review: '第一个月结束时，看是否已完成三个图表' });
    return { notes: g.notes.map(n => [n.id, n.version, n.text, Object.keys(n.editors).join('')]), ptests: g.ptests, conf: g.confRows, hist: g.history.length, sim: g.simRows.map(x => [x[0], x[1].toFixed(2)]), view: [g.users.丙.view, g.users.甲.view] };
  });
  console.log(JSON.stringify(r, null, 1));
};
