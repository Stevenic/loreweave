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
	<a href="#generate" class="nav-link" data-view="generate">Generate</a>
	<div class="nav-spacer"></div>
	<div class="nav-status" id="ws-status">disconnected</div>
</nav>
<main id="main">
	<section id="view-gallery" class="view active"></section>
	<section id="view-palettes" class="view"></section>
	<section id="view-validate" class="view"></section>
	<section id="view-generate" class="view"></section>
	<section id="view-detail" class="view"></section>
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

/* Badges */
.badge{font-size:11px;padding:1px 6px;border-radius:10px;font-weight:500}
.badge-sprite{background:#1a3a4a;color:var(--cyan)}
.badge-tileset{background:#2a1a3a;color:var(--magenta)}
.badge-tilemap{background:#1a2a3a;color:var(--accent)}
.badge-scene{background:#2a2a1a;color:var(--orange)}
.badge-palette{background:#1a2a1a;color:var(--accent2)}
.badge-emitter{background:#2a1a1a;color:var(--red)}
.dims{font-size:11px;color:var(--text2)}

/* Detail view */
.detail-back{background:none;border:none;color:var(--accent);cursor:pointer;font-size:14px;padding:4px 0;margin-bottom:12px;display:inline-flex;align-items:center;gap:4px}
.detail-back:hover{text-decoration:underline}
.detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px}
@media(max-width:900px){.detail-grid{grid-template-columns:1fr}}
.detail-preview{background:var(--bg2);border:1px solid var(--border);border-radius:8px;display:flex;align-items:center;justify-content:center;padding:24px;min-height:240px}
.detail-preview canvas{image-rendering:pixelated;max-width:100%;max-height:360px}
.detail-info h3{margin-bottom:12px}
.detail-props{display:grid;grid-template-columns:auto 1fr;gap:4px 12px;font-size:13px}
.detail-props dt{color:var(--text2)}
.detail-props dd{color:var(--text)}
.detail-json{margin-top:20px;grid-column:1/-1}
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

/* Generate */
.gen-form{max-width:600px}
.gen-form label{display:block;font-size:13px;font-weight:600;margin-bottom:4px;margin-top:16px}
.gen-form label:first-child{margin-top:0}
.gen-form textarea{width:100%;min-height:100px;background:var(--bg3);border:1px solid var(--border);border-radius:6px;padding:10px;color:var(--text);font-size:14px;resize:vertical;font-family:inherit}
.gen-form textarea:focus{outline:none;border-color:var(--accent)}
.gen-form select{background:var(--bg3);border:1px solid var(--border);border-radius:6px;padding:8px 12px;color:var(--text);font-size:14px;width:100%}
.gen-btn{margin-top:20px;background:#238636;border:1px solid #2ea043;border-radius:6px;padding:10px 24px;font-size:14px;font-weight:600;color:#fff;cursor:pointer;transition:opacity .15s}
.gen-btn:hover{opacity:.85}
.gen-btn:disabled{opacity:.5;cursor:not-allowed}
.gen-output{margin-top:24px;background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:16px;font-size:13px;white-space:pre-wrap;font-family:monospace;max-height:400px;overflow:auto;display:none}
.gen-output.visible{display:block}
.gen-sizing-hint{font-size:12px;color:var(--cyan);margin-top:6px;min-height:18px;font-family:monospace}

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

/* Spinner */
.spinner{display:inline-block;width:16px;height:16px;border:2px solid var(--border);border-top-color:var(--accent);border-radius:50%;animation:spin .6s linear infinite;vertical-align:middle}
@keyframes spin{to{transform:rotate(360deg)}}
.loading{text-align:center;padding:40px;color:var(--text2)}
`;
}

export function getAppJs(): string {
	return `'use strict';

// ── State ──
let allAssets = {};
let totalAssets = 0;
let currentFilter = 'all';
let cachedAssetData = {};
let paletteEntriesCache = {}; // palette name → entries object

// ── Animation State ──
let animPlaying = false;
let animLoop = true;
let animClipName = null;
let animStartTime = 0;
let animRafId = null;
let animAssetData = null;
let animAssetType = null;
let animMaxSize = 320;

// ── Palette Preloader ──

async function preloadPalettes() {
	try {
		const data = await api('/api/palettes');
		const pals = data.palettes || [];
		for (const p of pals) {
			try {
				const asset = await fetchAsset(p.path);
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
	if (hash.startsWith('detail/')) {
		navigate('detail');
		loadDetail(decodeURIComponent(hash.slice(7)));
	} else {
		stopAnimation();
		navigate(hash);
		if (hash === 'gallery') loadGallery();
		else if (hash === 'validate') loadValidation();
		else if (hash === 'palettes') loadPalettes();
		else if (hash === 'generate') initGenerate();
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
		allAssets = data.assets || {};
		totalAssets = data.total || 0;
		renderGallery();
	} catch {
		el.innerHTML = '<div class="loading">Failed to load assets.</div>';
	}
}

function renderGallery() {
	const el = document.getElementById('view-gallery');
	const types = Object.keys(allAssets).sort();

	let filtered = [];
	if (currentFilter === 'all') {
		for (const t of types) filtered.push(...allAssets[t].map(a => ({ ...a, type: t })));
	} else if (allAssets[currentFilter]) {
		filtered = allAssets[currentFilter].map(a => ({ ...a, type: currentFilter }));
	}

	let html = '<div class="view-header"><h1>Asset Gallery</h1><span class="count">' + totalAssets + ' assets</span></div>';

	// Filter tabs
	html += '<div class="filter-bar">';
	html += filterBtn('all', 'All');
	for (const t of types) html += filterBtn(t, t + ' (' + allAssets[t].length + ')');
	html += '</div>';

	// Grid
	html += '<div class="asset-grid">';
	for (const a of filtered) {
		const fname = a.relativePath.split('/').pop();
		html += '<div class="asset-card" data-path="' + esc(a.relativePath) + '">'
			+ '<div class="card-preview"><canvas width="64" height="64"></canvas></div>'
			+ '<div class="card-info">'
			+ '<div class="card-name">' + esc(fname) + '</div>'
			+ '<div class="card-meta"><span class="badge badge-' + a.type + '">' + a.type + '</span></div>'
			+ '</div></div>';
	}
	if (!filtered.length) html += '<div class="loading">No assets found.</div>';
	html += '</div>';
	el.innerHTML = html;

	// Bind events
	el.querySelectorAll('.filter-btn').forEach(btn =>
		btn.addEventListener('click', () => { currentFilter = btn.dataset.filter; renderGallery(); })
	);
	el.querySelectorAll('.asset-card').forEach(card =>
		card.addEventListener('click', () => { location.hash = 'detail/' + encodeURIComponent(card.dataset.path); })
	);

	// Render thumbnails
	el.querySelectorAll('.asset-card').forEach(card => {
		const path = card.dataset.path;
		const canvas = card.querySelector('canvas');
		renderThumbnail(canvas, path);
	});
}

function filterBtn(val, label) {
	return '<button class="filter-btn' + (currentFilter === val ? ' active' : '') + '" data-filter="' + val + '">' + esc(label) + '</button>';
}

async function renderThumbnail(canvas, relPath) {
	try {
		const data = await fetchAsset(relPath);
		drawAsset(canvas, data.data, data.fileType, 180);
	} catch { /* skip */ }
}

// ── Detail ──

async function loadDetail(relPath) {
	const el = document.getElementById('view-detail');
	el.innerHTML = '<div class="loading"><div class="spinner"></div> Loading...</div>';
	try {
		const asset = await fetchAsset(relPath);
		renderDetail(el, asset);
	} catch {
		el.innerHTML = '<div class="loading">Failed to load asset.</div>';
	}
}

function renderDetail(el, asset) {
	const d = asset.data;
	const type = asset.fileType;
	const json = JSON.stringify(d, null, 2);

	let propsHtml = '';
	if (type === 'sprite') {
		propsHtml = prop('Name', d.name) + prop('Size', d.width + 'x' + d.height)
			+ prop('Encoding', d.encoding) + prop('Frames', d.frameCount || 1)
			+ (d.layers ? prop('Layers', d.layers.length) : '')
			+ (d.clips ? prop('Clips', Object.keys(d.clips).join(', ')) : '')
			+ (d.tags ? prop('Tags', d.tags.join(', ')) : '');
	} else if (type === 'tileset') {
		propsHtml = prop('Name', d.name) + prop('Tile Size', d.tileWidth + 'x' + d.tileHeight)
			+ prop('Tiles', Object.keys(d.tiles).length);
	} else if (type === 'tilemap') {
		propsHtml = prop('Name', d.name) + prop('Grid', d.gridWidth + 'x' + d.gridHeight)
			+ prop('Tileset', d.tileset);
	} else if (type === 'scene') {
		propsHtml = prop('Name', d.name) + prop('Canvas', d.canvas.width + 'x' + d.canvas.height)
			+ prop('Layers', d.layers.length)
			+ (d.canvas.background ? prop('Background', d.canvas.background) : '');
	} else if (type === 'palette') {
		propsHtml = prop('Name', d.name || '(unnamed)') + prop('Entries', Object.keys(d.entries).length)
			+ (d.aliases ? prop('Aliases', Object.keys(d.aliases).length) : '')
			+ (d.ramps ? prop('Ramps', Object.keys(d.ramps).join(', ')) : '');
	} else if (type === 'emitter') {
		propsHtml = prop('Name', d.name) + prop('Rate', d.rate + '/sec')
			+ (d.sprite ? prop('Sprite', d.sprite) : '')
			+ prop('Max Particles', d.maxParticles || 100);
	}

	// Stop any previous animation
	stopAnimation();
	animAssetData = null;
	animClipName = null;

	const clipNames = (type === 'sprite' && d.clips) ? Object.keys(d.clips) : [];
	let animHtml = '';
	if (clipNames.length > 0) {
		animHtml = '<div class="anim-controls" id="anim-controls">'
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
			+ '<span class="anim-time" id="anim-time">0.00s / 0.00s</span>'
			+ '</div>';
	}

	el.innerHTML =
		'<button class="detail-back" id="detail-back-btn">&#8592; Back to Gallery</button>'
		+ '<div class="view-header"><h1>' + esc(d.name || asset.path) + '</h1>'
		+ '<span class="badge badge-' + type + '">' + type + '</span></div>'
		+ '<div class="detail-grid">'
		+ '<div><div class="detail-preview" id="detail-canvas-box"></div>' + animHtml + '</div>'
		+ '<div class="detail-info"><h3>Properties</h3><dl class="detail-props">' + propsHtml + '</dl></div>'
		+ '<div class="detail-json"><h3>JSON</h3><pre>' + esc(json) + '</pre></div>'
		+ '</div>';

	document.getElementById('detail-back-btn').addEventListener('click', () => {
		stopAnimation();
		location.hash = 'gallery';
	});

	// Render large preview
	const box = document.getElementById('detail-canvas-box');
	if (type === 'palette') {
		renderPaletteSwatches(box, d);
	} else {
		const canvas = document.createElement('canvas');
		canvas.id = 'anim-canvas';
		drawAsset(canvas, d, type, 320);
		box.appendChild(canvas);
	}

	// Wire up animation controls
	if (clipNames.length > 0) {
		animAssetData = d;
		animClipName = clipNames[0];
		const dur = d.clips[animClipName].duration;
		const timeEl = document.getElementById('anim-time');
		if (timeEl) timeEl.textContent = '0.00s / ' + (dur / 1000).toFixed(2) + 's';

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
				const dur = d.clips[animClipName].duration;
				const timeEl = document.getElementById('anim-time');
				if (timeEl) timeEl.textContent = '0.00s / ' + (dur / 1000).toFixed(2) + 's';
				const fill = document.getElementById('anim-progress-fill');
				if (fill) fill.style.width = '0';
				// Reset canvas to static
				const canvas = document.getElementById('anim-canvas');
				if (canvas) drawAsset(canvas, d, type, 320);
				if (wasPlaying) startAnimation();
			});
		}

		const progressBar = document.getElementById('anim-progress');
		if (progressBar) {
			progressBar.addEventListener('click', function(e) {
				const rect = this.getBoundingClientRect();
				const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
				const clip = d.clips[animClipName];
				if (!clip) return;
				const seekTime = pct * clip.duration;
				// Render this frame statically
				renderAnimFrame(clip, seekTime);
				const fill = document.getElementById('anim-progress-fill');
				if (fill) fill.style.width = (pct * 100) + '%';
				const timeEl = document.getElementById('anim-time');
				if (timeEl) timeEl.textContent = (seekTime / 1000).toFixed(2) + 's / ' + (clip.duration / 1000).toFixed(2) + 's';
				// If playing, restart from this point
				if (animPlaying) {
					animStartTime = performance.now() - seekTime;
				}
			});
		}
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
	// Load full data for each palette
	const loaded = [];
	for (const p of paletteList) {
		try {
			const asset = await fetchAsset(p.path);
			loaded.push({ ...p, data: asset.data });
		} catch {
			loaded.push({ ...p, data: null });
		}
	}

	// Sort by entry count descending for the superset chain view
	loaded.sort((a, b) => a.entryCount - b.entryCount);

	let html = '<div class="view-header"><h1>Palettes</h1><span class="count">' + loaded.length + ' palettes</span></div>';
	html += '<div class="palette-grid">';

	for (const p of loaded) {
		html += '<div class="palette-card"><h3>' + esc(p.name) + '</h3>';
		html += '<div class="pal-count">' + p.entryCount + ' entries</div>';

		if (p.data && p.data.entries) {
			// Swatches
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

			// Ramps
			if (p.data.ramps) {
				const rampEntries = Object.entries(p.data.ramps);
				if (rampEntries.length) {
					html += '<div class="ramp-section"><h4>Ramps</h4>';
					for (const [name, keys] of rampEntries) {
						html += '<div class="ramp-row"><span class="ramp-label">' + esc(name) + '</span>';
						for (const k of keys) {
							const c = p.data.entries[k] || 'transparent';
							const bg = c === 'transparent' ? 'transparent' : c;
							html += '<div class="ramp-swatch" style="background:' + bg + '" title="' + esc(k + '=' + c) + '"></div>';
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

	// Summary cards
	html += '<div class="val-summary">';
	html += '<div class="val-stat"><div class="num">' + s.total + '</div><div class="label">Total</div></div>';
	html += '<div class="val-stat pass"><div class="num">' + s.passed + '</div><div class="label">Passed</div></div>';
	html += '<div class="val-stat fail"><div class="num">' + s.failed + '</div><div class="label">Failed</div></div>';
	html += '<div class="val-stat warn"><div class="num">' + s.warnings + '</div><div class="label">Warnings</div></div>';
	html += '</div>';

	// Results list
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

	// Expand/collapse
	el.querySelectorAll('.val-item-header.clickable').forEach(h =>
		h.addEventListener('click', () => h.closest('.val-item').classList.toggle('expanded'))
	);
}

// ── Sprite Archetypes (client-side mirror of @loreweave/pixel/sizing) ──

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

// ── Generate ──

let generateInitialized = false;
function initGenerate() {
	const el = document.getElementById('view-generate');
	if (generateInitialized) return;
	generateInitialized = true;

	el.innerHTML =
		'<div class="view-header"><h1>Generate</h1></div>'
		+ '<div class="gen-form">'
		+ '<label>Prompt</label>'
		+ '<textarea id="gen-prompt" placeholder="A warrior holding a sword, facing right..."></textarea>'
		+ '<label>Detail Level</label>'
		+ '<select id="gen-detail">'
		+ '<option value="low">Low (16 PPU) \u2014 retro, chunky pixels</option>'
		+ '<option value="standard" selected>Standard (32 PPU) \u2014 classic pixel art</option>'
		+ '<option value="high">High (64 PPU) \u2014 detailed, smooth</option>'
		+ '</select>'
		+ '<div class="gen-sizing-hint" id="gen-sizing-hint"></div>'
		+ '<label>Asset Type</label>'
		+ '<select id="gen-type"><option value="sprite">Sprite</option><option value="tileset">Tileset</option><option value="tilemap">Tilemap</option><option value="scene">Scene</option></select>'
		+ '<label>Palette</label>'
		+ '<select id="gen-palette"><option value="">Default (fantasy32)</option></select>'
		+ '<label>Model</label>'
		+ '<select id="gen-model">'
		+ '<option value="">Default (from env or SDK default)</option>'
		+ '<option value="claude-sonnet-4-5-20250929">Sonnet 4.5</option>'
		+ '<option value="claude-sonnet-4-6-20250514">Sonnet 4.6</option>'
		+ '<option value="claude-haiku-4-5-20251001">Haiku 4.5</option>'
		+ '<option value="claude-opus-4-6-20250514">Opus 4.6</option>'
		+ '</select>'
		+ '<button class="gen-btn" id="gen-submit">Generate</button>'
		+ '</div>'
		+ '<div class="gen-output" id="gen-output"></div>';

	// Sizing hint — updates as user types prompt or changes detail level
	const sizingHint = document.getElementById('gen-sizing-hint');
	function updateSizingHint() {
		const prompt = document.getElementById('gen-prompt').value.trim();
		const detail = document.getElementById('gen-detail').value;
		if (!prompt) { sizingHint.textContent = ''; return; }
		const archetype = inferArchetypeClient(prompt);
		const ppu = { low: 16, standard: 32, high: 64 }[detail] || 32;
		const w = Math.round(archetype.worldWidth * ppu);
		const h = Math.round(archetype.worldHeight * ppu);
		sizingHint.textContent = 'Auto-sized: ' + archetype.label + ' \\u2192 ' + w + '\\u00d7' + h + ' px at ' + ppu + ' PPU';
	}
	document.getElementById('gen-prompt').addEventListener('input', updateSizingHint);
	document.getElementById('gen-detail').addEventListener('change', updateSizingHint);

	// Load palette options
	api('/api/palettes').then(data => {
		const sel = document.getElementById('gen-palette');
		for (const p of (data.palettes || [])) {
			const opt = document.createElement('option');
			opt.value = p.path;
			opt.textContent = p.name + ' (' + p.entryCount + ' colors)';
			sel.appendChild(opt);
		}
	}).catch(() => {});

	document.getElementById('gen-submit').addEventListener('click', runGenerate);
}

async function runGenerate() {
	const prompt = document.getElementById('gen-prompt').value.trim();
	if (!prompt) return;
	const type = document.getElementById('gen-type').value;
	const detailLevel = document.getElementById('gen-detail').value;
	const palette = document.getElementById('gen-palette').value || undefined;
	const model = document.getElementById('gen-model').value || undefined;
	const btn = document.getElementById('gen-submit');
	const output = document.getElementById('gen-output');

	btn.disabled = true;
	btn.innerHTML = '<span class="spinner"></span> Generating...';
	output.classList.add('visible');
	output.textContent = 'Generating... This may take a minute.';

	try {
		const data = await api('/api/generate', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ prompt, type, detailLevel, palette, model }),
		});
		if (data.error) {
			output.textContent = 'Error: ' + data.error + (data.details ? '\\n\\nDetails:\\n' + data.details : '');
		} else {
			let msg = data.result || 'Done. Asset generated successfully.';
			if (data.sizing) {
				msg += '\\n\\nSizing: ' + data.sizing.archetype + ' \\u2192 ' + data.sizing.width + '\\u00d7' + data.sizing.height + ' px (PPU ' + data.sizing.ppu + ')';
			}
			output.textContent = msg;
			cachedAssetData = {};
		}
	} catch (e) {
		output.textContent = 'Request failed: ' + e.message;
	} finally {
		btn.disabled = false;
		btn.textContent = 'Generate';
	}
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
	// Find surrounding keyframes
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
	return elapsed % duration; // loop (default)
}

function sampleClip(clip, elapsed) {
	const playback = clip.playback || 'loop';
	const localTime = computeClipTime(elapsed, clip.duration, playback);
	const props = { frame: 0, offsetX: 0, offsetY: 0, rotation: 0, scale: 1, opacity: 1 };
	if (localTime === null) {
		// Finished — use last keyframe values
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

	// For non-looping, check if finished
	if (!animLoop && playback === 'once' && elapsed >= clip.duration) {
		renderAnimFrame(clip, clip.duration);
		stopAnimation();
		return;
	}
	// For looping override: force loop behavior regardless of clip playback setting
	const effectiveElapsed = animLoop ? elapsed : Math.min(elapsed, clip.duration);

	renderAnimFrame(clip, effectiveElapsed);

	// Update progress bar
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
	const entries = resolvePaletteEntries(d);
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

	// Clear
	ctx.clearRect(0, 0, cw, ch);

	// Apply transforms
	ctx.save();
	ctx.globalAlpha = Math.max(0, Math.min(1, props.opacity));
	const cx = cw / 2, cy = ch / 2;
	ctx.translate(cx + props.offsetX * scale, cy + props.offsetY * scale);
	if (props.rotation) ctx.rotate(props.rotation * Math.PI / 180);
	ctx.scale(props.scale, props.scale);
	ctx.translate(-cx, -cy);

	// Draw pixels
	const rows = getPixelRows(d.encoding, pixels, h);
	drawPixelRows(ctx, rows, entries, w, h, scale, 0, 0);
	ctx.restore();
}

// ── Pixel Renderer ──

function resolvePaletteEntries(data) {
	if (typeof data.palette === 'object' && data.palette !== null && data.palette.entries) return data.palette.entries;
	if (typeof data.palette === 'string' && paletteEntriesCache[data.palette]) return paletteEntriesCache[data.palette];
	return null;
}

function hexToRgba(hex) {
	if (!hex || hex === 'transparent') return null;
	const h = hex.startsWith('#') ? hex.slice(1) : hex;
	if (h.length >= 6) {
		return {
			r: parseInt(h.slice(0, 2), 16),
			g: parseInt(h.slice(2, 4), 16),
			b: parseInt(h.slice(4, 6), 16),
			a: h.length >= 8 ? parseInt(h.slice(6, 8), 16) : 255
		};
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

function drawAsset(canvas, data, fileType, maxSize) {
	const ctx = canvas.getContext('2d');
	if (!ctx) return;
	maxSize = maxSize || 180;

	if (fileType === 'sprite') {
		const entries = resolvePaletteEntries(data);
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
		const entries = resolvePaletteEntries(data);
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

// ── Asset data cache ──

async function fetchAsset(relPath) {
	if (cachedAssetData[relPath]) return cachedAssetData[relPath];
	const data = await api('/api/asset?path=' + encodeURIComponent(relPath));
	cachedAssetData[relPath] = data;
	return data;
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
				// Invalidate cache for changed file
				for (const key of Object.keys(cachedAssetData)) {
					if (key === msg.path || msg.path.endsWith(key) || key.endsWith(msg.path)) {
						delete cachedAssetData[key];
					}
				}
				// Refresh current view
				const hash = location.hash.slice(1) || 'gallery';
				if (hash === 'gallery') loadGallery();
				else if (hash === 'validate') loadValidation();
				else if (hash === 'palettes') loadPalettes();
				else if (hash.startsWith('detail/')) {
					loadDetail(decodeURIComponent(hash.slice(7)));
				}
			}
		} catch { /* ignore */ }
	});
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
