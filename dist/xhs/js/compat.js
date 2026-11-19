/* 角角入位 — 容器兼容层：Flex gap / aspect-ratio 行为检测 + 安全区测量。
 * 在 body 存在后、游戏脚本之前执行（index.html 里放在 body 末尾的第一个脚本）。
 */
(function () {
  'use strict';
  var root = document.documentElement;

  // Chrome 61 不支持 Flexbox gap：实际测量一次布局，不支持时启用 margin 回退样式
  function supportsFlexGap() {
    var flex = document.createElement('div');
    flex.style.position = 'absolute';
    flex.style.visibility = 'hidden';
    flex.style.display = 'flex';
    flex.style.flexDirection = 'column';
    flex.style.rowGap = '1px';
    flex.appendChild(document.createElement('div'));
    flex.appendChild(document.createElement('div'));
    document.body.appendChild(flex);
    var supported = flex.scrollHeight === 1;
    flex.parentNode.removeChild(flex);
    return supported;
  }
  var forced = /[?&]nogap\b/.test(location.search);
  root.classList.add(!forced && supportsFlexGap() ? 'supports-flex-gap' : 'no-flex-gap');
  // aspect-ratio（Chrome 88+）不可用时，由游戏脚本按宽度写入高度
  window.TZ_NO_AR = forced || !(window.CSS && CSS.supports && CSS.supports('aspect-ratio', '1 / 1'));
  if (window.TZ_NO_AR) root.classList.add('no-ar');

  // 安全区：模拟器注入 --safe-area-inset-*，真机用 env()；统一量成像素写入 --sat / --sab，样式里不直接依赖 env()
  function measure(side) {
    var probe = document.createElement('div');
    probe.style.cssText = 'position:absolute;visibility:hidden;left:0;top:0;width:0;height:0;' +
      'padding-top:var(--safe-area-inset-' + side + ', env(safe-area-inset-' + side + ', 0px));';
    document.body.appendChild(probe);
    var v = parseFloat(window.getComputedStyle(probe).paddingTop) || 0;
    probe.parentNode.removeChild(probe);
    return v;
  }
  function applySafeArea() {
    var top = measure('top'), bottom = measure('bottom');
    var extra = window.TZ_TOP_EXTRA || 0;       // 宿主按钮占用的高度，由 platform.js 写入
    root.style.setProperty('--sat', Math.max(top, extra) + 'px');
    root.style.setProperty('--sab', bottom + 'px');
  }
  window.TZ_applySafeArea = applySafeArea;
  applySafeArea();
  window.addEventListener('resize', applySafeArea);
})();
