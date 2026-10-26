// 用法：PROC_MODE=uv 或 knot 时切换坐标或形状后再截图
module.exports = async page => {
  await page.evaluate(mode => {
    const p = window.__proc;
    p.renderer.setAnimationLoop(null);              // 停止动画，截图可以复现
    p.uniforms.uTime.value = 3.0;
    if (mode === 'uv') p.uniforms.uUseUV.value = 1;
    if (mode === 'knot') p.setShape('knot');
    p.render();
  }, process.env.PROC_MODE || '');
  await page.waitForTimeout(300);
};
