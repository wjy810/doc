module.exports = async page => {
  const only = process.env.ONLY;
  await page.evaluate(o => {
    const p = window.__post; p.stop();
    for (const id of ['bloom', 'dof', 'haze', 'grade']) document.getElementById(id).checked = id === o;
    p.arrange(); p.render(1.0);
  }, only);
  await page.waitForTimeout(300);
};
