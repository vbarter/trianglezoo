/* 角角入位 — 小红书小工具容器适配层（window.xhs.miniTool）
 * 只调用小工具文档列出的接口，全部先做存在性和客户端版本检测；容器不可用时游戏照常运行（进度只保留在本次打开期间）。
 * 对外暴露 window.TZP：init / getItem / setItem / canPost / postImage。
 */
(function () {
  'use strict';
  var cache = {};
  var clientVersion = 0;          // 例如 9462 表示 9.46.2
  var storageOK = false;
  var writeTimer = null, pendingWrite = null;

  function mt() { return window.xhs && window.xhs.miniTool; }
  function has(name) { var m = mt(); return !!m && typeof m[name] === 'function'; }
  function withTimeout(promise, ms) {
    return Promise.race([promise, new Promise(function (_, reject) { setTimeout(function () { reject(new Error('timeout')); }, ms); })]);
  }
  function readBuild(opts) { var env = opts && opts.miniToolEnv; return Number(env && env.buildVersion) || 0; }
  function getClientVersion() {
    var b = readBuild(window.xhs && window.xhs.launchOptions);
    if (b || !has('getLaunchOptions')) return Promise.resolve(Math.floor(b / 1000));
    return withTimeout(Promise.resolve(mt().getLaunchOptions()), 1500)
      .then(function (o) { return Math.floor(readBuild(o) / 1000); }, function () { return 0; });
  }

  /** 顶部宿主按钮可能盖住返回 / 提示按钮：读取按钮位置，把整个游戏区下移让开 */
  function applyWindowInfo() {
    if (!has('getWindowInfo')) { window.TZ_TOP_EXTRA = 0; if (window.TZ_applySafeArea) window.TZ_applySafeArea(); return Promise.resolve(); }
    return withTimeout(Promise.resolve(mt().getWindowInfo()), 1200).then(function (info) {
      var extra = 0, btns = (info && info.menuButtons) || {};
      ['back', 'me', 'share'].forEach(function (k) {
        var r = btns[k];
        if (r && typeof r.bottom === 'number') extra = Math.max(extra, r.bottom + 6);
      });
      if (!extra && info && info.safeArea && typeof info.safeArea.top === 'number') extra = info.safeArea.top;
      window.TZ_TOP_EXTRA = extra;
    }, function () { window.TZ_TOP_EXTRA = 0; }).then(function () {
      if (window.TZ_applySafeArea) window.TZ_applySafeArea();
    });
  }

  function init(key) {
    return getClientVersion().then(function (v) {
      clientVersion = v;
      storageOK = clientVersion >= 9460 && has('setStorage') && has('getStorage');
      var read = !storageOK ? Promise.resolve() :
        withTimeout(Promise.resolve(mt().getStorage({ key: key })), 2000).then(function (r) {
          if (r && typeof r.data === 'string' && r.data) cache[key] = r.data;
        }, function () { /* 没有存档或读取失败：按新玩家处理 */ });
      return Promise.all([read, applyWindowInfo()]);
    }).then(function () {
      if (has('getWindowInfo')) window.addEventListener('resize', function () { applyWindowInfo(); });
    }, function () { /* 平台初始化失败不影响游戏 */ });
  }

  function getItem(key) { return Object.prototype.hasOwnProperty.call(cache, key) ? cache[key] : null; }
  function flush() {
    if (writeTimer) { clearTimeout(writeTimer); writeTimer = null; }
    var job = pendingWrite; pendingWrite = null;
    if (!job || !storageOK) return;
    try { Promise.resolve(mt().setStorage({ key: job.key, data: job.val })).then(null, function () { }); } catch (e) { }
  }
  /** 存档是 JSON 字符串（远小于单个 key 1MB 的上限）；400ms 内的连续写入合并成一次 */
  function setItem(key, val) {
    cache[key] = val;
    if (!storageOK) return;
    pendingWrite = { key: key, val: val };
    if (!writeTimer) writeTimer = setTimeout(flush, 400);
  }

  /** 用户点击触发：把图片写成临时文件，唤起图文笔记发布页。成功只表示发布页已唤起。 */
  function postImage(dataUrl, title, content) {
    if (!has('postNote')) return Promise.resolve(false);
    var file = has('writeTempFile')
      ? Promise.resolve(mt().writeTempFile({ data: dataUrl })).then(function (f) { return (f && f.filePath) || dataUrl; }, function () { return dataUrl; })
      : Promise.resolve(dataUrl);
    return file.then(function (url) {
      return mt().postNote({
        title: String(title || '').slice(0, 20),
        content: String(content || '').slice(0, 1000),
        pageType: 'photo_publish',
        mediaInfo: { image_resources: [{ url: url }] }
      });
    }).then(function () { return true; }, function () { return false; });
  }

  window.TZP = {
    init: init, getItem: getItem, setItem: setItem, flush: flush, postImage: postImage,
    get canPost() { return has('postNote'); },
    get clientVersion() { return clientVersion; },
    get storageOK() { return storageOK; }
  };
  window.addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', function () { if (document.hidden) flush(); });
})();
