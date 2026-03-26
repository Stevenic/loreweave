/**
 * Web UI templates for Pixel Explorer.
 *
 * Single-page app with sidebar navigation, served as inline strings.
 * The browser-side JS includes a lightweight pixel renderer that draws
 * sprites and tilesets directly to <canvas> from the JSON data.
 */

export function getPageHtml(): string {
	return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Pixel Explorer</title>
<link rel="stylesheet" href="/style.css">
</head>
<body>
<nav id="sidebar">
	<div class="logo">Pixel<span>Explorer</span></div>
	<a href="#gallery" class="nav-link active" data-view="gallery">Gallery</a>
	<a href="#palettes" class="nav-link" data-view="palettes">Palettes</a>
	<a href="#validate" class="nav-link" data-view="validate">Validate</a>
	<div class="nav-spacer"></div>
	<div class="nav-status" id="ws-status">disconnected</div>
</nav>
<main id="main">
	<section id="view-gallery" class="view active"></section>
	<section id="view-palettes" class="view"></section>
	<section id="view-validate" class="view"></section>
	<section id="view-asset" class="view"></section>
</main>
<script src="/app.js"></script>
</body>
</html>`;
}

export function getStyleCss(): string {
	return `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
	--bg:#0d1117;--bg2:#161b22;--bg3:#21262d;--border:#30363d;
	--text:#e6edf3;--text2:#8b949e;--accent:#58a6ff;--accent2:#3fb950;
	--red:#f85149;--orange:#d29922;--cyan:#39d2c0;--magenta:#bc8cff;
	--sidebar-w:200px;
}
html,body{height:100%;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;background:var(--bg);color:var(--text);font-size:14px;line-height:1.5}
body{display:flex}

/* Sidebar */
#sidebar{width:var(--sidebar-w);min-height:100vh;background:var(--bg2);border-right:1px solid var(--border);display:flex;flex-direction:column;padding:16px 0;position:fixed;top:0;left:0;bottom:0;z-index:10}
.logo{padding:0 16px 24px;font-size:18px;font-weight:700;color:var(--accent)}
.logo span{color:var(--text)}
.nav-link{display:block;padding:8px 16px;color:var(--text2);text-decoration:none;font-size:14px;border-left:3px solid transparent;transition:all .15s}
.nav-link:hover{color:var(--text);background:var(--bg3)}
.nav-link.active{color:var(--accent);border-left-color:var(--accent);background:var(--bg3)}
.nav-spacer{flex:1}
.nav-status{padding:8px 16px;font-size:11px;color:var(--text2);display:flex;align-items:center;gap:6px}
.nav-status .dot{width:8px;height:8px;border-radius:50%;background:var(--red)}
.nav-status.connected .dot{background:var(--accent2)}

/* Main */
#main{margin-left:var(--sidebar-w);flex:1;padding:24px;min-height:100vh;width:calc(100% - var(--sidebar-w));overflow-y:auto}
.view{display:none}
.view.active{display:block}

/* View header */
.view-header{display:flex;align-items:center;gap:12px;margin-bottom:20px}
.view-header h1{font-size:22px;font-weight:600}
.view-header .count{background:var(--bg3);border:1px solid var(--border);border-radius:12px;padding:2px 10px;font-size:12px;color:var(--text2)}

/* Filter bar */
.filter-bar{display:flex;gap:6px;margin-bottom:16px;flex-wrap:wrap}
.filter-btn{background:var(--bg3);border:1px solid var(--border);border-radius:6px;padding:4px 12px;color:var(--text2);cursor:pointer;font-size:13px;transition:all .15s}
.filter-btn:hover{border-color:var(--accent);color:var(--text)}
.filter-btn.active{background:var(--accent);color:#fff;border-color:var(--accent)}

/* Asset grid */
.asset-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px}
.asset-card{background:var(--bg2);border:1px solid var(--border);border-radius:8px;overflow:hidden;cursor:pointer;transition:border-color .15s,transform .1s}
.asset-card:hover{border-color:var(--accent);transform:translateY(-2px)}
.card-preview{width:100%;aspect-ratio:1;background:var(--bg);display:flex;align-items:center;justify-content:center;overflow:hidden}
.card-preview canvas{image-rendering:pixelated;max-width:100%;max-height:100%}
.card-info{padding:10px 12px;border-top:1px solid var(--border)}
.card-name{font-size:13px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.card-meta{display:flex;align-items:center;gap:8px;margin-top:4px}
.card-desc{font-size:11px;color:var(--text2);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

/* Create asset button */
.create-btn{background:var(--bg2);border:2px dashed var(--border);border-radius:8px;cursor:pointer;transition:border-color .15s;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:200px;gap:8px;color:var(--text2)}
.create-btn:hover{border-color:var(--accent);color:var(--accent)}
.create-btn .plus{font-size:32px;font-weight:300}
.create-btn .label{font-size:13px}

/* Badges */
.badge{font-size:11px;padding:1px 6px;border-radius:10px;font-weight:500}
.badge-sprite{background:#1a3a4a;color:var(--cyan)}
.badge-tileset{background:#2a1a3a;color:var(--magenta)}
.badge-tilemap{background:#1a2a3a;color:var(--accent)}
.badge-scene{background:#2a2a1a;color:var(--orange)}
.badge-palette{background:#1a2a1a;color:var(--accent2)}
.badge-emitter{background:#2a1a1a;color:var(--red)}
.dims{font-size:11px;color:var(--text2)}
.view-count{font-size:11px;color:var(--text2)}
.ref-count{font-size:11px;color:var(--cyan)}

/* Asset detail view */
.detail-back{background:none;border:none;color:var(--accent);cursor:pointer;font-size:14px;padding:4px 0;margin-bottom:12px;display:inline-flex;align-items:center;gap:4px}
.detail-back:hover{text-decoration:underline}
.asset-detail-layout{display:grid;grid-template-columns:1fr 340px;gap:24px}
@media(max-width:1000px){.asset-detail-layout{grid-template-columns:1fr}}
.detail-preview{background:var(--bg2);border:1px solid var(--border);border-radius:8px;display:flex;align-items:center;justify-content:center;padding:24px;min-height:240px}
.detail-preview canvas{image-rendering:pixelated;max-width:100%;max-height:360px}
.detail-info{background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:16px}
.detail-info h3{margin-bottom:12px;font-size:15px}
.detail-props{display:grid;grid-template-columns:auto 1fr;gap:4px 12px;font-size:13px}
.detail-props dt{color:var(--text2)}
.detail-props dd{color:var(--text)}

/* View tabs */
.view-tabs{display:flex;gap:4px;margin-bottom:16px;flex-wrap:wrap}
.view-tab{background:var(--bg3);border:1px solid var(--border);border-radius:6px;padding:6px 14px;color:var(--text2);cursor:pointer;font-size:13px;transition:all .15s}
.view-tab:hover{border-color:var(--accent);color:var(--text)}
.view-tab.active{background:var(--accent);color:#fff;border-color:var(--accent)}
.view-tab-add{border-style:dashed;display:inline-flex;align-items:center;gap:4px}

/* References section */
.ref-list{display:flex;flex-direction:column;gap:6px;margin-top:8px}
.ref-item{display:flex;align-items:center;gap:8px;padding:6px 10px;background:var(--bg3);border:1px solid var(--border);border-radius:6px;font-size:13px}
.ref-role{font-size:10px;padding:1px 6px;border-radius:8px;background:var(--bg);color:var(--cyan);text-transform:uppercase}
.ref-name{color:var(--accent);cursor:pointer}
.ref-name:hover{text-decoration:underline}
.ref-desc{color:var(--text2);font-size:12px;margin-left:auto}

/* JSON view */
.detail-json{margin-top:20px}
.detail-json pre{background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:16px;font-family:'Cascadia Code','Fira Code',monospace;font-size:12px;line-height:1.5;overflow:auto;max-height:400px;white-space:pre-wrap;word-break:break-all;color:var(--text2)}

/* Palette swatches */
.palette-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px}
.palette-card{background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:16px}
.palette-card h3{font-size:15px;margin-bottom:2px}
.pal-count{font-size:12px;color:var(--text2);margin-bottom:12px}
.swatch-grid{display:flex;flex-wrap:wrap;gap:4px}
.swatch{width:28px;height:28px;border-radius:4px;border:1px solid var(--border);position:relative;cursor:default}
.swatch[data-tip]:hover::after{content:attr(data-tip);position:absolute;bottom:calc(100% + 4px);left:50%;transform:translateX(-50%);background:var(--bg3);border:1px solid var(--border);border-radius:4px;padding:2px 8px;font-size:10px;white-space:nowrap;z-index:5;color:var(--text);pointer-events:none}
.swatch.transparent{background:repeating-conic-gradient(#555 0% 25%,#333 0% 50%) 0 0 / 10px 10px}
.ramp-section{margin-top:12px}
.ramp-section h4{font-size:12px;color:var(--text2);margin-bottom:6px}
.ramp-row{display:flex;gap:2px;margin-bottom:4px;align-items:center}
.ramp-label{font-size:11px;color:var(--text2);width:60px;flex-shrink:0}
.ramp-swatch{width:24px;height:24px;border-radius:3px;border:1px solid var(--border)}

/* Validation */
.val-summary{display:flex;gap:16px;margin-bottom:20px}
.val-stat{background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:12px 20px;text-align:center;min-width:100px}
.val-stat .num{font-size:28px;font-weight:700}
.val-stat .label{font-size:11px;color:var(--text2);margin-top:2px}
.val-stat.pass .num{color:var(--accent2)}
.val-stat.fail .num{color:var(--red)}
.val-stat.warn .num{color:var(--orange)}
.val-list{display:flex;flex-direction:column;gap:8px}
.val-item{background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:12px 16px}
.val-item-header{display:flex;align-items:center;gap:8px}
.val-item-header.clickable{cursor:pointer}
.val-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
.val-dot.pass{background:var(--accent2)}
.val-dot.fail{background:var(--red)}
.val-dot.warn{background:var(--orange)}
.val-path{font-size:13px;font-family:monospace}
.val-type{font-size:11px;color:var(--text2);margin-left:auto}
.val-details{margin-top:8px;padding-top:8px;border-top:1px solid var(--border);font-size:12px;display:none}
.val-item.expanded .val-details{display:block}
.val-error{color:var(--red);padding:2px 0}
.val-warning{color:var(--orange);padding:2px 0}

/* Generate (inline in asset detail) */
.gen-form{max-width:600px;margin-top:16px}
.gen-form label{display:block;font-size:13px;font-weight:600;margin-bottom:4px;margin-top:16px}
.gen-form label:first-child{margin-top:0}
.gen-form textarea{width:100%;min-height:80px;background:var(--bg3);border:1px solid var(--border);border-radius:6px;padding:10px;color:var(--text);font-size:14px;resize:vertical;font-family:inherit}
.gen-form textarea:focus{outline:none;border-color:var(--accent)}
.gen-form select{background:var(--bg3);border:1px solid var(--border);border-radius:6px;padding:8px 12px;color:var(--text);font-size:14px;width:100%}
.gen-form input[type="text"]{background:var(--bg3);border:1px solid var(--border);border-radius:6px;padding:8px 12px;color:var(--text);font-size:14px;width:100%}
.gen-form input:focus{outline:none;border-color:var(--accent)}
.gen-btn{margin-top:20px;background:#238636;border:1px solid #2ea043;border-radius:6px;padding:10px 24px;font-size:14px;font-weight:600;color:#fff;cursor:pointer;transition:opacity .15s}
.gen-btn:hover{opacity:.85}
.gen-btn:disabled{opacity:.5;cursor:not-allowed}
.gen-output{margin-top:16px;background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:16px;font-size:13px;white-space:pre-wrap;font-family:monospace;max-height:300px;overflow:auto;display:none}
.gen-output.visible{display:block}
.gen-sizing-hint{font-size:12px;color:var(--cyan);margin-top:6px;min-height:18px;font-family:monospace}

/* Create Asset Modal */
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:100;display:flex;align-items:center;justify-content:center}
.modal{background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:24px;width:440px;max-width:90vw}
.modal h2{font-size:18px;margin-bottom:16px}
.modal label{display:block;font-size:13px;font-weight:600;margin-bottom:4px;margin-top:14px}
.modal label:first-of-type{margin-top:0}
.modal input,.modal select,.modal textarea{background:var(--bg3);border:1px solid var(--border);border-radius:6px;padding:8px 12px;color:var(--text);font-size:14px;width:100%;font-family:inherit}
.modal textarea{min-height:60px;resize:vertical}
.modal input:focus,.modal select:focus,.modal textarea:focus{outline:none;border-color:var(--accent)}
.modal-actions{display:flex;gap:8px;margin-top:20px;justify-content:flex-end}
.modal-actions button{border-radius:6px;padding:8px 20px;font-size:14px;font-weight:600;cursor:pointer;transition:opacity .15s}
.btn-cancel{background:var(--bg3);border:1px solid var(--border);color:var(--text)}
.btn-create{background:#238636;border:1px solid #2ea043;color:#fff}
.btn-cancel:hover,.btn-create:hover{opacity:.85}
.modal-error{color:var(--red);font-size:13px;margin-top:8px}

/* Animation controls */
.anim-controls{display:flex;align-items:center;gap:10px;margin-top:12px;padding:8px 12px;background:var(--bg3);border:1px solid var(--border);border-radius:6px;flex-wrap:wrap}
.anim-btn{background:var(--bg2);border:1px solid var(--border);border-radius:4px;padding:4px 12px;color:var(--text);cursor:pointer;font-size:13px;transition:all .15s;display:inline-flex;align-items:center;gap:4px}
.anim-btn:hover{border-color:var(--accent);color:var(--accent)}
.anim-btn.active{background:var(--accent);color:#fff;border-color:var(--accent)}
.anim-btn .icon{font-size:16px}
.anim-select{background:var(--bg2);border:1px solid var(--border);border-radius:4px;padding:4px 8px;color:var(--text);font-size:13px}
.anim-time{font-size:12px;color:var(--text2);font-family:monospace;min-width:80px}
.anim-progress{flex:1;min-width:120px;height:4px;background:var(--bg);border-radius:2px;cursor:pointer;position:relative}
.anim-progress-fill{height:100%;background:var(--accent);border-radius:2px;pointer-events:none;transition:none}

/* Tags */
.tag-list{display:flex;flex-wrap:wrap;gap:4px;margin-top:4px}
.tag{font-size:10px;padding:1px 8px;border-radius:8px;background:var(--bg3);border:1px solid var(--border);color:var(--text2)}

/* Spinner */
.spinner{display:inline-block;width:16px;height:16px;border:2px solid var(--border);border-top-color:var(--accent);border-radius:50%;animation:spin .6s linear infinite;vertical-align:middle}
@keyframes spin{to{transform:rotate(360deg)}}
.loading{text-align:center;padding:40px;color:var(--text2)}

/* Generation overlay on gallery cards */
.card-generating{position:relative;pointer-events:none;opacity:.7}
.card-generating::after{content:'';position:absolute;inset:0;background:rgba(13,17,23,.6);display:flex;align-items:center;justify-content:center;border-radius:8px}
.card-gen-spinner{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);z-index:2;display:flex;flex-direction:column;align-items:center;gap:6px;pointer-events:none}
.card-gen-spinner .spinner{width:24px;height:24px;border-width:3px}
.card-gen-spinner .gen-label{font-size:11px;color:var(--cyan);white-space:nowrap}

/* Custom Colors Editor */
.custom-colors{margin-top:16px}
.custom-colors h3{font-size:15px;margin-bottom:8px}
.cc-grid{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px}
.cc-entry{display:flex;align-items:center;gap:4px;background:var(--bg3);border:1px solid var(--border);border-radius:6px;padding:4px 8px}
.cc-key{font-family:monospace;font-size:14px;font-weight:600;color:var(--cyan);width:16px;text-align:center}
.cc-swatch{width:20px;height:20px;border-radius:3px;border:1px solid var(--border);cursor:pointer}
.cc-color-input{width:0;height:0;padding:0;border:0;position:absolute;visibility:hidden}
.cc-remove{background:none;border:none;color:var(--text2);cursor:pointer;font-size:12px;padding:0 2px;line-height:1}
.cc-remove:hover{color:var(--red)}
.cc-add-btn{background:var(--bg3);border:1px dashed var(--border);border-radius:6px;padding:4px 12px;color:var(--text2);cursor:pointer;font-size:12px;transition:all .15s}
.cc-add-btn:hover{border-color:var(--accent);color:var(--accent)}
.cc-hint{font-size:11px;color:var(--text2);margin-top:4px}

/* Section divider */
.section-divider{margin:32px 0 16px;padding-bottom:8px;border-bottom:1px solid var(--border);font-size:14px;color:var(--text2);font-weight:600}

/* Danger button */
.btn-danger{background:var(--bg3);border:1px solid var(--border);border-radius:6px;padding:6px 14px;color:var(--red);cursor:pointer;font-size:13px;transition:all .15s}
.btn-danger:hover{background:var(--red);color:#fff;border-color:var(--red)}
.btn-icon{background:none;border:none;color:var(--text2);cursor:pointer;font-size:14px;padding:2px 6px;border-radius:4px;transition:all .15s;line-height:1}
.btn-icon:hover{color:var(--text);background:var(--bg3)}
.btn-icon.danger:hover{color:var(--red);background:rgba(248,81,73,.1)}
.btn-icon.edit:hover{color:var(--accent);background:rgba(88,166,255,.1)}

/* Inline actions bar */
.detail-actions{display:flex;gap:8px;margin-left:auto}
.view-tab-group{display:flex;align-items:center;gap:2px}
.view-tab-group .view-tab{border-radius:6px 0 0 6px}
.view-tab-group .btn-icon{border-radius:0 6px 6px 0;border:1px solid var(--border);background:var(--bg3);padding:6px 6px}

/* Confirm dialog */
.confirm-overlay{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:100;display:flex;align-items:center;justify-content:center}
.confirm-dialog{background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:24px;width:400px;max-width:90vw}
.confirm-dialog h2{font-size:18px;margin-bottom:12px}
.confirm-dialog p{color:var(--text2);font-size:14px;margin-bottom:20px;line-height:1.6}
.confirm-dialog .actions{display:flex;gap:8px;justify-content:flex-end}
.confirm-dialog .actions button{border-radius:6px;padding:8px 20px;font-size:14px;font-weight:600;cursor:pointer}
.confirm-dialog .btn-confirm-danger{background:var(--red);border:1px solid var(--red);color:#fff}
.confirm-dialog .btn-confirm-danger:hover{opacity:.85}
`;
}

export function getAppJs(): string {
	return `'use strict';

// ── State ──
let allManagedAssets = [];
let allUnmanagedAssets = {};
let currentFilter = 'all';
let cachedAssetData = {};
let paletteEntriesCache = {};
let cachedPaletteList = [];
let generatingFolders = new Set();

// ── IndexedDB Preferences ──

const PREFS_DB = 'PixelExplorerPrefs';
const PREFS_STORE = 'prefs';
const PREFS_KEY = 'generate';

function openPrefsDb() {
	return new Promise((resolve, reject) => {
		const req = indexedDB.open(PREFS_DB, 1);
		req.onupgradeneeded = () => { req.result.createObjectStore(PREFS_STORE); };
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error);
	});
}

async function loadPrefs() {
	try {
		const db = await openPrefsDb();
		return new Promise((resolve) => {
			const tx = db.transaction(PREFS_STORE, 'readonly');
			const req = tx.objectStore(PREFS_STORE).get(PREFS_KEY);
			req.onsuccess = () => resolve(req.result || {});
			req.onerror = () => resolve({});
		});
	} catch { return {}; }
}

async function savePrefs(prefs) {
	try {
		const db = await openPrefsDb();
		const tx = db.transaction(PREFS_STORE, 'readwrite');
		tx.objectStore(PREFS_STORE).put(prefs, PREFS_KEY);
	} catch { /* ignore */ }
}

// ── Animation State ──
let animPlaying = false;
let animLoop = true;
let animClipName = null;
let animStartTime = 0;
let animRafId = null;
let animAssetData = null;
let animMaxSize = 320;

// ── Palette Preloader ──

async function preloadPalettes() {
	try {
		const data = await api('/api/palettes');
		const pals = data.palettes || [];
		cachedPaletteList = pals;
		for (const p of pals) {
			try {
				const asset = await api('/api/asset/file?path=' + encodeURIComponent(p.path));
				if (asset.data && asset.data.entries) {
					paletteEntriesCache[asset.data.name || p.name] = asset.data.entries;
				}
			} catch { /* skip */ }
		}
	} catch { /* skip */ }
}

// ── Router ──

function navigate(view) {
	document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
	document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
	const link = document.querySelector('[data-view="' + view + '"]');
	if (link) link.classList.add('active');
	const el = document.getElementById('view-' + view);
	if (el) el.classList.add('active');
}

function onHashChange() {
	const hash = location.hash.slice(1) || 'gallery';
	if (hash.startsWith('asset/')) {
		navigate('asset');
		stopAnimation();
		loadAssetDetail(decodeURIComponent(hash.slice(6)));
	} else {
		stopAnimation();
		navigate(hash);
		if (hash === 'gallery') loadGallery();
		else if (hash === 'validate') loadValidation();
		else if (hash === 'palettes') loadPalettes();
	}
}

window.addEventListener('hashchange', onHashChange);

// ── API helper ──

async function api(path, opts) {
	const res = await fetch(path, opts);
	return res.json();
}

// ── Gallery ──

async function loadGallery() {
	const el = document.getElementById('view-gallery');
	el.innerHTML = '<div class="loading"><div class="spinner"></div> Loading assets...</div>';
	try {
		const data = await api('/api/assets');
		allManagedAssets = data.managed || [];
		allUnmanagedAssets = data.unmanaged || {};
		if (data.generating) {
			generatingFolders = new Set(data.generating);
		}
		renderGallery();
	} catch {
		el.innerHTML = '<div class="loading">Failed to load assets.</div>';
	}
}

function renderGallery() {
	const el = document.getElementById('view-gallery');

	// Collect type counts for managed assets
	const typeCounts = {};
	for (const a of allManagedAssets) {
		const t = a.meta.type;
		typeCounts[t] = (typeCounts[t] || 0) + 1;
	}
	const types = Object.keys(typeCounts).sort();

	// Filter
	let filtered = allManagedAssets;
	if (currentFilter !== 'all') {
		filtered = allManagedAssets.filter(a => a.meta.type === currentFilter);
	}

	let html = '<div class="view-header"><h1>Assets</h1><span class="count">'
		+ allManagedAssets.length + ' assets</span></div>';

	// Filter tabs
	html += '<div class="filter-bar">';
	html += filterBtn('all', 'All');
	for (const t of types) html += filterBtn(t, t + ' (' + typeCounts[t] + ')');
	html += '</div>';

	// Grid with + button first
	html += '<div class="asset-grid">';
	html += '<div class="create-btn" id="create-asset-btn"><span class="plus">+</span><span class="label">New Asset</span></div>';

	for (const a of filtered) {
		const meta = a.meta;
		const viewCount = Object.keys(meta.views).length;
		const refCount = (meta.references || []).length;
		const isGenerating = generatingFolders.has(a.folder);
		html += '<div class="asset-card' + (isGenerating ? ' card-generating' : '') + '" data-folder="' + esc(a.folder) + '">'
			+ (isGenerating ? '<div class="card-gen-spinner"><div class="spinner"></div><span class="gen-label">Generating...</span></div>' : '')
			+ '<div class="card-preview"><canvas width="64" height="64"></canvas></div>'
			+ '<div class="card-info">'
			+ '<div class="card-name">' + esc(meta.name) + '</div>'
			+ (meta.description ? '<div class="card-desc">' + esc(meta.description) + '</div>' : '')
			+ '<div class="card-meta">'
			+ '<span class="badge badge-' + meta.type + '">' + meta.type + '</span>'
			+ (viewCount > 0 ? '<span class="view-count">' + viewCount + ' view' + (viewCount !== 1 ? 's' : '') + '</span>' : '')
			+ (refCount > 0 ? '<span class="ref-count">' + refCount + ' ref' + (refCount !== 1 ? 's' : '') + '</span>' : '')
			+ '</div></div></div>';
	}
	html += '</div>';

	// Unmanaged files section (palettes, legacy files)
	const unmanagedTypes = Object.keys(allUnmanagedAssets).filter(t => t !== 'palette');
	if (unmanagedTypes.length > 0) {
		html += '<div class="section-divider">Unmanaged Files</div>';
		html += '<div class="asset-grid">';
		for (const t of unmanagedTypes) {
			for (const f of allUnmanagedAssets[t]) {
				const fname = f.relativePath.split('/').pop();
				html += '<div class="asset-card" data-file="' + esc(f.relativePath) + '">'
					+ '<div class="card-preview"><canvas width="64" height="64"></canvas></div>'
					+ '<div class="card-info">'
					+ '<div class="card-name">' + esc(fname) + '</div>'
					+ '<div class="card-meta"><span class="badge badge-' + t + '">' + t + '</span></div>'
					+ '</div></div>';
			}
		}
		html += '</div>';
	}

	el.innerHTML = html;

	// Bind events
	el.querySelectorAll('.filter-btn').forEach(btn =>
		btn.addEventListener('click', () => { currentFilter = btn.dataset.filter; renderGallery(); })
	);
	document.getElementById('create-asset-btn').addEventListener('click', showCreateModal);
	el.querySelectorAll('.asset-card[data-folder]').forEach(card =>
		card.addEventListener('click', () => { location.hash = 'asset/' + encodeURIComponent(card.dataset.folder); })
	);
	el.querySelectorAll('.asset-card[data-file]').forEach(card =>
		card.addEventListener('click', () => { location.hash = 'asset/' + encodeURIComponent(card.dataset.file); })
	);

	// Render thumbnails for managed assets
	el.querySelectorAll('.asset-card[data-folder]').forEach(card => {
		const folder = card.dataset.folder;
		const canvas = card.querySelector('canvas');
		renderManagedThumbnail(canvas, folder);
	});
	// Render thumbnails for unmanaged files
	el.querySelectorAll('.asset-card[data-file]').forEach(card => {
		const filePath = card.dataset.file;
		const canvas = card.querySelector('canvas');
		renderFileThumbnail(canvas, filePath);
	});
}

function filterBtn(val, label) {
	return '<button class="filter-btn' + (currentFilter === val ? ' active' : '') + '" data-filter="' + val + '">' + esc(label) + '</button>';
}

async function renderManagedThumbnail(canvas, folder) {
	try {
		const asset = await api('/api/asset?path=' + encodeURIComponent(folder));
		if (asset.type !== 'managed') return;
		const meta = asset.meta;
		const defaultView = meta.defaultView || Object.keys(meta.views)[0];
		if (!defaultView || !asset.views[defaultView]) return drawPlaceholder(canvas.getContext('2d'), canvas, meta.type, meta.name, 180);
		const viewData = asset.views[defaultView];
		if (!viewData.data) return drawPlaceholder(canvas.getContext('2d'), canvas, meta.type, meta.name, 180);
		drawAsset(canvas, viewData.data, viewData.fileType, 180, meta.customColors);
	} catch { /* skip */ }
}

async function renderFileThumbnail(canvas, relPath) {
	try {
		const data = await api('/api/asset/file?path=' + encodeURIComponent(relPath));
		drawAsset(canvas, data.data, data.fileType, 180);
	} catch { /* skip */ }
}

// ── Create Asset Modal ──

function showCreateModal() {
	// Remove existing modal if any
	const existing = document.querySelector('.modal-overlay');
	if (existing) existing.remove();

	const overlay = document.createElement('div');
	overlay.className = 'modal-overlay';
	overlay.innerHTML =
		'<div class="modal">'
		+ '<h2>New Asset</h2>'
		+ '<label>Name</label>'
		+ '<input type="text" id="create-name" placeholder="Campfire" autofocus>'
		+ '<label>Type</label>'
		+ '<select id="create-type">'
		+ '<option value="sprite">Sprite</option>'
		+ '<option value="tileset">Tileset</option>'
		+ '<option value="tilemap">Tilemap</option>'
		+ '<option value="scene">Scene</option>'
		+ '<option value="emitter">Emitter</option>'
		+ '</select>'
		+ '<label>Description</label>'
		+ '<textarea id="create-desc" placeholder="Optional description..."></textarea>'
		+ '<div class="modal-error" id="create-error"></div>'
		+ '<div class="modal-actions">'
		+ '<button class="btn-cancel" id="create-cancel">Cancel</button>'
		+ '<button class="btn-create" id="create-submit">Create</button>'
		+ '</div>'
		+ '</div>';

	document.body.appendChild(overlay);

	overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
	document.getElementById('create-cancel').addEventListener('click', () => overlay.remove());
	document.getElementById('create-submit').addEventListener('click', async () => {
		const name = document.getElementById('create-name').value.trim();
		const type = document.getElementById('create-type').value;
		const description = document.getElementById('create-desc').value.trim();
		const errEl = document.getElementById('create-error');

		if (!name) { errEl.textContent = 'Name is required.'; return; }

		try {
			const result = await api('/api/assets', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name, type, description: description || undefined }),
			});
			if (result.error) { errEl.textContent = result.error; return; }
			overlay.remove();
			location.hash = 'asset/' + encodeURIComponent(result.folder);
		} catch (e) {
			errEl.textContent = 'Failed to create asset: ' + e.message;
		}
	});

	document.getElementById('create-name').focus();
}

// ── Confirm Dialog ──

function showConfirm(title, message, confirmLabel, onConfirm) {
	const existing = document.querySelector('.confirm-overlay');
	if (existing) existing.remove();

	const overlay = document.createElement('div');
	overlay.className = 'confirm-overlay';
	overlay.innerHTML =
		'<div class="confirm-dialog">'
		+ '<h2>' + title + '</h2>'
		+ '<p>' + message + '</p>'
		+ '<div class="actions">'
		+ '<button class="btn-cancel" id="confirm-cancel">Cancel</button>'
		+ '<button class="btn-confirm-danger" id="confirm-ok">' + esc(confirmLabel) + '</button>'
		+ '</div>'
		+ '</div>';

	document.body.appendChild(overlay);

	overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
	document.getElementById('confirm-cancel').addEventListener('click', () => overlay.remove());
	document.getElementById('confirm-ok').addEventListener('click', async () => {
		overlay.remove();
		await onConfirm();
	});
}

// ── Edit Asset Modal ──

function showEditAssetModal(meta) {
	const existing = document.querySelector('.modal-overlay');
	if (existing) existing.remove();

	const overlay = document.createElement('div');
	overlay.className = 'modal-overlay';
	overlay.innerHTML =
		'<div class="modal">'
		+ '<h2>Edit Asset</h2>'
		+ '<label>Name</label>'
		+ '<input type="text" id="edit-name" value="' + esc(meta.name) + '">'
		+ '<label>Description</label>'
		+ '<textarea id="edit-desc">' + esc(meta.description || '') + '</textarea>'
		+ '<label>Tags (comma-separated)</label>'
		+ '<input type="text" id="edit-tags" value="' + esc((meta.tags || []).join(', ')) + '">'
		+ '<div class="modal-error" id="edit-error"></div>'
		+ '<div class="modal-actions">'
		+ '<button class="btn-cancel" id="edit-cancel">Cancel</button>'
		+ '<button class="btn-create" id="edit-submit">Save</button>'
		+ '</div>'
		+ '</div>';

	document.body.appendChild(overlay);

	overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
	document.getElementById('edit-cancel').addEventListener('click', () => overlay.remove());
	document.getElementById('edit-submit').addEventListener('click', async () => {
		const name = document.getElementById('edit-name').value.trim();
		const description = document.getElementById('edit-desc').value.trim();
		const tagsStr = document.getElementById('edit-tags').value.trim();
		const errEl = document.getElementById('edit-error');

		if (!name) { errEl.textContent = 'Name is required.'; return; }

		const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : undefined;

		try {
			const result = await api('/api/asset?path=' + encodeURIComponent(currentAssetFolder), {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name, description: description || undefined, tags }),
			});
			if (result.error) { errEl.textContent = result.error; return; }
			overlay.remove();
			currentAssetMeta = result.meta;
			renderAssetDetail(document.getElementById('view-asset'));
		} catch (e) {
			errEl.textContent = 'Failed to update: ' + e.message;
		}
	});

	document.getElementById('edit-name').focus();
}

// ── Asset Detail ──

let currentAssetFolder = null;
let currentAssetMeta = null;
let currentAssetViews = null;
let currentViewName = null;

async function loadAssetDetail(path) {
	const el = document.getElementById('view-asset');
	el.innerHTML = '<div class="loading"><div class="spinner"></div> Loading...</div>';
	try {
		const asset = await api('/api/asset?path=' + encodeURIComponent(path));
		if (asset.type === 'managed') {
			currentAssetFolder = path;
			currentAssetMeta = asset.meta;
			currentAssetViews = asset.views;
			const viewNames = Object.keys(asset.meta.views);
			currentViewName = asset.meta.defaultView || viewNames[0] || null;
			renderAssetDetail(el);
		} else if (asset.type === 'file') {
			// Legacy file detail
			renderFileDetail(el, asset);
		}
	} catch {
		el.innerHTML = '<div class="loading">Failed to load asset.</div>';
	}
}

function renderAssetDetail(el) {
	const meta = currentAssetMeta;
	const views = currentAssetViews;
	const viewNames = Object.keys(meta.views);

	let html = '<button class="detail-back" id="asset-back-btn">&#8592; Back to Gallery</button>';
	html += '<div class="view-header"><h1 id="asset-name-display">' + esc(meta.name) + '</h1>'
		+ '<span class="badge badge-' + meta.type + '">' + meta.type + '</span>'
		+ '<div class="detail-actions">'
		+ '<button class="btn-icon edit" id="edit-asset-btn" title="Edit asset">&#9998;</button>'
		+ '<button class="btn-danger" id="delete-asset-btn">Delete Asset</button>'
		+ '</div></div>';

	if (meta.description) {
		html += '<p style="color:var(--text2);margin:-12px 0 16px" id="asset-desc-display">' + esc(meta.description) + '</p>';
	} else {
		html += '<p style="color:var(--text2);margin:-12px 0 16px;font-style:italic" id="asset-desc-display">No description</p>';
	}

	// View tabs
	html += '<div class="view-tabs">';
	for (const vn of viewNames) {
		const v = meta.views[vn];
		const label = v.label || vn;
		html += '<div class="view-tab-group">'
			+ '<button class="view-tab' + (vn === currentViewName ? ' active' : '') + '" data-view="' + esc(vn) + '">' + esc(label) + '</button>'
			+ '<button class="btn-icon danger delete-view-btn" data-view="' + esc(vn) + '" title="Delete view">&#10005;</button>'
			+ '</div>';
	}
	html += '<button class="view-tab view-tab-add" id="add-view-btn">+ Add View</button>';
	html += '</div>';

	// Main layout
	html += '<div class="asset-detail-layout">';

	// Left: preview + animation controls
	html += '<div>';
	html += '<div class="detail-preview" id="asset-preview-box"></div>';
	html += '<div id="asset-anim-controls"></div>';

	// Inline generate form (hidden by default)
	html += '<div id="gen-panel" style="display:none">';
	html += '<div class="gen-form">';
	html += '<label>View Name</label>';
	html += '<input type="text" id="gen-view-name" placeholder="e.g., lit, unlit, front, side">';
	html += '<label>Prompt</label>';
	html += '<textarea id="gen-prompt" placeholder="Describe the view to generate..."></textarea>';
	html += '<label>Detail Level</label>';
	html += '<select id="gen-detail">';
	html += '<option value="low">Low (16 PPU)</option>';
	html += '<option value="standard" selected>Standard (32 PPU)</option>';
	html += '<option value="high">High (64 PPU)</option>';
	html += '</select>';
	html += '<div class="gen-sizing-hint" id="gen-sizing-hint"></div>';
	html += '<label>Palette</label>';
	html += '<select id="gen-palette"><option value="">Default (fantasy32)</option></select>';
	html += '<label>Model</label>';
	html += '<select id="gen-model">';
	html += '<option value="">Default</option>';
	html += '<option value="claude-sonnet-4-5-20250929">Sonnet 4.5</option>';
	html += '<option value="claude-sonnet-4-6-20250514">Sonnet 4.6</option>';
	html += '<option value="claude-haiku-4-5-20251001">Haiku 4.5</option>';
	html += '<option value="claude-opus-4-6-20250514">Opus 4.6</option>';
	html += '</select>';
	html += '<button class="gen-btn" id="gen-submit">Generate View</button>';
	html += '</div>';
	html += '<div class="gen-output" id="gen-output"></div>';
	html += '</div>';

	// JSON for current view
	html += '<div class="detail-json" id="asset-json-box"></div>';
	html += '</div>';

	// Right: properties + references
	html += '<div>';
	html += '<div class="detail-info">';
	html += '<h3>Properties</h3>';
	html += '<dl class="detail-props">';
	html += prop('Type', meta.type);
	html += prop('Views', viewNames.length);
	if (meta.detailLevel) html += prop('Detail Level', meta.detailLevel);
	if (meta.palette) html += prop('Palette', meta.palette);
	html += '</dl>';

	if (meta.tags && meta.tags.length) {
		html += '<div style="margin-top:12px"><strong style="font-size:13px">Tags</strong>';
		html += '<div class="tag-list">';
		for (const t of meta.tags) html += '<span class="tag">' + esc(t) + '</span>';
		html += '</div></div>';
	}

	// References
	html += '<h3 style="margin-top:20px">References</h3>';
	const refs = meta.references || [];
	if (refs.length) {
		html += '<div class="ref-list">';
		for (const ref of refs) {
			html += '<div class="ref-item">'
				+ '<span class="ref-role">' + esc(ref.role) + '</span>'
				+ '<span class="ref-name" data-asset="' + esc(ref.asset) + '">' + esc(ref.asset) + '</span>'
				+ (ref.description ? '<span class="ref-desc">' + esc(ref.description) + '</span>' : '')
				+ '</div>';
		}
		html += '</div>';
	} else {
		html += '<p style="color:var(--text2);font-size:13px;margin-top:8px">No references. Other assets can be linked here for composition.</p>';
	}

	// Custom colors editor
	html += '<div class="custom-colors">';
	html += '<h3>Custom Colors <span style="font-size:11px;color:var(--text2);font-weight:400">(up to 8)</span></h3>';
	const cc = meta.customColors || {};
	const ccKeys = Object.keys(cc);
	html += '<div class="cc-grid" id="cc-grid">';
	for (const [key, color] of Object.entries(cc)) {
		html += '<div class="cc-entry" data-key="' + esc(key) + '">'
			+ '<span class="cc-key">' + esc(key) + '</span>'
			+ '<div class="cc-swatch" style="background:' + esc(color) + '" data-key="' + esc(key) + '"></div>'
			+ '<input type="color" class="cc-color-input" value="' + esc(color) + '" data-key="' + esc(key) + '">'
			+ '<button class="cc-remove" data-key="' + esc(key) + '" title="Remove">\\u2715</button>'
			+ '</div>';
	}
	if (ccKeys.length < 8) {
		html += '<button class="cc-add-btn" id="cc-add-btn">+ Add</button>';
	}
	html += '</div>';
	html += '<div class="cc-hint">Custom palette keys available to this asset only. Merged with base palette for generation and rendering.</div>';
	html += '</div>';

	// Current view properties
	if (currentViewName && views[currentViewName] && views[currentViewName].data) {
		const vd = views[currentViewName].data;
		const vt = views[currentViewName].fileType;
		html += '<h3 style="margin-top:20px">View: ' + esc(currentViewName) + '</h3>';
		html += '<dl class="detail-props">';
		if (vt === 'sprite' && vd) {
			html += prop('Size', vd.width + 'x' + vd.height);
			html += prop('Encoding', vd.encoding);
			if (vd.frameCount) html += prop('Frames', vd.frameCount);
			if (vd.layers) html += prop('Layers', vd.layers.length);
			if (vd.clips) html += prop('Clips', Object.keys(vd.clips).join(', '));
			if (vd.ppu) html += prop('PPU', vd.ppu);
		} else if (vt === 'tileset' && vd) {
			html += prop('Tile Size', vd.tileWidth + 'x' + vd.tileHeight);
			html += prop('Tiles', Object.keys(vd.tiles).length);
		} else if (vt === 'scene' && vd) {
			html += prop('Canvas', vd.canvas.width + 'x' + vd.canvas.height);
			html += prop('Layers', vd.layers.length);
		}
		html += '</dl>';
	}

	html += '</div>';
	html += '</div>';
	html += '</div>';

	el.innerHTML = html;

	// ── Bind events ──
	document.getElementById('asset-back-btn').addEventListener('click', () => {
		stopAnimation();
		location.hash = 'gallery';
	});

	// Delete asset
	document.getElementById('delete-asset-btn').addEventListener('click', () => {
		showConfirm(
			'Delete Asset',
			'Are you sure you want to delete <strong>' + esc(meta.name) + '</strong> and all its views? This cannot be undone.',
			'Delete',
			async () => {
				try {
					await api('/api/asset?path=' + encodeURIComponent(currentAssetFolder), { method: 'DELETE' });
					location.hash = 'gallery';
				} catch (e) { alert('Failed to delete: ' + e.message); }
			}
		);
	});

	// Edit asset metadata
	document.getElementById('edit-asset-btn').addEventListener('click', () => {
		showEditAssetModal(meta);
	});

	// View tabs
	el.querySelectorAll('.view-tab[data-view]').forEach(tab => {
		tab.addEventListener('click', () => {
			currentViewName = tab.dataset.view;
			renderAssetDetail(el);
		});
	});

	// Delete view buttons
	el.querySelectorAll('.delete-view-btn').forEach(btn => {
		btn.addEventListener('click', (e) => {
			e.stopPropagation();
			const viewName = btn.dataset.view;
			showConfirm(
				'Delete View',
				'Delete view <strong>' + esc(viewName) + '</strong> and its pixel file? This cannot be undone.',
				'Delete',
				async () => {
					try {
						await api('/api/asset/view?path=' + encodeURIComponent(currentAssetFolder) + '&view=' + encodeURIComponent(viewName), { method: 'DELETE' });
						loadAssetDetail(currentAssetFolder);
					} catch (e) { alert('Failed to delete view: ' + e.message); }
				}
			);
		});
	});

	// Add View button
	document.getElementById('add-view-btn').addEventListener('click', () => {
		const panel = document.getElementById('gen-panel');
		panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
	});

	// Reference links
	el.querySelectorAll('.ref-name').forEach(link => {
		link.addEventListener('click', () => {
			location.hash = 'asset/' + encodeURIComponent(link.dataset.asset);
		});
	});

	// Custom colors event handlers
	wireCustomColors(el);

	// Render preview
	const box = document.getElementById('asset-preview-box');
	if (currentViewName && views[currentViewName] && views[currentViewName].data) {
		const vd = views[currentViewName].data;
		const vt = views[currentViewName].fileType;
		const canvas = document.createElement('canvas');
		canvas.id = 'anim-canvas';
		drawAsset(canvas, vd, vt, 320, meta.customColors);
		box.appendChild(canvas);

		// Show JSON
		const jsonBox = document.getElementById('asset-json-box');
		jsonBox.innerHTML = '<h3>JSON</h3><pre>' + esc(JSON.stringify(vd, null, 2)) + '</pre>';

		// Wire up animation if sprite with clips
		wireAnimControls(vd, vt);
	} else if (viewNames.length === 0) {
		box.innerHTML = '<div style="text-align:center;color:var(--text2)"><p>No views yet.</p><p style="margin-top:8px">Click <strong>+ Add View</strong> to generate the first one.</p></div>';
	} else {
		drawPlaceholder(box, null, meta.type, meta.name, 240);
	}

	// Wire up generate form
	wireGenerateForm();
}

function wireAnimControls(data, fileType) {
	if (fileType !== 'sprite' || !data.clips) return;
	const clipNames = Object.keys(data.clips);
	if (clipNames.length === 0) return;

	animAssetData = data;
	animClipName = clipNames[0];
	const dur = data.clips[animClipName].duration;

	let animHtml = '<div class="anim-controls">'
		+ '<button class="anim-btn" id="anim-play-btn" title="Play/Pause"><span class="icon">\\u25B6</span></button>'
		+ '<button class="anim-btn' + (animLoop ? ' active' : '') + '" id="anim-loop-btn" title="Loop">Loop</button>';
	if (clipNames.length > 1) {
		animHtml += '<select class="anim-select" id="anim-clip-select">';
		for (const cn of clipNames) animHtml += '<option value="' + esc(cn) + '">' + esc(cn) + '</option>';
		animHtml += '</select>';
	} else {
		animHtml += '<span style="font-size:13px;color:var(--text2)">' + esc(clipNames[0]) + '</span>';
	}
	animHtml += '<div class="anim-progress" id="anim-progress"><div class="anim-progress-fill" id="anim-progress-fill" style="width:0"></div></div>'
		+ '<span class="anim-time" id="anim-time">0.00s / ' + (dur / 1000).toFixed(2) + 's</span>'
		+ '</div>';

	document.getElementById('asset-anim-controls').innerHTML = animHtml;

	document.getElementById('anim-play-btn').addEventListener('click', toggleAnimation);
	document.getElementById('anim-loop-btn').addEventListener('click', function() {
		animLoop = !animLoop;
		this.classList.toggle('active', animLoop);
	});

	const clipSel = document.getElementById('anim-clip-select');
	if (clipSel) {
		clipSel.addEventListener('change', function() {
			const wasPlaying = animPlaying;
			stopAnimation();
			animClipName = this.value;
			const dur = data.clips[animClipName].duration;
			const timeEl = document.getElementById('anim-time');
			if (timeEl) timeEl.textContent = '0.00s / ' + (dur / 1000).toFixed(2) + 's';
			const fill = document.getElementById('anim-progress-fill');
			if (fill) fill.style.width = '0';
			const canvas = document.getElementById('anim-canvas');
			if (canvas) drawAsset(canvas, data, 'sprite', 320);
			if (wasPlaying) startAnimation();
		});
	}

	const progressBar = document.getElementById('anim-progress');
	if (progressBar) {
		progressBar.addEventListener('click', function(e) {
			const rect = this.getBoundingClientRect();
			const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
			const clip = data.clips[animClipName];
			if (!clip) return;
			const seekTime = pct * clip.duration;
			renderAnimFrame(clip, seekTime);
			const fill = document.getElementById('anim-progress-fill');
			if (fill) fill.style.width = (pct * 100) + '%';
			const timeEl = document.getElementById('anim-time');
			if (timeEl) timeEl.textContent = (seekTime / 1000).toFixed(2) + 's / ' + (clip.duration / 1000).toFixed(2) + 's';
			if (animPlaying) animStartTime = performance.now() - seekTime;
		});
	}
}

// ── Legacy File Detail ──

function renderFileDetail(el, asset) {
	const d = asset.data;
	const type = asset.fileType;

	let propsHtml = '';
	if (type === 'sprite') {
		propsHtml = prop('Name', d.name) + prop('Size', d.width + 'x' + d.height) + prop('Encoding', d.encoding);
	} else if (type === 'tileset') {
		propsHtml = prop('Name', d.name) + prop('Tile Size', d.tileWidth + 'x' + d.tileHeight) + prop('Tiles', Object.keys(d.tiles).length);
	} else if (type === 'palette') {
		propsHtml = prop('Name', d.name || '(unnamed)') + prop('Entries', Object.keys(d.entries).length);
	}

	el.innerHTML =
		'<button class="detail-back" id="file-back-btn">&#8592; Back to Gallery</button>'
		+ '<div class="view-header"><h1>' + esc(d.name || asset.path) + '</h1>'
		+ '<span class="badge badge-' + type + '">' + type + '</span></div>'
		+ '<div class="asset-detail-layout">'
		+ '<div><div class="detail-preview" id="file-preview-box"></div>'
		+ '<div class="detail-json"><h3>JSON</h3><pre>' + esc(JSON.stringify(d, null, 2)) + '</pre></div></div>'
		+ '<div><div class="detail-info"><h3>Properties</h3><dl class="detail-props">' + propsHtml + '</dl></div></div>'
		+ '</div>';

	document.getElementById('file-back-btn').addEventListener('click', () => { location.hash = 'gallery'; });

	const box = document.getElementById('file-preview-box');
	if (type === 'palette') {
		renderPaletteSwatches(box, d);
	} else {
		const canvas = document.createElement('canvas');
		drawAsset(canvas, d, type, 320);
		box.appendChild(canvas);
	}
}

// ── Generate (inline in asset detail) ──

const ARCHETYPES = [
	{ key: 'icon', label: 'Icon', worldWidth: 0.5, worldHeight: 0.5, keywords: ['icon','ui','minimap','marker','indicator','badge','symbol'] },
	{ key: 'small-item', label: 'Small Item', worldWidth: 0.5, worldHeight: 0.5, keywords: ['potion','key','coin','gem','scroll','ring','amulet','vial','herb','arrow','bolt','rune','orb','small'] },
	{ key: 'item', label: 'Item / Equipment', worldWidth: 1, worldHeight: 1, keywords: ['sword','shield','axe','bow','staff','wand','hammer','mace','helmet','armor','boot','glove','lantern','torch','chest','crate','barrel','weapon','equipment','tool','item'] },
	{ key: 'character', label: 'Character', worldWidth: 1, worldHeight: 1.5, keywords: ['character','person','human','elf','dwarf','halfling','gnome','warrior','mage','rogue','cleric','ranger','paladin','bard','wizard','sorcerer','druid','monk','warlock','barbarian','knight','archer','thief','priest','villager','merchant','guard','king','queen','npc','hero','player'] },
	{ key: 'creature', label: 'Creature', worldWidth: 1, worldHeight: 1, keywords: ['wolf','goblin','skeleton','slime','rat','bat','spider','snake','imp','zombie','ghost','fox','cat','dog','boar','deer','bird','rabbit','frog','beetle','creature','monster','animal','beast','pet','familiar','companion'] },
	{ key: 'large-creature', label: 'Large Creature', worldWidth: 2, worldHeight: 2, keywords: ['ogre','troll','bear','giant','minotaur','centaur','golem','elemental','wyvern','griffon','owlbear','hydra','large','big','huge','dire'] },
	{ key: 'boss', label: 'Boss / Dragon', worldWidth: 3, worldHeight: 3, keywords: ['dragon','boss','titan','colossus','leviathan','ancient','elder','wyrm','behemoth','kraken','massive','colossal'] },
	{ key: 'prop', label: 'Prop / Furniture', worldWidth: 1, worldHeight: 1, keywords: ['table','chair','sign','fence','campfire','fire','fountain','well','lamp','post','rock','boulder','stump','log','bush','prop','furniture','tombstone','grave','altar','pedestal'] },
	{ key: 'tree', label: 'Tree / Tall Prop', worldWidth: 2, worldHeight: 3, keywords: ['tree','pine','oak','willow','birch','palm','pillar','column','banner','flag','totem','statue'] },
	{ key: 'building', label: 'Building', worldWidth: 3, worldHeight: 3, keywords: ['house','shop','inn','tavern','cabin','hut','cottage','shed','tent','building','home','dwelling'] },
	{ key: 'large-building', label: 'Large Building', worldWidth: 4, worldHeight: 4, keywords: ['castle','temple','mansion','lodge','fortress','cathedral','palace','tower','keep','citadel','church','monastery','gate','gatehouse','wall','fortification'] },
	{ key: 'tile', label: 'Tile', worldWidth: 1, worldHeight: 1, keywords: ['tile','ground','floor','wall','terrain','grass','dirt','stone','water','sand','snow','lava'] },
];

function inferArchetypeClient(prompt) {
	const lower = prompt.toLowerCase();
	const words = lower.split(/\\s+/);
	let best = null;
	let bestScore = 0;
	for (const a of ARCHETYPES) {
		let score = 0;
		for (const kw of a.keywords) {
			if (words.includes(kw)) score += 2;
			else if (lower.includes(kw)) score += 1;
		}
		if (score > bestScore) { bestScore = score; best = a; }
	}
	return best || ARCHETYPES.find(a => a.key === 'character');
}

function wireCustomColors(el) {
	// Color swatch click → open color picker
	el.querySelectorAll('.cc-swatch').forEach(swatch => {
		const key = swatch.dataset.key;
		const input = el.querySelector('.cc-color-input[data-key="' + key + '"]');
		if (input) {
			swatch.addEventListener('click', () => input.click());
			input.addEventListener('input', async function() {
				swatch.style.background = this.value;
				await saveCustomColor(key, this.value);
			});
		}
	});

	// Remove button
	el.querySelectorAll('.cc-remove').forEach(btn => {
		btn.addEventListener('click', async () => {
			await removeCustomColor(btn.dataset.key);
		});
	});

	// Add button
	const addBtn = document.getElementById('cc-add-btn');
	if (addBtn) {
		addBtn.addEventListener('click', () => showAddCustomColorModal());
	}
}

async function saveCustomColor(key, color) {
	const cc = Object.assign({}, currentAssetMeta.customColors || {});
	cc[key] = color;
	try {
		const result = await api('/api/asset?path=' + encodeURIComponent(currentAssetFolder), {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ customColors: cc }),
		});
		if (result.meta) currentAssetMeta = result.meta;
	} catch { /* ignore */ }
}

async function removeCustomColor(key) {
	const cc = Object.assign({}, currentAssetMeta.customColors || {});
	delete cc[key];
	try {
		const result = await api('/api/asset?path=' + encodeURIComponent(currentAssetFolder), {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ customColors: Object.keys(cc).length ? cc : undefined }),
		});
		if (result.meta) currentAssetMeta = result.meta;
		renderAssetDetail(document.getElementById('view-asset'));
	} catch { /* ignore */ }
}

function showAddCustomColorModal() {
	const existing = document.querySelector('.modal-overlay');
	if (existing) existing.remove();

	// Find next available key (prefer lowercase letters not in base palette)
	const usedKeys = new Set(Object.keys(currentAssetMeta.customColors || {}));
	const candidates = 'xyzwvutsrqponmlkjihgfedcba'.split('').filter(k => !usedKeys.has(k));
	const defaultKey = candidates[0] || '';

	const overlay = document.createElement('div');
	overlay.className = 'modal-overlay';
	overlay.innerHTML =
		'<div class="modal">'
		+ '<h2>Add Custom Color</h2>'
		+ '<label>Key (single character)</label>'
		+ '<input type="text" id="cc-new-key" maxlength="1" value="' + defaultKey + '" style="width:60px;text-align:center;font-family:monospace;font-size:18px">'
		+ '<label>Color</label>'
		+ '<input type="color" id="cc-new-color" value="#ff6600" style="width:60px;height:40px;cursor:pointer;background:none;border:1px solid var(--border);border-radius:4px">'
		+ '<div class="modal-error" id="cc-error"></div>'
		+ '<div class="modal-actions">'
		+ '<button class="btn-cancel" id="cc-cancel">Cancel</button>'
		+ '<button class="btn-create" id="cc-submit">Add</button>'
		+ '</div>'
		+ '</div>';

	document.body.appendChild(overlay);

	overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
	document.getElementById('cc-cancel').addEventListener('click', () => overlay.remove());
	document.getElementById('cc-submit').addEventListener('click', async () => {
		const key = document.getElementById('cc-new-key').value.trim();
		const color = document.getElementById('cc-new-color').value;
		const errEl = document.getElementById('cc-error');

		if (!key || key.length !== 1) { errEl.textContent = 'Key must be a single character.'; return; }
		const cc = Object.assign({}, currentAssetMeta.customColors || {});
		if (Object.keys(cc).length >= 8) { errEl.textContent = 'Maximum 8 custom colors.'; return; }
		if (cc[key]) { errEl.textContent = 'Key "' + key + '" is already in use.'; return; }

		cc[key] = color;
		try {
			const result = await api('/api/asset?path=' + encodeURIComponent(currentAssetFolder), {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ customColors: cc }),
			});
			if (result.meta) currentAssetMeta = result.meta;
			overlay.remove();
			renderAssetDetail(document.getElementById('view-asset'));
		} catch (e) {
			errEl.textContent = 'Failed: ' + e.message;
		}
	});

	document.getElementById('cc-new-key').focus();
}

function wireGenerateForm() {
	const promptEl = document.getElementById('gen-prompt');
	const detailEl = document.getElementById('gen-detail');
	const paletteEl = document.getElementById('gen-palette');
	const modelEl = document.getElementById('gen-model');
	const sizingHint = document.getElementById('gen-sizing-hint');
	if (!promptEl) return;

	function updateSizingHint() {
		const prompt = promptEl.value.trim();
		if (!prompt) { sizingHint.textContent = ''; return; }
		const archetype = inferArchetypeClient(prompt);
		const ppu = { low: 16, standard: 32, high: 64 }[detailEl.value] || 32;
		const w = Math.round(archetype.worldWidth * ppu);
		const h = Math.round(archetype.worldHeight * ppu);
		sizingHint.textContent = 'Auto-sized: ' + archetype.label + ' \\u2192 ' + w + '\\u00d7' + h + ' px at ' + ppu + ' PPU';
	}
	promptEl.addEventListener('input', updateSizingHint);
	detailEl.addEventListener('change', updateSizingHint);

	// Populate palette options synchronously from cache (prevents duplicate appends)
	if (paletteEl) {
		for (const p of cachedPaletteList) {
			const opt = document.createElement('option');
			opt.value = p.path;
			opt.textContent = p.name + ' (' + p.entryCount + ' colors)';
			paletteEl.appendChild(opt);
		}
	}

	// Restore saved preferences from IndexedDB
	loadPrefs().then(prefs => {
		if (prefs.detailLevel && detailEl) { detailEl.value = prefs.detailLevel; }
		if (prefs.palette && paletteEl) { paletteEl.value = prefs.palette; }
		if (prefs.model && modelEl) { modelEl.value = prefs.model; }
	});

	// Save preferences on change
	function persistPrefs() {
		savePrefs({
			detailLevel: detailEl ? detailEl.value : '',
			palette: paletteEl ? paletteEl.value : '',
			model: modelEl ? modelEl.value : '',
		});
	}
	if (detailEl) detailEl.addEventListener('change', persistPrefs);
	if (paletteEl) paletteEl.addEventListener('change', persistPrefs);
	if (modelEl) modelEl.addEventListener('change', persistPrefs);

	document.getElementById('gen-submit').addEventListener('click', runGenerate);
}

async function runGenerate() {
	const prompt = document.getElementById('gen-prompt').value.trim();
	const viewName = document.getElementById('gen-view-name').value.trim();
	if (!prompt) return;
	if (!viewName) { document.getElementById('gen-output').classList.add('visible'); document.getElementById('gen-output').textContent = 'View name is required.'; return; }

	const type = currentAssetMeta ? currentAssetMeta.type : 'sprite';
	const detailLevel = document.getElementById('gen-detail').value;
	const palette = document.getElementById('gen-palette').value || undefined;
	const model = document.getElementById('gen-model').value || undefined;
	const btn = document.getElementById('gen-submit');
	const output = document.getElementById('gen-output');

	btn.disabled = true;
	btn.innerHTML = '<span class="spinner"></span> Generating...';
	output.classList.add('visible');
	output.textContent = 'Generation started. You can navigate away \\u2014 the spinner in the gallery shows progress.';

	try {
		const data = await api('/api/generate', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				prompt,
				type,
				detailLevel,
				palette,
				model,
				assetFolder: currentAssetFolder,
				viewName,
			}),
		});
		if (data.error) {
			output.textContent = 'Error: ' + data.error + (data.details ? '\\n\\nDetails:\\n' + data.details : '');
			btn.disabled = false;
			btn.textContent = 'Generate View';
		}
		// On 202 Accepted, keep button disabled — WebSocket will notify completion
		// The generate-complete event handler calls showGenStatus and re-enables the button
	} catch (e) {
		output.textContent = 'Request failed: ' + e.message;
		btn.disabled = false;
		btn.textContent = 'Generate View';
	}
}

function prop(key, val) {
	return '<dt>' + esc(key) + '</dt><dd>' + esc(String(val)) + '</dd>';
}

// ── Palettes ──

async function loadPalettes() {
	const el = document.getElementById('view-palettes');
	el.innerHTML = '<div class="loading"><div class="spinner"></div> Loading palettes...</div>';
	try {
		const data = await api('/api/palettes');
		const pals = data.palettes || [];
		await renderPalettesView(el, pals);
	} catch {
		el.innerHTML = '<div class="loading">Failed to load palettes.</div>';
	}
}

async function renderPalettesView(el, paletteList) {
	const loaded = [];
	for (const p of paletteList) {
		try {
			const asset = await api('/api/asset/file?path=' + encodeURIComponent(p.path));
			loaded.push({ ...p, data: asset.data });
		} catch {
			loaded.push({ ...p, data: null });
		}
	}
	loaded.sort((a, b) => a.entryCount - b.entryCount);

	let html = '<div class="view-header"><h1>Palettes</h1><span class="count">' + loaded.length + ' palettes</span></div>';
	html += '<div class="palette-grid">';
	for (const p of loaded) {
		html += '<div class="palette-card"><h3>' + esc(p.name) + '</h3>';
		html += '<div class="pal-count">' + p.entryCount + ' entries</div>';
		if (p.data && p.data.entries) {
			html += '<div class="swatch-grid">';
			for (const [key, color] of Object.entries(p.data.entries)) {
				const alias = (p.data.aliases && p.data.aliases[key]) ? p.data.aliases[key] : '';
				const tip = key + (alias ? ' (' + alias + ')' : '') + ': ' + color;
				if (color === 'transparent') {
					html += '<div class="swatch transparent" data-tip="' + esc(tip) + '"></div>';
				} else {
					html += '<div class="swatch" style="background:' + color + '" data-tip="' + esc(tip) + '"></div>';
				}
			}
			html += '</div>';
			if (p.data.ramps) {
				const rampEntries = Object.entries(p.data.ramps);
				if (rampEntries.length) {
					html += '<div class="ramp-section"><h4>Ramps</h4>';
					for (const [name, keys] of rampEntries) {
						html += '<div class="ramp-row"><span class="ramp-label">' + esc(name) + '</span>';
						for (const k of keys) {
							const c = p.data.entries[k] || 'transparent';
							html += '<div class="ramp-swatch" style="background:' + (c === 'transparent' ? 'transparent' : c) + '" title="' + esc(k + '=' + c) + '"></div>';
						}
						html += '</div>';
					}
					html += '</div>';
				}
			}
		}
		html += '</div>';
	}
	html += '</div>';
	el.innerHTML = html;
}

function renderPaletteSwatches(container, palette) {
	const div = document.createElement('div');
	div.className = 'swatch-grid';
	for (const [key, color] of Object.entries(palette.entries)) {
		const swatch = document.createElement('div');
		swatch.className = 'swatch' + (color === 'transparent' ? ' transparent' : '');
		const alias = (palette.aliases && palette.aliases[key]) ? palette.aliases[key] : '';
		swatch.setAttribute('data-tip', key + (alias ? ' (' + alias + ')' : '') + ': ' + color);
		if (color !== 'transparent') swatch.style.background = color;
		div.appendChild(swatch);
	}
	container.appendChild(div);
}

// ── Validation ──

async function loadValidation() {
	const el = document.getElementById('view-validate');
	el.innerHTML = '<div class="loading"><div class="spinner"></div> Validating all assets...</div>';
	try {
		const data = await api('/api/validate');
		renderValidation(el, data);
	} catch {
		el.innerHTML = '<div class="loading">Validation failed.</div>';
	}
}

function renderValidation(el, data) {
	const s = data.summary;
	let html = '<div class="view-header"><h1>Validation</h1></div>';
	html += '<div class="val-summary">';
	html += '<div class="val-stat"><div class="num">' + s.total + '</div><div class="label">Total</div></div>';
	html += '<div class="val-stat pass"><div class="num">' + s.passed + '</div><div class="label">Passed</div></div>';
	html += '<div class="val-stat fail"><div class="num">' + s.failed + '</div><div class="label">Failed</div></div>';
	html += '<div class="val-stat warn"><div class="num">' + s.warnings + '</div><div class="label">Warnings</div></div>';
	html += '</div>';
	html += '<div class="val-list">';
	for (const r of data.results) {
		const status = !r.valid ? 'fail' : r.warnings.length ? 'warn' : 'pass';
		const hasDetails = r.errors.length > 0 || r.warnings.length > 0;
		html += '<div class="val-item"><div class="val-item-header' + (hasDetails ? ' clickable' : '') + '">'
			+ '<div class="val-dot ' + status + '"></div>'
			+ '<span class="val-path">' + esc(r.path) + '</span>'
			+ '<span class="val-type">' + r.fileType + '</span>'
			+ '</div>';
		if (hasDetails) {
			html += '<div class="val-details">';
			for (const e of r.errors) html += '<div class="val-error">&#10007; ' + esc(e) + '</div>';
			for (const w of r.warnings) html += '<div class="val-warning">&#9888; ' + esc(w) + '</div>';
			html += '</div>';
		}
		html += '</div>';
	}
	html += '</div>';
	el.innerHTML = html;
	el.querySelectorAll('.val-item-header.clickable').forEach(h =>
		h.addEventListener('click', () => h.closest('.val-item').classList.toggle('expanded'))
	);
}

// ── Animation Engine ──

const easingFns = {
	step: function(t) { return 0; },
	linear: function(t) { return t; },
	'ease-in': function(t) { return t * t; },
	'ease-out': function(t) { return t * (2 - t); },
	'ease-in-out': function(t) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }
};

function interpolateTrack(track, time) {
	const kfs = track.keyframes;
	if (!kfs || !kfs.length) return 0;
	const easing = track.easing || (track.property === 'frame' ? 'step' : 'linear');
	if (kfs.length === 1 || time <= kfs[0].time) return typeof kfs[0].value === 'number' ? kfs[0].value : 0;
	const last = kfs[kfs.length - 1];
	if (time >= last.time) return typeof last.value === 'number' ? last.value : 0;
	let prev = kfs[0], next = kfs[1];
	for (let i = 0; i < kfs.length - 1; i++) {
		if (time >= kfs[i].time && time <= kfs[i + 1].time) { prev = kfs[i]; next = kfs[i + 1]; break; }
	}
	if (prev === next || easing === 'step') return typeof prev.value === 'number' ? prev.value : 0;
	const pv = typeof prev.value === 'number' ? prev.value : 0;
	const nv = typeof next.value === 'number' ? next.value : 0;
	const span = next.time - prev.time;
	if (span === 0) return pv;
	const t = (time - prev.time) / span;
	const fn = easingFns[easing] || easingFns.linear;
	return pv + (nv - pv) * fn(t);
}

function computeClipTime(elapsed, duration, playback) {
	if (duration <= 0) return 0;
	if (elapsed < 0) return 0;
	if (playback === 'once') return elapsed >= duration ? null : elapsed;
	if (playback === 'pingpong') {
		const cycle = 2 * duration;
		const pos = elapsed % cycle;
		return pos <= duration ? pos : cycle - pos;
	}
	return elapsed % duration;
}

function sampleClip(clip, elapsed) {
	const playback = clip.playback || 'loop';
	const localTime = computeClipTime(elapsed, clip.duration, playback);
	const props = { frame: 0, offsetX: 0, offsetY: 0, rotation: 0, scale: 1, opacity: 1 };
	if (localTime === null) {
		for (const track of clip.tracks) {
			if (track.property in props) {
				const last = track.keyframes[track.keyframes.length - 1];
				if (last) props[track.property] = typeof last.value === 'number' ? last.value : 0;
			}
		}
		return props;
	}
	for (const track of clip.tracks) {
		if (track.property in props) {
			props[track.property] = interpolateTrack(track, localTime);
		}
	}
	return props;
}

function stopAnimation() {
	animPlaying = false;
	if (animRafId) { cancelAnimationFrame(animRafId); animRafId = null; }
	const btn = document.getElementById('anim-play-btn');
	if (btn) { btn.querySelector('.icon').textContent = '\\u25B6'; }
}

function startAnimation() {
	if (!animAssetData || !animClipName) return;
	const clip = animAssetData.clips && animAssetData.clips[animClipName];
	if (!clip) return;
	animPlaying = true;
	animStartTime = performance.now();
	const btn = document.getElementById('anim-play-btn');
	if (btn) { btn.querySelector('.icon').textContent = '\\u23F8'; }
	animRafId = requestAnimationFrame(animTick);
}

function toggleAnimation() {
	if (animPlaying) stopAnimation();
	else startAnimation();
}

function animTick(now) {
	if (!animPlaying || !animAssetData || !animClipName) return;
	const clip = animAssetData.clips[animClipName];
	if (!clip) { stopAnimation(); return; }
	const elapsed = now - animStartTime;
	const playback = clip.playback || 'loop';
	if (!animLoop && playback === 'once' && elapsed >= clip.duration) {
		renderAnimFrame(clip, clip.duration);
		stopAnimation();
		return;
	}
	const effectiveElapsed = animLoop ? elapsed : Math.min(elapsed, clip.duration);
	renderAnimFrame(clip, effectiveElapsed);
	const dur = clip.duration;
	const localTime = computeClipTime(effectiveElapsed, dur, animLoop ? 'loop' : playback);
	const pct = localTime !== null ? (localTime / dur) * 100 : 100;
	const fill = document.getElementById('anim-progress-fill');
	if (fill) fill.style.width = pct + '%';
	const timeEl = document.getElementById('anim-time');
	if (timeEl) {
		const lt = localTime !== null ? localTime : dur;
		timeEl.textContent = (lt / 1000).toFixed(2) + 's / ' + (dur / 1000).toFixed(2) + 's';
	}
	if (animPlaying) animRafId = requestAnimationFrame(animTick);
}

function renderAnimFrame(clip, elapsed) {
	const canvas = document.getElementById('anim-canvas');
	if (!canvas) return;
	const ctx = canvas.getContext('2d');
	if (!ctx) return;
	const d = animAssetData;
	const cc = currentAssetMeta ? currentAssetMeta.customColors : undefined;
	const entries = resolvePaletteEntries(d, cc);
	if (!entries) return;
	const props = sampleClip(clip, elapsed);
	const w = d.width, h = d.height;
	const pixels = d.pixels || (d.layers && d.layers[0] && d.layers[0].pixels);
	if (!pixels) return;
	const scale = Math.max(1, Math.floor(animMaxSize / Math.max(w, h)));
	const cw = w * scale, ch = h * scale;
	canvas.width = cw;
	canvas.height = ch;
	ctx.imageSmoothingEnabled = false;
	ctx.clearRect(0, 0, cw, ch);
	ctx.save();
	ctx.globalAlpha = Math.max(0, Math.min(1, props.opacity));
	const cx = cw / 2, cy = ch / 2;
	ctx.translate(cx + props.offsetX * scale, cy + props.offsetY * scale);
	if (props.rotation) ctx.rotate(props.rotation * Math.PI / 180);
	ctx.scale(props.scale, props.scale);
	ctx.translate(-cx, -cy);
	const rows = getPixelRows(d.encoding, pixels, h);
	drawPixelRows(ctx, rows, entries, w, h, scale, 0, 0);
	ctx.restore();
}

// ── Pixel Renderer ──

function resolvePaletteEntries(data, customColors) {
	let entries = null;
	if (typeof data.palette === 'object' && data.palette !== null && data.palette.entries) entries = data.palette.entries;
	else if (typeof data.palette === 'string' && paletteEntriesCache[data.palette]) entries = paletteEntriesCache[data.palette];
	if (entries && customColors && Object.keys(customColors).length > 0) {
		entries = Object.assign({}, entries, customColors);
	}
	return entries;
}

function hexToRgba(hex) {
	if (!hex || hex === 'transparent') return null;
	const h = hex.startsWith('#') ? hex.slice(1) : hex;
	if (h.length >= 6) {
		return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16), a: h.length >= 8 ? parseInt(h.slice(6, 8), 16) : 255 };
	}
	if (h.length === 3) {
		return { r: parseInt(h[0]+h[0],16), g: parseInt(h[1]+h[1],16), b: parseInt(h[2]+h[2],16), a: 255 };
	}
	return null;
}

function decodeRleRow(row) {
	const tokens = row.trim().split(/\\s+/);
	let result = '';
	for (const token of tokens) {
		if (!token) continue;
		const match = token.match(/^(\\d+)(.)$/);
		if (match) {
			result += match[2].repeat(parseInt(match[1], 10));
		}
	}
	return result;
}

function getPixelRows(encoding, pixels, height) {
	if (!pixels) return [];
	if (encoding === 'rle') return pixels.slice(0, height).map(r => decodeRleRow(r));
	return pixels.slice(0, height);
}

function drawPixelRows(ctx, rows, entries, w, h, scale, ox, oy) {
	for (let y = 0; y < h && y < rows.length; y++) {
		const row = rows[y];
		for (let x = 0; x < w && x < row.length; x++) {
			const rgba = hexToRgba(entries[row[x]]);
			if (rgba) {
				ctx.fillStyle = 'rgba(' + rgba.r + ',' + rgba.g + ',' + rgba.b + ',' + (rgba.a / 255) + ')';
				ctx.fillRect(ox + x * scale, oy + y * scale, scale, scale);
			}
		}
	}
}

function drawAsset(canvas, data, fileType, maxSize, customColors) {
	const ctx = canvas.getContext('2d');
	if (!ctx) return;
	maxSize = maxSize || 180;

	if (fileType === 'sprite') {
		const entries = resolvePaletteEntries(data, customColors);
		if (!entries) return drawPlaceholder(ctx, canvas, 'Sprite', data.name, maxSize);
		const w = data.width, h = data.height;
		if (!w || !h) return drawPlaceholder(ctx, canvas, 'Sprite', data.name, maxSize);
		const pixels = data.pixels || (data.layers && data.layers[0] && data.layers[0].pixels);
		if (!pixels) return drawPlaceholder(ctx, canvas, 'Sprite', data.name, maxSize);
		const rows = getPixelRows(data.encoding, pixels, h);
		const scale = Math.max(1, Math.floor(maxSize / Math.max(w, h)));
		canvas.width = w * scale;
		canvas.height = h * scale;
		ctx.imageSmoothingEnabled = false;
		drawPixelRows(ctx, rows, entries, w, h, scale, 0, 0);
	} else if (fileType === 'tileset') {
		const entries = resolvePaletteEntries(data, customColors);
		if (!entries || !data.tiles) return drawPlaceholder(ctx, canvas, 'Tileset', data.name, maxSize);
		const tileNames = Object.keys(data.tiles);
		const cols = Math.ceil(Math.sqrt(tileNames.length));
		const tileRows = Math.ceil(tileNames.length / cols);
		const tw = data.tileWidth, th = data.tileHeight;
		const scale = Math.max(1, Math.floor(maxSize / Math.max(cols * tw, tileRows * th)));
		canvas.width = cols * tw * scale;
		canvas.height = tileRows * th * scale;
		ctx.imageSmoothingEnabled = false;
		tileNames.forEach((name, i) => {
			const tile = data.tiles[name];
			const rows = getPixelRows(tile.encoding, tile.pixels, th);
			const col = i % cols, row = Math.floor(i / cols);
			drawPixelRows(ctx, rows, entries, tw, th, scale, col * tw * scale, row * th * scale);
		});
	} else if (fileType === 'palette') {
		const entries = Object.entries(data.entries || {});
		if (!entries.length) return;
		const cols = Math.ceil(Math.sqrt(entries.length));
		const rows = Math.ceil(entries.length / cols);
		const cell = Math.max(1, Math.floor(maxSize / Math.max(cols, rows)));
		canvas.width = cols * cell;
		canvas.height = rows * cell;
		entries.forEach(([, color], i) => {
			const col = i % cols, row = Math.floor(i / cols);
			const rgba = hexToRgba(color);
			if (rgba) {
				ctx.fillStyle = 'rgba(' + rgba.r + ',' + rgba.g + ',' + rgba.b + ',' + (rgba.a / 255) + ')';
				ctx.fillRect(col * cell, row * cell, cell, cell);
			} else {
				ctx.fillStyle = '#1c2128';
				ctx.fillRect(col * cell, row * cell, cell, cell);
				ctx.fillStyle = '#30363d';
				const half = cell / 2;
				ctx.fillRect(col * cell, row * cell, half, half);
				ctx.fillRect(col * cell + half, row * cell + half, half, half);
			}
		});
	} else {
		drawPlaceholder(ctx, canvas, fileType, data.name, maxSize);
	}
}

function drawPlaceholder(ctx, canvas, type, name, sz) {
	if (!ctx && canvas) {
		// Called with container element, not ctx
		canvas.innerHTML = '<div style="text-align:center;color:var(--text2);padding:20px"><strong>' + type + '</strong><br>' + (name || '') + '</div>';
		return;
	}
	canvas.width = sz; canvas.height = sz;
	ctx.fillStyle = '#161b22';
	ctx.fillRect(0, 0, sz, sz);
	ctx.fillStyle = '#8b949e';
	ctx.font = 'bold ' + Math.max(12, sz / 8) + 'px sans-serif';
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.fillText(type, sz / 2, sz / 2 - 10);
	if (name) {
		ctx.font = Math.max(10, sz / 12) + 'px sans-serif';
		ctx.fillText(name, sz / 2, sz / 2 + 14);
	}
}

// ── WebSocket ──

function connectWs() {
	const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
	const ws = new WebSocket(proto + '//' + location.host);
	const statusEl = document.getElementById('ws-status');

	ws.addEventListener('open', () => {
		statusEl.innerHTML = '<span class="dot"></span> connected';
		statusEl.classList.add('connected');
	});

	ws.addEventListener('close', () => {
		statusEl.innerHTML = '<span class="dot"></span> reconnecting...';
		statusEl.classList.remove('connected');
		setTimeout(connectWs, 2000);
	});

	ws.addEventListener('error', () => ws.close());

	ws.addEventListener('message', (e) => {
		try {
			const msg = JSON.parse(e.data);
			if (msg.type === 'asset-changed') {
				cachedAssetData = {};
				const hash = location.hash.slice(1) || 'gallery';
				if (hash === 'gallery') loadGallery();
				else if (hash === 'validate') loadValidation();
				else if (hash === 'palettes') loadPalettes();
				else if (hash.startsWith('asset/')) {
					loadAssetDetail(decodeURIComponent(hash.slice(6)));
				}
			} else if (msg.type === 'generate-start') {
				generatingFolders.add(msg.folder);
				updateGallerySpinners();
				// If viewing this asset, show inline status
				if (currentAssetFolder === msg.folder) {
					showGenStatus('Generating view "' + msg.viewName + '"...', false);
				}
			} else if (msg.type === 'generate-complete') {
				generatingFolders.delete(msg.folder);
				updateGallerySpinners();
				// If viewing this asset, update status and reload
				if (currentAssetFolder === msg.folder) {
					if (msg.success) {
						showGenStatus('View "' + msg.viewName + '" generated successfully!', true);
						setTimeout(() => loadAssetDetail(currentAssetFolder), 500);
					} else {
						showGenStatus('Generation failed: ' + (msg.error || 'Unknown error'), true);
					}
				}
				// Refresh gallery if visible
				const hash = location.hash.slice(1) || 'gallery';
				if (hash === 'gallery') loadGallery();
			}
		} catch { /* ignore */ }
	});
}

// ── Gallery Spinner Update (in-place, no full re-render) ──

function updateGallerySpinners() {
	const el = document.getElementById('view-gallery');
	if (!el) return;
	el.querySelectorAll('.asset-card[data-folder]').forEach(card => {
		const folder = card.dataset.folder;
		const isGen = generatingFolders.has(folder);
		const hasClass = card.classList.contains('card-generating');
		if (isGen && !hasClass) {
			card.classList.add('card-generating');
			const spinner = document.createElement('div');
			spinner.className = 'card-gen-spinner';
			spinner.innerHTML = '<div class="spinner"></div><span class="gen-label">Generating...</span>';
			card.prepend(spinner);
		} else if (!isGen && hasClass) {
			card.classList.remove('card-generating');
			const sp = card.querySelector('.card-gen-spinner');
			if (sp) sp.remove();
		}
	});
}

function showGenStatus(msg, done) {
	const output = document.getElementById('gen-output');
	if (!output) return;
	output.classList.add('visible');
	output.textContent = msg;
	if (done) {
		const btn = document.getElementById('gen-submit');
		if (btn) { btn.disabled = false; btn.textContent = 'Generate View'; }
	}
}

// ── Utility ──

function esc(s) {
	return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Init ──

connectWs();
preloadPalettes().then(() => onHashChange());
`;
}
