import { Feather } from "@expo/vector-icons";
import * as ScreenCapture from "expo-screen-capture";
import * as ScreenOrientation from "expo-screen-orientation";
import React, { useEffect, useRef } from "react";
import { Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import WebView from "react-native-webview";

interface Props {
  uri: string;
  watermarkText: string;
  onClose?: () => void;
}

function buildPlayerHtml(videoUrl: string, watermarkText: string): string {
  // Safely escape values for inline JS string literals
  const safeUrl = videoUrl.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  const safeWm = watermarkText
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
  <link href="https://vjs.zencdn.net/8.6.1/video-js.css" rel="stylesheet"/>
  <script src="https://vjs.zencdn.net/8.6.1/video.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/videojs-contrib-quality-levels@4.0.0/dist/videojs-contrib-quality-levels.min.js"></script>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    html,body{background:#000;width:100%;height:100%;overflow:hidden}
    .video-js{width:100%!important;height:100vh!important}

    /* ── Watermark ───────────────────────────── */
    .vjs-wm{
      position:absolute;
      color:rgba(255,255,255,0.45);
      font-family:-apple-system,BlinkMacSystemFont,sans-serif;
      font-size:13px;font-weight:600;letter-spacing:1px;
      pointer-events:none;z-index:9999;
      text-shadow:0 1px 4px rgba(0,0,0,0.95);
      transition:opacity 0.4s;
      user-select:none;-webkit-user-select:none;
    }

    /* ── Quality button ──────────────────────── */
    .vjs-q-btn{
      cursor:pointer;
      position:absolute;top:12px;right:12px;
      display:none;align-items:center;gap:5px;
      background:rgba(0,0,0,0.55);
      border:1px solid rgba(255,255,255,0.25);
      border-radius:20px;
      padding:5px 12px;
      color:#fff;font-size:12px;font-weight:700;
      font-family:-apple-system,sans-serif;
      z-index:9998;
    }
    .vjs-q-btn svg{width:13px;height:13px;fill:#fff;flex-shrink:0}

    /* ── Quality menu ────────────────────────── */
    .vjs-q-menu{
      position:absolute;bottom:56px;right:0;left:0;
      background:rgba(14,14,32,0.97);
      border-radius:20px 20px 0 0;
      overflow:hidden;z-index:9998;
      display:none;
    }
    .vjs-q-menu.open{display:block}
    .vjs-q-title{
      color:rgba(255,255,255,0.4);
      font-size:11px;font-weight:700;
      text-transform:uppercase;letter-spacing:1.2px;
      padding:14px 18px 8px;
      font-family:-apple-system,sans-serif;
    }
    .vjs-q-item{
      display:flex;align-items:center;justify-content:space-between;
      padding:13px 18px;
      color:rgba(255,255,255,0.8);
      font-size:15px;font-family:-apple-system,sans-serif;
      cursor:pointer;
    }
    .vjs-q-item.active{background:rgba(108,99,255,0.18);color:#fff}
    .vjs-q-check{color:#6c63ff;font-size:14px;font-weight:700}
    .vjs-q-spacer{height:8px}
  </style>
</head>
<body>
<video id="vid"
  class="video-js vjs-default-skin vjs-big-play-centered"
  playsinline controls>
</video>

<script>
(function(){
  var VIDEO_URL = '${safeUrl}';
  var WM_TEXT   = '${safeWm}';

  var WM_POS = [
    {top:'12%',left:'8%'}, {top:'12%',right:'8%'},
    {top:'45%',left:'15%'},{top:'45%',right:'15%'},
    {top:'78%',left:'8%'}, {top:'78%',right:'8%'},
  ];
  var wmIdx = 0;

  // ── Player ──────────────────────────────────────────────────────────────
  var player = videojs('vid', {
    autoplay: true,
    controls: true,
    fill: true,
    html5: { vhs: { overrideNative: true } },
  });

  player.src({
    src: VIDEO_URL,
    type: VIDEO_URL.indexOf('.m3u8') !== -1
      ? 'application/x-mpegURL'
      : 'video/mp4',
  });

  // ── Watermark ────────────────────────────────────────────────────────────
  var wm = document.createElement('div');
  wm.className = 'vjs-wm';
  wm.textContent = WM_TEXT;
  player.el().appendChild(wm);

  function applyWmPos() {
    var p = WM_POS[wmIdx % WM_POS.length];
    wm.style.top    = p.top    || '';
    wm.style.bottom = p.bottom || '';
    wm.style.left   = p.left   || '';
    wm.style.right  = p.right  || '';
  }
  applyWmPos();
  setInterval(function() {
    wm.style.opacity = '0';
    setTimeout(function() { wmIdx++; applyWmPos(); wm.style.opacity = '1'; }, 400);
  }, 7000);

  // ── Quality picker ───────────────────────────────────────────────────────
  var qualityLevels = player.qualityLevels();
  var levels = [];          // collected height values (unique, sorted desc)
  var currentLabel = 'Auto';
  var menuOpen = false;

  // Button
  var qBtn = document.createElement('button');
  qBtn.className = 'vjs-q-btn';
  qBtn.innerHTML =
    '<svg viewBox="0 0 24 24"><path d="M3 5h18v2H3zm0 6h18v2H3zm0 6h18v2H3z"/></svg>' +
    '<span id="q-label">Auto</span>';
  player.el().appendChild(qBtn);

  // Menu
  var qMenu = document.createElement('div');
  qMenu.className = 'vjs-q-menu';
  player.el().appendChild(qMenu);

  function buildMenu() {
    qMenu.innerHTML =
      '<div class="vjs-q-title">Video Quality</div>';

    // Auto
    var autoEl = document.createElement('div');
    autoEl.className = 'vjs-q-item' + (currentLabel === 'Auto' ? ' active' : '');
    autoEl.innerHTML = 'Auto' +
      (currentLabel === 'Auto' ? '<span class="vjs-q-check">✓</span>' : '');
    autoEl.onclick = function() {
      for (var i = 0; i < qualityLevels.length; i++) qualityLevels[i].enabled = true;
      currentLabel = 'Auto';
      document.getElementById('q-label').textContent = 'Auto';
      closeMenu(); buildMenu();
    };
    qMenu.appendChild(autoEl);

    // Resolution options high → low
    for (var i = levels.length - 1; i >= 0; i--) {
      (function(h) {
        var label = h + 'p';
        var el = document.createElement('div');
        el.className = 'vjs-q-item' + (currentLabel === label ? ' active' : '');
        el.innerHTML = label +
          (currentLabel === label ? '<span class="vjs-q-check">✓</span>' : '');
        el.onclick = function() {
          for (var j = 0; j < qualityLevels.length; j++) {
            qualityLevels[j].enabled = (qualityLevels[j].height === h);
          }
          currentLabel = label;
          document.getElementById('q-label').textContent = label;
          closeMenu(); buildMenu();
        };
        qMenu.appendChild(el);
      })(levels[i]);
    }
    qMenu.appendChild(Object.assign(document.createElement('div'), {className:'vjs-q-spacer'}));
  }

  function closeMenu()  { menuOpen = false; qMenu.classList.remove('open'); }
  function toggleMenu(e){ e.stopPropagation(); menuOpen = !menuOpen; qMenu.classList.toggle('open', menuOpen); }

  qBtn.addEventListener('click', toggleMenu);
  document.addEventListener('click', function() { if (menuOpen) closeMenu(); });

  // Collect quality levels as VHS parses the manifest
  qualityLevels.on('addqualitylevel', function(e) {
    var h = e.qualityLevel && e.qualityLevel.height;
    if (h && levels.indexOf(h) === -1) {
      levels.push(h);
      levels.sort(function(a, b) { return a - b; });
      if (levels.length >= 1) { qBtn.style.display = 'flex'; buildMenu(); }
    }
  });
})();
</script>
</body>
</html>`;
}

export function SecuredVideoPlayer({ uri, watermarkText, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const webViewRef = useRef<WebView>(null);

  // ── Screen capture prevention ─────────────────────────────────────────────
  useEffect(() => {
    if (Platform.OS === "web") return;
    ScreenCapture.preventScreenCaptureAsync().catch(() => {});
    return () => {
      ScreenCapture.allowScreenCaptureAsync().catch(() => {});
    };
  }, []);

  // ── Reset orientation on unmount ──────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (Platform.OS !== "web") {
        ScreenOrientation.lockAsync(
          ScreenOrientation.OrientationLock.PORTRAIT_UP
        ).catch(() => {});
      }
    };
  }, []);

  const html = buildPlayerHtml(uri, watermarkText);

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <WebView
        ref={webViewRef}
        source={{ html, baseUrl: "https://localhost" }}
        style={styles.webview}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        allowsFullscreenVideo
        javaScriptEnabled
        domStorageEnabled
        originWhitelist={["*"]}
        onShouldStartLoadWithRequest={() => true}
      />

      {/* Back button — React Native overlay so it's always reachable */}
      {onClose && (
        <TouchableOpacity
          style={[styles.backBtn, { top: insets.top + 8 }]}
          onPress={onClose}
        >
          <Feather name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  webview: {
    flex: 1,
    backgroundColor: "#000",
  },
  backBtn: {
    position: "absolute",
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
});
