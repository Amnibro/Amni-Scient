import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import init, { compute_all, version } from './pkg/amni_life.js';
const DEFAULT_KIND_COLORS = { person:'#7cc4ff', place:'#7be0a4', event:'#ffb060', work:'#cc8cff', idea:'#f5c842', era:'#dccdb1' };
const DEFAULT_KIND_SIZE = { person:1.0, place:1.0, event:1.0, work:1.05, idea:1.0, era:1.9 };
const CUSTOM_KINDS_KEY = 'amni-life-custom-kinds';
let customKinds = [];
try { customKinds = JSON.parse(localStorage.getItem(CUSTOM_KINDS_KEY) || '[]'); } catch {}
let KIND_COLORS = { ...DEFAULT_KIND_COLORS };
let KIND_SIZE = { ...DEFAULT_KIND_SIZE };
function rebuildKindMaps() {
    KIND_COLORS = { ...DEFAULT_KIND_COLORS };
    KIND_SIZE = { ...DEFAULT_KIND_SIZE };
    for (const k of customKinds) { KIND_COLORS[k.name] = k.color; KIND_SIZE[k.name] = k.size || 1.0; }
}
rebuildKindMaps();
function saveCustomKinds() { try { localStorage.setItem(CUSTOM_KINDS_KEY, JSON.stringify(customKinds)); } catch {} }
function allKinds() { return [...Object.keys(DEFAULT_KIND_COLORS), ...customKinds.map(k => k.name)]; }
const STORAGE_KEY = 'amni-life-map-v1';
const VIEW_KEY = 'amni-life-view-v1';
const THEME_KEY = 'amni-life-theme';
const BUILTIN_THEMES = ['dark','light','sepia','midnight','solarized','nord','forest','sunset'];
const CUSTOM_THEMES_KEY = 'amni-life-custom-themes';
let customThemes = [];
try { customThemes = JSON.parse(localStorage.getItem(CUSTOM_THEMES_KEY) || '[]'); } catch {}
let THEMES = [...BUILTIN_THEMES, ...customThemes.map(t => t.name)];
function injectCustomThemeStyles() {
    let style = document.getElementById('custom-theme-styles');
    if (!style) { style = document.createElement('style'); style.id = 'custom-theme-styles'; document.head.appendChild(style); }
    style.textContent = customThemes.map(t => `html[data-theme="${t.name}"]{--bg:${t.bg};--bg2:${t.bg2};--fg:${t.fg};--dim:${t.dim};--accent:${t.accent};--accent2:${t.accent2};--border:rgba(255,255,255,0.08);--panel:${t.bg2}cc;--shadow:0 10px 40px rgba(0,0,0,0.55);--scene:${t.bg};--fog:0.012;--canvas-mul:1.0}`).join('');
}
injectCustomThemeStyles();
function saveCustomThemes() { try { localStorage.setItem(CUSTOM_THEMES_KEY, JSON.stringify(customThemes)); } catch {} THEMES = [...BUILTIN_THEMES, ...customThemes.map(t => t.name)]; injectCustomThemeStyles(); }
const SCALE = 1.6;
const LERP_FRAMES = 60;
const CAM_FRAMES = 45;
const PICK_PIXELS = 28;
const MEDIA_DB = 'amni-life-media';
const MEDIA_STORE = 'blobs';
const MAX_TAG_CHIPS = 14;
let scene, camera, renderer, controls, raycaster, mouse;
let pointsMesh = null, edgesMesh = null;
let positions = {}, currentView = 'constellation';
let fragments = [], idToIdx = new Map(), edges = [];
let lerpSrc = null, lerpDst = null, lerpT = 1.0;
let camSrc = null, camDst = null, camTgtSrc = null, camTgtDst = null, camT = 1.0;
let selectedIdx = -1, hoveredIdx = -1;
let showEdges = true, autoSpin = true;
let activeKinds = new Set([...Object.keys(DEFAULT_KIND_COLORS), ...customKinds.map(k => k.name)]);
let activeTags = new Set();
let editingId = null, linkingFrom = null, sharing = false;
let dbHandle = null;
let mediaURLCache = new Map();
let yearMin = 1900, yearMax = 2100, activeYearMin = 1900, activeYearMax = 2100;
let lightboxItems = [], lightboxIdx = 0;
let installPromptEvent = null;
let tourTimer = null, tourQueue = [], tourIdx = 0, tourPrevSpin = true;
const EDGE_TYPES = ['with','at','inspired-by','part-of'];
let activeEdgeTypes = new Set(EDGE_TYPES);
let linking = null;
const UNDO_LIMIT = 30;
let undoStack = [], redoStack = [], lastSnapshot = null;
let narrating = false;
let focusMode = false;
let scrubYear = null, scrubActive = false, scrubPlaying = false, scrubPlayTimer = null, scrubSpeedIdx = 0;
const SCRUB_SPEEDS = [400,150,60];
const FRAG_TEMPLATES = [{label:'⚡ Moment',kind:'event',tags:'memory'},{label:'👤 Person',kind:'person',tags:'people'},{label:'📍 Place',kind:'place',tags:'travel'},{label:'🏆 Milestone',kind:'event',tags:'milestone'},{label:'🎨 Work',kind:'work',tags:'creative'},{label:'💡 Idea',kind:'idea',tags:'insight'},{label:'📅 Era',kind:'era',tags:''}];
let multiSelected = new Set();
let pathHighlight = new Set(), pathEdges = new Set();
const WELCOME_KEY = 'amni-life-welcome-v1';
const SOUND_KEY = 'amni-life-sound';
let soundEnabled = (localStorage.getItem(SOUND_KEY) || 'off') === 'on';
let audioCtx = null;
const HOVER_LABEL_RADIUS = 140;
const HOVER_LABEL_MAX = 8;
let hoverLabelPool = [];
const PERSISTENT_LABEL_KEY = 'amni-life-persistent-labels';
let persistentLabels = localStorage.getItem(PERSISTENT_LABEL_KEY) === '1';
let persistentLabelPool = [];
const DOT_SIZE_KEY = 'amni-life-dot-size';
let userDotSize = parseFloat(localStorage.getItem(DOT_SIZE_KEY) || '1.0') || 1.0;
const OTD_DISMISS_KEY = 'amni-life-otd-dismissed-date';
const PROMPT_DISMISS_KEY = 'amni-life-prompt-dismissed-date';
const PROMPT_INDEX_KEY = 'amni-life-prompt-index';
const DAILY_PROMPTS = [
    "A moment this week that surprised you.",
    "Someone you thought of today, who didn't know it.",
    "A place you've never described in words.",
    "Something you'd like to remember in ten years.",
    "A taste, a smell, a sound from your childhood.",
    "A book / song / film that reshaped you.",
    "The last time you felt fully present.",
    "A small kindness you witnessed.",
    "Something you used to believe.",
    "A risk that paid off.",
    "A conversation you replay.",
    "The view from your favorite window.",
    "A thing your hands learned to do.",
    "An ordinary Tuesday you want to keep.",
    "Someone who changed how you think.",
    "A skill you've grown into without noticing.",
    "What today felt like.",
    "A stranger who stayed with you.",
    "A piece of advice you actually used.",
    "Where you go when you need to be quiet."
];
let revealing = false, revealTimer = null;
let moodOverlay = false;
const MOOD_COLORS = { '-2':'#cc4060', '-1':'#d28080', '0':'#aaaaaa', '1':'#7bb88a', '2':'#5fd47b' };
const TOUR_SPEED_KEY = 'amni-life-tour-speed';
let tourStepMs = parseInt(localStorage.getItem(TOUR_SPEED_KEY) || '4200', 10) || 4200;
const $ = id => document.getElementById(id);
const tooltip = $('tooltip'), statsEl = $('stats');
const ease = t => t < 0.5 ? 2*t*t : -1+(4-2*t)*t;
function toast(msg, ms = 2200) {
    const t = $('toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), ms);
}
function loadFragments() {
    try { const s = localStorage.getItem(STORAGE_KEY); if (s) return JSON.parse(s).fragments || []; } catch {}
    return null;
}
function snapshot() { return JSON.stringify({ fragments }); }
function pushUndo(label = 'edit') {
    if (lastSnapshot !== null) {
        undoStack.push({ s: lastSnapshot, label });
        if (undoStack.length > UNDO_LIMIT) undoStack.shift();
        snd('save');
    }
    lastSnapshot = snapshot();
    redoStack = [];
}
async function restoreSnapshot(s) {
    const parsed = JSON.parse(s);
    fragments = parsed.fragments || [];
    lastSnapshot = s;
    try { localStorage.setItem(STORAGE_KEY, s); } catch {}
    rebuildIndex(); recomputeYearBounds();
    await computeLayouts();
    buildPoints(); buildEdges(); buildTimelineAxis();
    renderFragsList(); renderTagFilters(); renderEdgeFilters();
    if (selectedIdx >= fragments.length) selectFragment(-1);
    else if (selectedIdx >= 0) selectFragment(selectedIdx);
    updateStats();
}
async function undo() {
    if (undoStack.length === 0) { toast('Nothing to undo'); snd('error'); return; }
    const top = undoStack.pop();
    redoStack.push({ s: lastSnapshot, label: top.label });
    if (redoStack.length > UNDO_LIMIT) redoStack.shift();
    try { await restoreSnapshot(top.s); snd('undo'); toast(`Undone: ${top.label} · ${undoStack.length} more`); }
    catch (err) { toast('Undo failed: ' + err.message); snd('error'); }
}
async function redo() {
    if (redoStack.length === 0) { toast('Nothing to redo'); return; }
    const top = redoStack.pop();
    undoStack.push({ s: lastSnapshot, label: top.label });
    try { await restoreSnapshot(top.s); toast(`Redone: ${top.label} · ${redoStack.length} more`); }
    catch (err) { toast('Redo failed: ' + err.message); }
}
function saveFragments() {
    pushUndo('edit');
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ fragments })); } catch {}
}
async function fetchSample() {
    const r = await fetch('./data/sample_life.json');
    const j = await r.json();
    return j.fragments;
}
function openMediaDB() {
    return new Promise((res, rej) => {
        const r = indexedDB.open(MEDIA_DB, 1);
        r.onupgradeneeded = () => { r.result.createObjectStore(MEDIA_STORE); };
        r.onsuccess = () => res(r.result);
        r.onerror = () => rej(r.error);
    });
}
async function mediaPut(id, blob) {
    const tx = dbHandle.transaction(MEDIA_STORE, 'readwrite');
    tx.objectStore(MEDIA_STORE).put(blob, id);
    return new Promise(res => { tx.oncomplete = () => res(); tx.onerror = () => res(); });
}
async function mediaGet(id) {
    return new Promise(res => {
        const r = dbHandle.transaction(MEDIA_STORE, 'readonly').objectStore(MEDIA_STORE).get(id);
        r.onsuccess = () => res(r.result || null);
        r.onerror = () => res(null);
    });
}
async function mediaDelete(id) {
    const tx = dbHandle.transaction(MEDIA_STORE, 'readwrite');
    tx.objectStore(MEDIA_STORE).delete(id);
    if (mediaURLCache.has(id)) { URL.revokeObjectURL(mediaURLCache.get(id)); mediaURLCache.delete(id); }
}
async function mediaURL(id) {
    if (mediaURLCache.has(id)) return mediaURLCache.get(id);
    const blob = await mediaGet(id); if (!blob) return null;
    const u = URL.createObjectURL(blob); mediaURLCache.set(id, u); return u;
}
function rebuildIndex() {
    idToIdx = new Map();
    fragments.forEach((f, i) => idToIdx.set(f.id, i));
    edges = [];
    fragments.forEach((f, i) => (f.connections || []).forEach(c => {
        const j = idToIdx.get(c.to);
        if (j !== undefined) edges.push({ s: i, t: j, type: c.type || 'with' });
    }));
}
function newId() {
    let n = 1;
    while (idToIdx.has('f' + String(n).padStart(2, '0'))) n++;
    return 'f' + String(n).padStart(2, '0');
}
function dayKey(ts) { const d = new Date(ts); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function activityByDay() {
    const m = new Map();
    fragments.forEach(f => { if (f.addedAt) m.set(dayKey(f.addedAt), (m.get(dayKey(f.addedAt)) || 0) + 1); });
    return m;
}
function computeStreak() {
    const days = activityByDay();
    if (days.size === 0) return 0;
    let streak = 0;
    const today = new Date();
    today.setHours(0,0,0,0);
    for (let i = 0; i < 365; i++) {
        const d = new Date(today); d.setDate(today.getDate() - i);
        if (days.has(dayKey(d))) streak++;
        else if (i > 0) break;
    }
    return streak;
}
function activityLast(days) {
    const m = activityByDay();
    let total = 0;
    const now = Date.now();
    for (const [k, v] of m) { const d = new Date(k); if (now - d.getTime() < days * 86400000) total += v; }
    return total;
}
function newMediaId() { return 'm-' + Math.random().toString(36).slice(2,10) + '-' + Date.now().toString(36); }
let mediaRecorder = null, recChunks = [], recStart = 0, recTimer = null;
let speechRec = null, speechFinal = '', speechInterim = '', speechSupported = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
function pickRecorderMime() {
    const cands = ['audio/webm;codecs=opus','audio/webm','audio/mp4','audio/ogg;codecs=opus','audio/ogg'];
    if (typeof MediaRecorder === 'undefined') return null;
    for (const m of cands) if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(m)) return m;
    return '';
}
let wallObserver = null;
async function openWall() {
    const grid = $('wall-grid'); grid.innerHTML = '';
    const stats = $('wall-stats');
    const items = [];
    fragments.forEach((f, i) => (f.media || []).forEach(m => items.push({ f, i, m })));
    stats.textContent = items.length === 0 ? 'No media yet — attach photos / videos / audio in the detail panel' : `${items.length} media · ${fragments.filter(f => (f.media||[]).length).length} fragments with media`;
    if (items.length === 0) {
        const e = document.createElement('div'); e.className = 'wall-empty';
        e.textContent = 'No media yet — attach photos / videos / audio to a fragment, or use + FOLDER to import a folder of photos.';
        grid.appendChild(e);
    } else {
        if (wallObserver) wallObserver.disconnect();
        wallObserver = new IntersectionObserver((entries) => {
            entries.forEach(async (entry) => {
                if (!entry.isIntersecting) return;
                const card = entry.target;
                const mid = card.dataset.mid;
                const kind = card.dataset.kind;
                const name = card.dataset.name || '';
                if (card.dataset.loaded) return;
                card.dataset.loaded = '1';
                const url = await mediaURL(mid);
                if (!url) return;
                if (kind === 'video') card.querySelector('.wall-media').outerHTML = `<video class="wall-media" src="${url}" muted preload="metadata"></video>` + card.querySelector('.wall-card-overlay').outerHTML;
                else if (kind === 'audio') card.querySelector('.wall-media').outerHTML = `<audio class="wall-media" src="${url}" controls></audio>` + card.querySelector('.wall-card-overlay').outerHTML;
                else card.querySelector('.wall-media').src = url;
                wallObserver.unobserve(card);
            });
        }, { root: $('wall-grid'), rootMargin: '300px' });
        for (const { f, i, m } of items) {
            const card = document.createElement('div'); card.className = 'wall-card';
            card.dataset.mid = m.id; card.dataset.kind = m.kind; card.dataset.name = m.name || '';
            const placeholder = m.kind === 'image' ? `<img class="wall-media" alt="${m.name||''}" style="background:var(--bg2)"/>` : m.kind === 'video' ? `<div class="wall-media" style="background:var(--bg2)"></div>` : `<div class="wall-media" style="background:var(--bg2)"></div>`;
            card.innerHTML = placeholder + `<div class="wall-card-overlay"><span class="t">${f.title || '(untitled)'}</span><span class="y">${f.year || ''} · ${f.kind}</span></div>`;
            card.onclick = () => { closeWall(); selectFragment(i); flyTo(i); };
            grid.appendChild(card);
            wallObserver.observe(card);
        }
    }
    $('wall').classList.add('open');
}
function closeWall() { $('wall').classList.remove('open'); $('wall-grid').innerHTML = ''; if (wallObserver) { wallObserver.disconnect(); wallObserver = null; } }
function ensureAudio() { if (!audioCtx) try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch {} return audioCtx; }
function chime(freq, dur = 0.12, gain = 0.06, type = 'sine') {
    if (!soundEnabled) return;
    const ctx = ensureAudio(); if (!ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator(); const g = ctx.createGain();
    osc.type = type; osc.frequency.value = freq;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g); g.connect(ctx.destination);
    osc.start(t); osc.stop(t + dur + 0.02);
}
function snd(kind) {
    switch (kind) {
        case 'select': chime(740, 0.08, 0.04); break;
        case 'fly': chime(520, 0.16, 0.05, 'triangle'); break;
        case 'view': chime(380, 0.10, 0.05); setTimeout(() => chime(640, 0.18, 0.04, 'triangle'), 60); break;
        case 'save': chime(880, 0.06, 0.04); setTimeout(() => chime(1180, 0.10, 0.04), 50); break;
        case 'undo': chime(220, 0.18, 0.05, 'triangle'); break;
        case 'error': chime(180, 0.20, 0.06, 'sawtooth'); break;
        case 'tour': chime(660, 0.06, 0.04); setTimeout(() => chime(880, 0.06, 0.04), 60); setTimeout(() => chime(1100, 0.14, 0.04), 130); break;
    }
}
function toggleSound() {
    soundEnabled = !soundEnabled;
    localStorage.setItem(SOUND_KEY, soundEnabled ? 'on' : 'off');
    const btn = $('btn-sound');
    if (btn) { btn.textContent = soundEnabled ? '🔊 SOUND' : '🔇 SOUND'; btn.style.borderColor = soundEnabled ? 'var(--accent)' : ''; btn.style.color = soundEnabled ? 'var(--accent)' : ''; }
    if (soundEnabled) snd('select');
    toast(soundEnabled ? 'Sound on' : 'Sound off');
}
function showWelcome() {
    if (localStorage.getItem(WELCOME_KEY) === 'dismissed') return;
    $('welcome').classList.add('show');
}
function dismissWelcome(skip) {
    $('welcome').classList.remove('show');
    if (skip) localStorage.setItem(WELCOME_KEY, 'dismissed');
}
function ensureHoverLabels() {
    const host = $('hover-labels'); if (!host) return;
    while (hoverLabelPool.length < HOVER_LABEL_MAX) {
        const el = document.createElement('div'); el.className = 'hover-lbl';
        host.appendChild(el); hoverLabelPool.push(el);
    }
}
function ensurePersistentLabels() {
    const host = $('hover-labels'); if (!host) return;
    while (persistentLabelPool.length < 200) {
        const el = document.createElement('div'); el.className = 'hover-lbl persistent-lbl';
        el.style.opacity = '0';
        host.appendChild(el); persistentLabelPool.push(el);
    }
}
const _plV = new THREE.Vector3();
function updatePersistentLabels() {
    if (!persistentLabels || !pointsMesh) {
        if (persistentLabelPool.length) persistentLabelPool.forEach(el => el.classList.remove('show'));
        return;
    }
    ensurePersistentLabels();
    const arr = pointsMesh.geometry.attributes.position.array;
    const rect = renderer.domElement.getBoundingClientRect();
    const items = [];
    for (let i = 0; i < fragments.length; i++) {
        if (!isVisible(i)) continue;
        _plV.set(arr[i*3], arr[i*3+1], arr[i*3+2]);
        _plV.project(camera);
        if (_plV.z >= 1 || _plV.z <= -1) continue;
        const sx = (_plV.x + 1) * 0.5 * rect.width + rect.left;
        const sy = (1 - _plV.y) * 0.5 * rect.height + rect.top;
        items.push({ i, sx, sy, z: _plV.z });
    }
    items.sort((a, b) => a.z - b.z);
    items.length = Math.min(persistentLabelPool.length, items.length);
    persistentLabelPool.forEach((el, k) => {
        const it = items[k];
        if (!it) { el.classList.remove('show'); return; }
        const f = fragments[it.i];
        if (el.dataset.idx !== String(it.i)) { el.textContent = f.title || '(untitled)'; el.dataset.idx = String(it.i); }
        el.style.left = it.sx + 'px';
        el.style.top = (it.sy - 14) + 'px';
        el.style.opacity = it.i === selectedIdx ? '0' : '0.7';
        el.classList.add('show');
    });
}
function toggleLabels() {
    persistentLabels = !persistentLabels;
    localStorage.setItem(PERSISTENT_LABEL_KEY, persistentLabels ? '1' : '0');
    const btn = $('btn-labels');
    if (btn) {
        btn.style.borderColor = persistentLabels ? 'var(--accent)' : '';
        btn.style.color = persistentLabels ? 'var(--accent)' : '';
    }
    if (!persistentLabels) persistentLabelPool.forEach(el => el.classList.remove('show'));
    toast(persistentLabels ? 'Labels on' : 'Labels off');
}
const _hv = new THREE.Vector3();
function updateHoverLabels() {
    ensureHoverLabels();
    if (!pointsMesh || hoveredIdx < 0) { hoverLabelPool.forEach(el => el.classList.remove('show')); return; }
    const arr = pointsMesh.geometry.attributes.position.array;
    const rect = renderer.domElement.getBoundingClientRect();
    _hv.set(arr[hoveredIdx*3], arr[hoveredIdx*3+1], arr[hoveredIdx*3+2]);
    _hv.project(camera);
    const hx = (_hv.x + 1) * 0.5 * rect.width + rect.left;
    const hy = (1 - _hv.y) * 0.5 * rect.height + rect.top;
    const candidates = [];
    for (let i = 0; i < fragments.length; i++) {
        if (!isVisible(i) || i === selectedIdx) continue;
        _hv.set(arr[i*3], arr[i*3+1], arr[i*3+2]);
        _hv.project(camera);
        if (_hv.z >= 1 || _hv.z <= -1) continue;
        const sx = (_hv.x + 1) * 0.5 * rect.width + rect.left;
        const sy = (1 - _hv.y) * 0.5 * rect.height + rect.top;
        const dx = sx - hx, dy = sy - hy;
        const d = Math.sqrt(dx*dx + dy*dy);
        if (d < HOVER_LABEL_RADIUS) candidates.push({ i, d, sx, sy });
    }
    candidates.sort((a, b) => a.d - b.d);
    candidates.length = Math.min(HOVER_LABEL_MAX, candidates.length);
    hoverLabelPool.forEach((el, k) => {
        const c = candidates[k];
        if (!c) { el.classList.remove('show'); return; }
        const f = fragments[c.i];
        el.textContent = f.title || '(untitled)';
        el.style.left = c.sx + 'px';
        el.style.top = c.sy + 'px';
        el.classList.add('show');
    });
}
function todayMD() { const d = new Date(); return { m: d.getMonth() + 1, dd: d.getDate() }; }
function rotateDailyPrompt() {
    const today = new Date().toISOString().slice(0, 10);
    if (localStorage.getItem(PROMPT_DISMISS_KEY) === today) return;
    let idx = parseInt(localStorage.getItem(PROMPT_INDEX_KEY) || '0', 10);
    const lastDay = localStorage.getItem('amni-life-prompt-day') || '';
    if (lastDay !== today) {
        idx = (idx + 1) % DAILY_PROMPTS.length;
        localStorage.setItem(PROMPT_INDEX_KEY, String(idx));
        localStorage.setItem('amni-life-prompt-day', today);
    }
    showPrompt(idx);
}
function showPrompt(idx) {
    $('prompt-text').textContent = '"' + DAILY_PROMPTS[idx] + '"';
    $('prompt-bar').classList.add('show');
    $('prompt-bar').dataset.idx = String(idx);
}
function dismissPrompt() {
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem(PROMPT_DISMISS_KEY, today);
    $('prompt-bar').classList.remove('show');
}
function skipPrompt() {
    let idx = parseInt($('prompt-bar').dataset.idx || '0', 10);
    idx = (idx + 1) % DAILY_PROMPTS.length;
    localStorage.setItem(PROMPT_INDEX_KEY, String(idx));
    showPrompt(idx);
}
function captureFromPrompt() {
    const idx = parseInt($('prompt-bar').dataset.idx || '0', 10);
    openQuickCapture();
    setTimeout(() => { $('qc-input').value = DAILY_PROMPTS[idx].replace(/^\.|\.$/g, ''); renderQCPreview(); $('qc-input').focus(); }, 80);
}
function onThisDay() {
    const { m, dd } = todayMD();
    const out = [];
    fragments.forEach((f, i) => { if (f.month === m && f.day === dd) out.push({ f, i }); });
    out.sort((a, b) => (a.f.year || 9999) - (b.f.year || 9999));
    return out;
}
function renderOTD() {
    const dismissed = localStorage.getItem(OTD_DISMISS_KEY);
    const today = new Date().toISOString().slice(0, 10);
    if (dismissed === today) { $('otd').classList.remove('show'); return; }
    const matches = onThisDay();
    const card = $('otd');
    const thisYear = new Date().getFullYear();
    const body = $('otd-body'); body.innerHTML = '';
    let label = 'ON THIS DAY';
    let items = matches;
    if (matches.length === 0) {
        if (fragments.length === 0) { card.classList.remove('show'); return; }
        const seedKey = 'amni-life-mod-' + today;
        let randomIdx = parseInt(localStorage.getItem(seedKey) || '-1', 10);
        if (randomIdx < 0 || randomIdx >= fragments.length) {
            randomIdx = Math.floor(Math.random() * fragments.length);
            localStorage.setItem(seedKey, String(randomIdx));
        }
        items = [{ f: fragments[randomIdx], i: randomIdx }];
        label = 'FROM YOUR MAP';
    }
    document.querySelector('#otd-head').firstChild.textContent = label + ' ';
    items.forEach(({ f, i }) => {
        const row = document.createElement('div'); row.className = 'otd-row';
        const yago = f.year ? (thisYear - f.year) + 'y ago' : '';
        row.innerHTML = `<span class="otd-dot" style="background:${KIND_COLORS[f.kind]}"></span><span class="otd-title">${f.title || '(untitled)'}</span><span class="otd-yago">${yago}</span>`;
        row.onclick = () => { selectFragment(i); flyTo(i); };
        body.appendChild(row);
    });
    $('otd-count').textContent = items.length;
    card.classList.add('show');
}
function dismissOTD() {
    localStorage.setItem(OTD_DISMISS_KEY, new Date().toISOString().slice(0, 10));
    $('otd').classList.remove('show');
}
function startReveal() {
    if (revealing) return;
    if (fragments.length === 0) return;
    revealing = true;
    const minY = yearMin, maxY = yearMax;
    const span = Math.max(1, maxY - minY);
    let yr = minY;
    $('reveal-overlay').classList.add('show');
    $('reveal-year').textContent = String(yr);
    $('reveal-progress-fill').style.width = '0%';
    fragments.forEach((_, i) => setHilite(i, 0));
    if (pointsMesh) {
        const sa = pointsMesh.geometry.attributes.size;
        for (let i = 0; i < fragments.length; i++) sa.array[i] = 0;
        sa.needsUpdate = true;
    }
    const stepMs = 380;
    let stoppedEarly = false;
    revealTimer = setInterval(() => {
        if (!revealing) { clearInterval(revealTimer); revealTimer = null; return; }
        $('reveal-year').textContent = String(yr);
        $('reveal-progress-fill').style.width = (((yr - minY) / span) * 100).toFixed(1) + '%';
        if (pointsMesh) {
            const sa = pointsMesh.geometry.attributes.size;
            fragments.forEach((f, i) => {
                if ((f.year || 9999) <= yr && isVisible(i)) sa.array[i] = (KIND_SIZE[f.kind] || 1.0);
            });
            sa.needsUpdate = true;
        }
        yr++;
        if (yr > maxY) {
            clearInterval(revealTimer); revealTimer = null;
            setTimeout(() => { stopReveal(); toast('Reveal complete'); }, 700);
        }
    }, stepMs);
    snd('tour');
}
function stopReveal() {
    revealing = false;
    if (revealTimer) clearInterval(revealTimer); revealTimer = null;
    $('reveal-overlay').classList.remove('show');
    if (pointsMesh) applyFilters();
}
function toggleReveal() { revealing ? stopReveal() : startReveal(); }
function parseQuickCapture(text) {
    const tags = [];
    let kind = 'event'; let year = null; let title = text;
    title = title.replace(/(?:^|\s)#([\w\-]+)/g, (m, t) => { tags.push(t); return ''; });
    title = title.replace(/(?:^|\s):(person|place|event|work|idea|era)\b/gi, (m, k) => { kind = k.toLowerCase(); return ''; });
    title = title.replace(/(?:^|\s)@(\d{4})\b/g, (m, y) => { year = parseInt(y, 10); return ''; });
    title = title.replace(/\s+/g, ' ').trim();
    return { title, kind, year, tags };
}
function renderQCPreview() {
    const text = $('qc-input').value;
    if (!text.trim()) { $('qc-preview').textContent = ''; return; }
    const p = parseQuickCapture(text);
    const parts = [];
    if (p.kind) parts.push(`<span class="pv-kind">${p.kind}</span>`);
    if (p.year) parts.push(`<span class="pv-year">${p.year}</span>`);
    p.tags.forEach(t => parts.push(`<span class="pv-tag">#${t}</span>`));
    if (p.title) parts.push(`"${p.title}"`);
    $('qc-preview').innerHTML = '→ ' + parts.join(' ');
}
function openQuickCapture() {
    $('qc-input').value = '';
    $('qc-preview').textContent = '';
    $('quick-capture').classList.add('show');
    setTimeout(() => $('qc-input').focus(), 50);
}
function closeQuickCapture() { $('quick-capture').classList.remove('show'); }
async function commitQuickCapture() {
    const raw = $('qc-input').value.trim();
    if (!raw) { closeQuickCapture(); return; }
    const p = parseQuickCapture(raw);
    if (!p.title) { closeQuickCapture(); return; }
    fragments.push({ id: newId(), title: p.title, kind: p.kind, year: p.year, summary: '', tags: p.tags, connections: [], media: [], addedAt: Date.now() });
    saveFragments(); rebuildIndex(); recomputeYearBounds();
    await computeLayouts();
    buildPoints(); buildEdges(); renderFragsList(); renderTagFilters();
    updateStats();
    closeQuickCapture();
    selectFragment(fragments.length - 1); flyTo(fragments.length - 1);
    toast(`Added: ${p.title}`);
}
function toggleMood() {
    moodOverlay = !moodOverlay;
    const btn = $('btn-mood');
    btn.textContent = moodOverlay ? '🎨 MOOD' : '🔇 MOOD';
    btn.style.borderColor = moodOverlay ? 'var(--accent)' : '';
    btn.style.color = moodOverlay ? 'var(--accent)' : '';
    if (pointsMesh) {
        const cAttr = pointsMesh.geometry.attributes.color;
        fragments.forEach((f, i) => {
            const c = new THREE.Color(fragmentColor(f));
            cAttr.array[i*3] = c.r; cAttr.array[i*3+1] = c.g; cAttr.array[i*3+2] = c.b;
        });
        cAttr.needsUpdate = true;
    }
    toast(moodOverlay ? 'Mood overlay on (red=heavy / gray=neutral / green=light)' : 'Mood overlay off');
}
function showStats() {
    const body = $('stats-body'); body.innerHTML = '';
    const total = fragments.length;
    if (total === 0) { body.innerHTML = '<div class="stat-card"><p style="color:var(--dim);font-style:italic">No fragments yet</p></div>'; $('stats-panel').classList.add('show'); return; }
    const ys = fragments.map(f => f.year).filter(y => typeof y === 'number');
    const ymin = ys.length ? Math.min(...ys) : null;
    const ymax = ys.length ? Math.max(...ys) : null;
    const span = (ymin && ymax) ? (ymax - ymin) : 0;
    const geoCount = fragments.filter(f => fragmentLatLon(f)).length;
    const mediaCount = fragments.reduce((s, f) => s + (f.media || []).length, 0);
    const moodFrags = fragments.filter(f => typeof f.mood === 'number');
    const avgMood = moodFrags.length ? (moodFrags.reduce((s, f) => s + f.mood, 0) / moodFrags.length).toFixed(2) : '—';
    const yearBuckets = {};
    fragments.forEach(f => { if (f.year) yearBuckets[f.year] = (yearBuckets[f.year] || 0) + 1; });
    const busiestYear = Object.entries(yearBuckets).sort((a, b) => b[1] - a[1])[0];
    const inbound = new Map();
    fragments.forEach(f => (f.connections || []).forEach(c => inbound.set(c.to, (inbound.get(c.to) || 0) + 1)));
    let mostConnected = null, mostConnectedCount = 0;
    fragments.forEach(f => {
        const out = (f.connections || []).length;
        const inc = inbound.get(f.id) || 0;
        const tot = out + inc;
        if (tot > mostConnectedCount) { mostConnectedCount = tot; mostConnected = f; }
    });
    const tagMap = tagCounts();
    const topTagsArr = [...tagMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
    const kindMap = kindCounts();
    const totalKinds = Object.values(kindMap).reduce((s, n) => s + n, 0);
    const streak = computeStreak();
    const last30 = activityLast(30);
    const overview = document.createElement('div'); overview.className = 'stat-card';
    overview.innerHTML = `<h4>Overview</h4><div class="stat-grid">
        <div><span class="stat-num">${total}</span><span class="stat-label">Fragments</span></div>
        <div><span class="stat-num">${edges.length}</span><span class="stat-label">Connections</span></div>
        <div><span class="stat-num">${span}</span><span class="stat-label">Year span</span></div>
        <div><span class="stat-num">${mediaCount}</span><span class="stat-label">Media items</span></div>
        <div><span class="stat-num">${geoCount}</span><span class="stat-label">Geo-tagged</span></div>
        <div><span class="stat-num">${avgMood}</span><span class="stat-label">Avg mood</span></div>
        <div><span class="stat-num">${streak}</span><span class="stat-label">Day streak</span></div>
        <div><span class="stat-num">${last30}</span><span class="stat-label">Added · 30d</span></div>
    </div>`;
    body.appendChild(overview);
    const heatCard = document.createElement('div'); heatCard.className = 'stat-card';
    heatCard.innerHTML = `<h4>Activity · last 52 weeks</h4><canvas id="heat-chart" width="600" height="84" style="width:100%;height:84px;display:block"></canvas><div style="font-family:var(--mono);font-size:0.6rem;color:var(--dim);margin-top:6px;text-align:right">less ◻ ◼ more</div>`;
    body.appendChild(heatCard);
    setTimeout(() => drawHeatmap(), 0);
    if (busiestYear) {
        const peakCard = document.createElement('div'); peakCard.className = 'stat-card';
        peakCard.innerHTML = `<h4>Peak years</h4>` + Object.entries(yearBuckets).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([y, n]) => {
            const pct = (n / busiestYear[1]) * 100;
            return `<div class="stat-row"><span class="stat-key">${y}</span><span class="stat-val">${n} fragment${n === 1 ? '' : 's'}</span></div><div class="stat-bar"><div class="stat-bar-fill" style="width:${pct}%"></div></div>`;
        }).join('');
        body.appendChild(peakCard);
    }
    if (moodFrags.length > 0 && ymin && ymax) {
        const moodCard = document.createElement('div'); moodCard.className = 'stat-card';
        const moodLabels = { '-2': 'heavy', '-1': 'low', '0': 'neutral', '1': 'light', '2': 'bright' };
        const moodPalette = { '-2': '#cc4060', '-1': '#d28080', '0': '#aaaaaa', '1': '#7bb88a', '2': '#5fd47b' };
        const moodChips = [-2,-1,0,1,2].map(v => `<span class="mood-chip${moodFilterValues.has(v) ? ' on' : ''}" data-v="${v}"><span class="mood-chip-dot" style="background:${moodPalette[v]}"></span>${moodLabels[v]} ${v > 0 ? '+' + v : v}</span>`).join('');
        moodCard.innerHTML = `<h4>Mood over time</h4><div style="margin-bottom:10px;font-size:0.66rem;color:var(--dim);font-family:var(--mono)">click to filter →</div><div style="margin-bottom:12px">${moodChips}</div><div style="position:relative"><canvas id="mood-chart" width="600" height="120" style="width:100%;height:120px;display:block"></canvas><div id="mood-chart-meta" style="font-family:var(--mono);font-size:0.62rem;color:var(--dim);margin-top:6px;display:flex;justify-content:space-between"><span>${ymin}</span><span>heavy ↓ light ↑</span><span>${ymax}</span></div></div>`;
        body.appendChild(moodCard);
        moodCard.querySelectorAll('.mood-chip').forEach(c => c.onclick = () => toggleMoodFilter(parseInt(c.dataset.v, 10)));
        setTimeout(() => drawMoodChart(ymin, ymax, moodFrags), 0);
    }
    const kindCard = document.createElement('div'); kindCard.className = 'stat-card';
    kindCard.innerHTML = `<h4>By kind</h4>` + Object.entries(kindMap).sort((a, b) => b[1] - a[1]).map(([k, n]) => {
        const pct = totalKinds ? (n / totalKinds) * 100 : 0;
        return `<div class="stat-row"><span class="stat-key" style="display:flex;align-items:center;gap:8px"><span style="width:8px;height:8px;border-radius:50%;background:${KIND_COLORS[k]};display:inline-block"></span>${k}</span><span class="stat-val">${n} (${pct.toFixed(0)}%)</span></div>`;
    }).join('');
    body.appendChild(kindCard);
    if (topTagsArr.length > 0) {
        const tagCard = document.createElement('div'); tagCard.className = 'stat-card';
        tagCard.innerHTML = `<h4>Top tags</h4>` + topTagsArr.map(([t, n]) => `<div class="stat-row"><span class="stat-key">#${t}</span><span class="stat-val">${n}</span></div>`).join('');
        body.appendChild(tagCard);
    }
    if (mostConnected) {
        const mcCard = document.createElement('div'); mcCard.className = 'stat-card';
        mcCard.innerHTML = `<h4>Most connected</h4><div class="stat-row"><span class="stat-key">${mostConnected.title || '(untitled)'}</span><span class="stat-val">${mostConnectedCount} link${mostConnectedCount === 1 ? '' : 's'}</span></div>`;
        body.appendChild(mcCard);
    }
    $('stats-panel').classList.add('show');
}
function closeStats() { $('stats-panel').classList.remove('show'); }
function drawHeatmap() {
    const c = $('heat-chart'); if (!c) return;
    const ctx = c.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    c.width = c.offsetWidth * dpr; c.height = c.offsetHeight * dpr;
    ctx.scale(dpr, dpr);
    const w = c.offsetWidth, h = c.offsetHeight;
    const days = activityByDay();
    let max = 0; for (const v of days.values()) if (v > max) max = v;
    if (max < 1) max = 1;
    const cs = getComputedStyle(document.documentElement);
    const accent = cs.getPropertyValue('--accent').trim() || '#7cc4ff';
    const today = new Date(); today.setHours(0,0,0,0);
    const cell = Math.min(11, Math.floor((w - 8) / 53));
    const gap = 2;
    const offX = 4, offY = 4;
    for (let week = 0; week < 53; week++) {
        for (let dow = 0; dow < 7; dow++) {
            const offset = (52 - week) * 7 + (6 - dow);
            const d = new Date(today); d.setDate(today.getDate() - offset);
            const v = days.get(dayKey(d)) || 0;
            const intensity = v === 0 ? 0 : Math.min(1, 0.25 + (v / max) * 0.75);
            ctx.fillStyle = v === 0 ? 'rgba(255,255,255,0.04)' : accent;
            ctx.globalAlpha = v === 0 ? 1 : intensity;
            ctx.fillRect(offX + week * (cell + gap), offY + dow * (cell + gap), cell, cell);
        }
    }
    ctx.globalAlpha = 1;
}
function drawMoodChart(ymin, ymax, moodFrags) {
    const c = $('mood-chart'); if (!c) return;
    const ctx = c.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    c.width = c.offsetWidth * dpr; c.height = c.offsetHeight * dpr;
    ctx.scale(dpr, dpr);
    const w = c.offsetWidth, h = c.offsetHeight;
    const yearAvg = new Map();
    fragments.forEach(f => {
        if (typeof f.mood !== 'number' || !f.year) return;
        const a = yearAvg.get(f.year) || { sum: 0, n: 0 };
        a.sum += f.mood; a.n++;
        yearAvg.set(f.year, a);
    });
    const cs = getComputedStyle(document.documentElement);
    const accent = cs.getPropertyValue('--accent').trim() || '#7cc4ff';
    const dim = cs.getPropertyValue('--dim').trim() || '#7d8597';
    const span = Math.max(1, ymax - ymin);
    const pad = 6;
    ctx.strokeStyle = dim + '33'; ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2);
    ctx.stroke();
    ctx.fillStyle = accent + 'cc';
    for (const [y, a] of yearAvg) {
        const avg = a.sum / a.n;
        const x = ((y - ymin) / span) * (w - 2 * pad) + pad;
        const yPos = h / 2 - (avg / 2) * (h / 2 - 8);
        const r = 3 + a.n * 0.5;
        ctx.beginPath();
        ctx.arc(x, yPos, Math.min(r, 7), 0, 6.283);
        ctx.fill();
    }
    const sorted = [...yearAvg.entries()].sort((a, b) => a[0] - b[0]);
    if (sorted.length > 1) {
        ctx.strokeStyle = accent + '88'; ctx.lineWidth = 1.5;
        ctx.beginPath();
        sorted.forEach(([y, a], i) => {
            const avg = a.sum / a.n;
            const x = ((y - ymin) / span) * (w - 2 * pad) + pad;
            const yPos = h / 2 - (avg / 2) * (h / 2 - 8);
            if (i === 0) ctx.moveTo(x, yPos); else ctx.lineTo(x, yPos);
        });
        ctx.stroke();
    }
}
function nextVisibleIdx(curIdx, dir) {
    const visIdx = fragments.map((_, i) => i).filter(i => isVisible(i)).sort((a, b) => (fragments[a].year || 9999) - (fragments[b].year || 9999));
    if (visIdx.length === 0) return -1;
    if (curIdx < 0) return dir > 0 ? visIdx[0] : visIdx[visIdx.length - 1];
    const k = visIdx.indexOf(curIdx);
    if (k < 0) return visIdx[0];
    return visIdx[(k + dir + visIdx.length) % visIdx.length];
}
function stepFragment(dir) {
    const idx = nextVisibleIdx(selectedIdx, dir);
    if (idx >= 0) { selectFragment(idx); flyTo(idx); }
}
function buildPrintView() {
    const frame = $('print-frame'); frame.innerHTML = '';
    const sorted = fragments.slice().sort((a, b) => (a.year || 9999) - (b.year || 9999));
    const byYear = new Map();
    sorted.forEach(f => { const y = f.year || 'undated'; if (!byYear.has(y)) byYear.set(y, []); byYear.get(y).push(f); });
    let html = `<h1 style="font-size:28px;margin-bottom:6px">My Memory Map</h1><p style="color:#666;margin-bottom:24px">${fragments.length} fragments · ${edges.length} connections · printed ${new Date().toLocaleDateString()}</p>`;
    for (const [y, frags] of byYear) {
        html += `<h2 style="font-size:18px;margin-top:24px">${y}</h2>`;
        for (const f of frags) {
            const dateStr = f.year ? (f.month ? f.year + '-' + String(f.month).padStart(2,'0') + (f.day ? '-' + String(f.day).padStart(2,'0') : '') : f.year) : '';
            const tagStr = (f.tags || []).map(t => '#' + t).join(' ');
            html += `<div class="pr-frag"><strong>${(f.title || '(untitled)').replace(/[<>&]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;'}[c]))}</strong>
                <div class="pr-meta">${dateStr} · ${f.kind}${typeof f.mood === 'number' ? ' · mood ' + (f.mood > 0 ? '+' : '') + f.mood : ''}${(f.media||[]).length ? ' · ' + f.media.length + ' media' : ''}</div>
                ${f.summary ? `<div class="pr-summary">${f.summary.replace(/[<>&]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;'}[c])).replace(/\n/g, '<br/>')}</div>` : ''}
                ${tagStr ? `<div class="pr-tags">${tagStr}</div>` : ''}
                ${(f.connections || []).length ? `<div class="pr-tags">→ ${(f.connections || []).map(c => { const t = idToIdx.get(c.to); return t !== undefined ? (fragments[t].title || c.to) + ` <em>(${c.type})</em>` : c.to; }).join(' · ')}</div>` : ''}
            </div>`;
        }
    }
    frame.innerHTML = html;
}
function doPrint() {
    buildPrintView();
    setTimeout(() => { window.print(); }, 100);
}
const HELP_KEYS = [
    { sect: 'Navigate', rows: [
        ['/','Focus search'],
        ['→ / j','Next fragment chronologically'],
        ['← / k','Previous fragment chronologically'],
        ['L','Toggle fragment list'],
        ['Esc','Close panels / lightbox / modal']
    ]},
    { sect: 'Create / Edit', rows: [
        ['N','Open ADD fragment modal'],
        ['Ctrl+K','Quick capture (inline)'],
        ['Shift+drag','Link two nodes (in 3D scene)'],
        ['Shift+click','Multi-select rows in fragment list'],
        ['Alt+click','Find path between two fragments'],
        ['Ctrl+Z','Undo'],
        ['Ctrl+Y / Ctrl+Shift+Z','Redo']
    ]},
    { sect: 'View / Mood', rows: [
        ['T','Cycle theme'],
        ['E','Toggle edges'],
        ['S','Toggle auto-spin'],
        ['F','Focus mode — hide all UI for screenshots'],
        ['Ctrl+/','Show this cheatsheet']
    ]}
];
function showHelp() {
    const body = $('help-body'); body.innerHTML = '';
    HELP_KEYS.forEach(s => {
        const sec = document.createElement('div'); sec.className = 'help-section';
        sec.innerHTML = `<h4>${s.sect}</h4>` + s.rows.map(([k, d]) => `<div class="help-row"><span class="help-desc">${d}</span><span class="help-key">${k}</span></div>`).join('');
        body.appendChild(sec);
    });
    const aboutSec = document.createElement('div'); aboutSec.className = 'help-section';
    aboutSec.innerHTML = `<h4>About</h4>
<div style="font-size:0.78rem;color:var(--dim);line-height:1.6">
Amni-Life is a memory map for the fragments of a life. Every dot is a moment, place, person, idea, or era.
Local-first &mdash; everything stays in your browser. Encrypted shares for the people you trust.
</div>
<div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">
<button class="topbtn" id="btn-show-welcome">Re-show welcome</button>
<a class="topbtn" href="https://amni-scient.com/amni-life" target="_blank" rel="noopener" style="text-decoration:none">amni-scient.com/amni-life</a>
</div>`;
    body.appendChild(aboutSec);
    $('help-panel').classList.add('show');
    setTimeout(() => {
        const b = $('btn-show-welcome');
        if (b) b.onclick = () => { localStorage.removeItem('amni-life-welcome-v1'); closeHelp(); $('welcome').classList.add('show'); };
    }, 0);
}
function closeHelp() { $('help-panel').classList.remove('show'); }
let mmCtx = null;
function drawMinimap() {
    const c = $('minimap'); if (!c || !c.classList.contains('show')) return;
    if (!mmCtx) mmCtx = c.getContext('2d');
    const w = c.width, h = c.height;
    mmCtx.clearRect(0, 0, w, h);
    if (!pointsMesh || fragments.length === 0) return;
    const arr = pointsMesh.geometry.attributes.position.array;
    let xmin = Infinity, xmax = -Infinity, zmin = Infinity, zmax = -Infinity;
    for (let i = 0; i < fragments.length; i++) {
        if (!isVisible(i)) continue;
        const x = arr[i*3], z = arr[i*3+2];
        if (x < xmin) xmin = x; if (x > xmax) xmax = x;
        if (z < zmin) zmin = z; if (z > zmax) zmax = z;
    }
    if (!Number.isFinite(xmin)) return;
    const pad = 12;
    const sw = w - 2*pad, sh = h - 2*pad;
    const span = Math.max(1, Math.max(xmax - xmin, zmax - zmin));
    const cx = (xmin + xmax) / 2, cz = (zmin + zmax) / 2;
    const scale = Math.min(sw, sh) / span;
    const proj = (x, z) => [pad + sw / 2 + (x - cx) * scale, pad + sh / 2 + (z - cz) * scale];
    mmCtx.fillStyle = 'rgba(255,255,255,0.04)';
    mmCtx.fillRect(0, 0, w, h);
    mmCtx.lineWidth = 0.5;
    mmCtx.strokeStyle = 'rgba(255,255,255,0.1)';
    if (showEdges) {
        for (const e of edges) {
            if (!isVisible(e.s) || !isVisible(e.t)) continue;
            if (!activeEdgeTypes.has(e.type || 'with')) continue;
            const a = proj(arr[e.s*3], arr[e.s*3+2]);
            const b = proj(arr[e.t*3], arr[e.t*3+2]);
            mmCtx.beginPath(); mmCtx.moveTo(a[0], a[1]); mmCtx.lineTo(b[0], b[1]); mmCtx.stroke();
        }
    }
    for (let i = 0; i < fragments.length; i++) {
        if (!isVisible(i)) continue;
        const f = fragments[i];
        const [px, py] = proj(arr[i*3], arr[i*3+2]);
        mmCtx.fillStyle = fragmentColor(f);
        mmCtx.beginPath();
        mmCtx.arc(px, py, i === selectedIdx ? 3.5 : (f.kind === 'era' ? 2.5 : 1.8), 0, 6.283);
        mmCtx.fill();
    }
    const camP = proj(camera.position.x, camera.position.z);
    const tgtP = proj(controls.target.x, controls.target.z);
    mmCtx.strokeStyle = 'rgba(245,200,66,0.7)';
    mmCtx.lineWidth = 1;
    mmCtx.beginPath(); mmCtx.moveTo(camP[0], camP[1]); mmCtx.lineTo(tgtP[0], tgtP[1]); mmCtx.stroke();
    mmCtx.fillStyle = 'rgba(245,200,66,0.9)';
    mmCtx.beginPath(); mmCtx.arc(camP[0], camP[1], 2.5, 0, 6.283); mmCtx.fill();
}
function onMinimapClick(e) {
    if (!pointsMesh || fragments.length === 0) return;
    const c = $('minimap'); const rect = c.getBoundingClientRect();
    const arr = pointsMesh.geometry.attributes.position.array;
    let xmin = Infinity, xmax = -Infinity, zmin = Infinity, zmax = -Infinity;
    for (let i = 0; i < fragments.length; i++) {
        if (!isVisible(i)) continue;
        const x = arr[i*3], z = arr[i*3+2];
        if (x < xmin) xmin = x; if (x > xmax) xmax = x;
        if (z < zmin) zmin = z; if (z > zmax) zmax = z;
    }
    if (!Number.isFinite(xmin)) return;
    const w = c.width, h = c.height, pad = 12;
    const sw = w - 2*pad, sh = h - 2*pad;
    const span = Math.max(1, Math.max(xmax - xmin, zmax - zmin));
    const scale = Math.min(sw, sh) / span;
    const cx = (xmin + xmax) / 2, cz = (zmin + zmax) / 2;
    const px = e.clientX - rect.left, py = e.clientY - rect.top;
    const wx = (px - pad - sw / 2) / scale + cx;
    const wz = (py - pad - sh / 2) / scale + cz;
    let bestIdx = -1, bestD = Infinity;
    for (let i = 0; i < fragments.length; i++) {
        if (!isVisible(i)) continue;
        const dx = arr[i*3] - wx, dz = arr[i*3+2] - wz;
        const d = dx*dx + dz*dz;
        if (d < bestD) { bestD = d; bestIdx = i; }
    }
    if (bestIdx >= 0) { selectFragment(bestIdx); flyTo(bestIdx); }
}
function startKindEdit(ev) {
    ev?.stopPropagation();
    if (selectedIdx < 0) return;
    const f = fragments[selectedIdx];
    const kindEl = $('detail-kind');
    const old = $('kind-popover'); if (old) { old.remove(); return; }
    const pop = document.createElement('div');
    pop.id = 'kind-popover';
    pop.className = 'kind-popover';
    allKinds().forEach(k => {
        const opt = document.createElement('div');
        opt.className = 'kind-opt' + (k === f.kind ? ' current' : '');
        opt.innerHTML = `<span class="chip-dot" style="background:${KIND_COLORS[k]}"></span>${k}`;
        opt.onclick = (e) => {
            e.stopPropagation();
            f.kind = k; saveFragments();
            pop.remove();
            selectFragment(selectedIdx);
            renderFilters(); renderFragsList();
            buildPoints(); applyFilters();
        };
        pop.appendChild(opt);
    });
    kindEl.parentElement.appendChild(pop);
    setTimeout(() => {
        const close = (e) => { if (!pop.contains(e.target)) { pop.remove(); document.removeEventListener('click', close); } };
        document.addEventListener('click', close);
    }, 50);
}
function startTitleEdit() {
    if (selectedIdx < 0) return;
    const f = fragments[selectedIdx];
    const titleEl = $('detail-title'); if (!titleEl) return;
    const inp = document.createElement('input');
    inp.type = 'text'; inp.className = 'title-edit'; inp.value = f.title || '';
    titleEl.replaceWith(inp);
    inp.focus(); inp.select();
    let committed = false;
    const commit = (cancel) => {
        if (committed) return; committed = true;
        const val = cancel ? (f.title || '') : inp.value.trim();
        if (!cancel && val && val !== f.title) { f.title = val; saveFragments(); }
        const fresh = document.createElement('div');
        fresh.id = 'detail-title'; fresh.className = 'editable-title';
        fresh.title = 'Click to edit'; fresh.textContent = f.title || '(untitled)';
        fresh.onclick = startTitleEdit;
        inp.replaceWith(fresh);
        renderFragsList();
    };
    inp.addEventListener('blur', () => commit(false));
    inp.addEventListener('keydown', e => {
        if (e.key === 'Escape') { e.preventDefault(); commit(true); }
        if (e.key === 'Enter') { e.preventDefault(); commit(false); }
    });
}
function removeFragmentTag(idx, tag) {
    const f = fragments[idx]; if (!f) return;
    f.tags = (f.tags || []).filter(t => t !== tag);
    activeTags.delete(tag);
    saveFragments();
    selectFragment(idx);
    renderTagFilters();
    applyFilters();
}
function addFragmentTag() {
    if (selectedIdx < 0) return;
    const t = prompt('New tag (no #, no spaces):', '');
    if (!t) return;
    const clean = t.trim().replace(/^#/, '').replace(/\s+/g, '-');
    if (!clean) return;
    const f = fragments[selectedIdx]; f.tags = f.tags || [];
    if (!f.tags.includes(clean)) f.tags.push(clean);
    saveFragments();
    selectFragment(selectedIdx);
    renderTagFilters();
    applyFilters();
    toast(`Added #${clean}`);
}
function togglePin() {
    if (selectedIdx < 0) return;
    const f = fragments[selectedIdx];
    f.pinned = !f.pinned;
    if (f.pinned) {
        const maxOrder = fragments.filter(x => x.pinned && typeof x.pinOrder === 'number').reduce((m, x) => Math.max(m, x.pinOrder), -1);
        f.pinOrder = maxOrder + 1;
    } else {
        delete f.pinOrder;
    }
    saveFragments();
    selectFragment(selectedIdx);
    renderFragsList();
    toast(f.pinned ? `Pinned: ${f.title}` : `Unpinned: ${f.title}`);
}
function reorderPinnedFragments(draggedId, targetId) {
    const dragged = fragments.find(f => f.id === draggedId);
    const target = fragments.find(f => f.id === targetId);
    if (!dragged || !target || !dragged.pinned || !target.pinned) return;
    const pinned = fragments.filter(f => f.pinned).sort((a, b) => (a.pinOrder ?? 999) - (b.pinOrder ?? 999));
    const fromIdx = pinned.findIndex(f => f.id === draggedId);
    const toIdx = pinned.findIndex(f => f.id === targetId);
    if (fromIdx < 0 || toIdx < 0) return;
    pinned.splice(toIdx, 0, pinned.splice(fromIdx, 1)[0]);
    pinned.forEach((f, i) => { f.pinOrder = i; });
    saveFragments();
    renderFragsList();
    toast(`Reordered: ${dragged.title}`);
}
function toggleSearchFilter() {
    searchFilterActive = !searchFilterActive;
    const btn = $('filterbtn');
    btn.classList.toggle('on', searchFilterActive);
    searchFilterQuery = $('search').value.trim();
    applyFilters();
}
function startSummaryEdit() {
    if (selectedIdx < 0) return;
    const f = fragments[selectedIdx];
    const sumEl = $('detail-summary');
    if (!sumEl) return;
    const append = $('append-mode')?.checked;
    const ta = document.createElement('textarea');
    ta.className = 'summary-edit';
    ta.value = append ? '' : (f.summary || '');
    if (append) ta.placeholder = 'New entry — appended with today\'s date…';
    sumEl.replaceWith(ta);
    ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length);
    let committed = false;
    const commit = (cancel) => {
        if (committed) return; committed = true;
        const newVal = ta.value.trim();
        if (!cancel && newVal) {
            if (append) {
                const stamp = new Date().toISOString().slice(0, 10);
                f.summary = (f.summary || '') + `\n\n— ${stamp} —\n${newVal}`;
            } else if (newVal !== f.summary) {
                f.summary = newVal;
            }
            saveFragments();
        }
        const fresh = document.createElement('div');
        fresh.id = 'detail-summary'; fresh.className = 'editable-summary';
        fresh.title = 'Click to edit';
        fresh.innerHTML = renderMarkdown(f.summary || '', activeSearchQuery());
        fresh.onclick = startSummaryEdit;
        ta.replaceWith(fresh);
        if (append) $('append-mode').checked = false;
    };
    ta.addEventListener('blur', () => commit(false));
    ta.addEventListener('keydown', e => {
        if (e.key === 'Escape') { e.preventDefault(); commit(true); }
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); commit(false); }
    });
}
let qrLibLoading = null;
function loadQRLib() {
    if (window.qrcode) return Promise.resolve(true);
    if (qrLibLoading) return qrLibLoading;
    qrLibLoading = new Promise((res) => {
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js';
        s.onload = () => res(true);
        s.onerror = () => res(false);
        document.head.appendChild(s);
    });
    return qrLibLoading;
}
async function renderQR(text, size = 200) {
    const ok = await loadQRLib();
    if (!ok || !window.qrcode) return null;
    let typeNumber = 0;
    let qr;
    for (let t = 4; t <= 40; t++) {
        try {
            qr = window.qrcode(t, 'L');
            qr.addData(text);
            qr.make();
            typeNumber = t;
            break;
        } catch { /* too small, try larger */ }
    }
    if (!qr) return null;
    const cells = qr.getModuleCount();
    const cell = Math.max(2, Math.floor(size / cells));
    const sz = cells * cell;
    const cs = getComputedStyle(document.documentElement);
    const fg = cs.getPropertyValue('--fg').trim() || '#e8ecf3';
    const bg = cs.getPropertyValue('--bg2').trim() || '#10131a';
    const c = document.createElement('canvas');
    c.width = sz + cell * 2; c.height = sz + cell * 2;
    const ctx = c.getContext('2d');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = fg;
    for (let y = 0; y < cells; y++) {
        for (let x = 0; x < cells; x++) {
            if (qr.isDark(y, x)) ctx.fillRect(cell + x * cell, cell + y * cell, cell, cell);
        }
    }
    return c;
}
async function copyDeepLink() {
    if (selectedIdx < 0) { toast('Select a fragment first'); return; }
    const f = fragments[selectedIdx];
    const url = location.origin + location.pathname + '#f=' + encodeURIComponent(f.id);
    try { await navigator.clipboard.writeText(url); }
    catch {}
    showQRForURL(url, `Link to "${f.title}"`);
}
function closeQRPanel() { $('qr-modal').classList.remove('show'); }
async function showQRForURL(url, label) {
    $('qr-label').textContent = label || 'Scan with another device';
    $('qr-url').textContent = url;
    $('qr-canvas-wrap').innerHTML = '<div style="color:var(--dim);font-family:var(--mono);font-size:0.7rem">generating…</div>';
    $('qr-modal').classList.add('show');
    const c = await renderQR(url, 240);
    if (c) {
        c.style.cssText = 'display:block;margin:0 auto;border-radius:6px';
        $('qr-canvas-wrap').innerHTML = '';
        $('qr-canvas-wrap').appendChild(c);
    } else {
        $('qr-canvas-wrap').innerHTML = '<div style="color:var(--dim);font-family:var(--mono);font-size:0.7rem">QR generation failed (offline?). The URL is still copyable below.</div>';
    }
    toast('Link copied + QR ready');
}
function showRawJSON() {
    if (selectedIdx < 0) { toast('Select a fragment first'); return; }
    const f = fragments[selectedIdx];
    const json = JSON.stringify(f, null, 2);
    $('raw-body').textContent = json;
    $('raw-modal').classList.add('show');
}
function closeRawJSON() { $('raw-modal').classList.remove('show'); }
async function copyRawJSON() {
    const txt = $('raw-body').textContent;
    try { await navigator.clipboard.writeText(txt); toast('Copied JSON to clipboard'); }
    catch { toast('Copy failed — select the text and Ctrl+C'); }
}
const BACKUP_NAG_DAYS = 14;
const BACKUP_DISMISS_KEY = 'amni-life-backup-dismissed';
function checkBackupBanner() {
    if (fragments.length < 5) return;
    const last = parseInt(localStorage.getItem('amni-life-last-export') || '0', 10);
    const dismissed = parseInt(localStorage.getItem(BACKUP_DISMISS_KEY) || '0', 10);
    const now = Date.now();
    if (now - last < BACKUP_NAG_DAYS * 86400000) return;
    if (now - dismissed < 3 * 86400000) return;
    $('backup-banner').classList.add('show');
}
function hideBackupBanner() { $('backup-banner').classList.remove('show'); }
function dismissBackup() { localStorage.setItem(BACKUP_DISMISS_KEY, String(Date.now())); hideBackupBanner(); }
let quizQueue = [], quizIdx = 0, quizScore = 0, quizAttempts = 0;
function startQuiz() {
    if (fragments.length < 3) { toast('Need at least 3 fragments to quiz'); return; }
    quizQueue = fragments.map((_, i) => i).filter(i => isVisible(i) && (fragments[i].title || '').length > 2);
    if (quizQueue.length < 3) { quizQueue = fragments.map((_, i) => i).filter(i => (fragments[i].title || '').length > 2); }
    quizQueue.sort(() => Math.random() - 0.5);
    quizIdx = 0; quizScore = 0; quizAttempts = 0;
    $('quiz-modal').classList.add('show');
    showQuizQuestion();
    setTimeout(() => $('quiz-guess').focus(), 100);
}
function showQuizQuestion() {
    if (quizIdx >= quizQueue.length) { quizQueue.sort(() => Math.random() - 0.5); quizIdx = 0; }
    const f = fragments[quizQueue[quizIdx]];
    $('quiz-meta').textContent = `${f.year || '????'} · ${f.kind} · ${(f.tags || []).map(t => '#' + t).join(' ')}`;
    $('quiz-summary').textContent = f.summary ? '"' + f.summary.split('\n')[0].slice(0, 220) + '"' : '(no summary)';
    $('quiz-guess').value = '';
    $('quiz-feedback').textContent = '';
    $('quiz-feedback').style.color = 'var(--dim)';
    $('quiz-score').textContent = `${quizScore} / ${quizAttempts}`;
}
function checkQuizGuess() {
    const f = fragments[quizQueue[quizIdx]];
    const guess = $('quiz-guess').value.trim().toLowerCase();
    if (!guess) return;
    quizAttempts++;
    const correct = (f.title || '').toLowerCase();
    const overlap = guess.split(/\s+/).filter(w => w.length > 2 && correct.includes(w)).length;
    const correctWords = correct.split(/\s+/).filter(w => w.length > 2).length;
    const score = correctWords > 0 ? overlap / correctWords : (guess === correct ? 1 : 0);
    const fb = $('quiz-feedback');
    if (score >= 0.6) {
        fb.textContent = `✓ Yes — "${f.title}"`;
        fb.style.color = '#7be0a4';
        quizScore++;
    } else {
        fb.textContent = `✗ It was "${f.title}"`;
        fb.style.color = '#ff8888';
    }
    $('quiz-score').textContent = `${quizScore} / ${quizAttempts}`;
}
function nextQuiz() { quizIdx++; showQuizQuestion(); setTimeout(() => $('quiz-guess').focus(), 60); }
function revealQuiz() {
    const f = fragments[quizQueue[quizIdx]];
    $('quiz-feedback').textContent = `→ "${f.title}"`;
    $('quiz-feedback').style.color = 'var(--accent2)';
}
function closeQuiz() { $('quiz-modal').classList.remove('show'); }
let moodFilterValues = new Set();
function toggleMoodFilter(v) {
    moodFilterValues.has(v) ? moodFilterValues.delete(v) : moodFilterValues.add(v);
    applyFilters();
    document.querySelectorAll('.mood-chip').forEach(c => {
        const cv = parseInt(c.dataset.v, 10);
        c.classList.toggle('on', moodFilterValues.has(cv));
    });
}
function isTouring() { return tourTimer !== null; }
function startTour() {
    const visibleFragments = fragments.map((f, i) => ({ f, i })).filter(({ i }) => isVisible(i));
    if (visibleFragments.length === 0) { toast('No fragments to tour'); return; }
    snd('tour');
    tourQueue = visibleFragments.sort((a, b) => (a.f.year || 9999) - (b.f.year || 9999)).map(x => x.i);
    tourIdx = 0;
    tourPrevSpin = autoSpin;
    if (autoSpin) { autoSpin = false; controls.autoRotate = false; }
    $('btn-tour').textContent = '◼ STOP';
    $('btn-tour').style.borderColor = 'var(--accent)';
    $('btn-tour').style.color = 'var(--accent)';
    toast(`Touring ${tourQueue.length} fragments…`);
    tourStep();
    tourTimer = setInterval(tourStep, tourStepMs);
}
function stopTour() {
    if (tourTimer) clearInterval(tourTimer); tourTimer = null;
    tourQueue = []; tourIdx = 0;
    $('btn-tour').textContent = '▶ TOUR';
    $('btn-tour').style.borderColor = '';
    $('btn-tour').style.color = '';
    if (tourPrevSpin) { autoSpin = true; controls.autoRotate = true; }
    stopSpeaking();
}
function speak(text) {
    if (!('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    if (!text) return;
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.0; u.pitch = 1.0; u.volume = 1.0;
    speechSynthesis.speak(u);
}
function stopSpeaking() { if ('speechSynthesis' in window) speechSynthesis.cancel(); }
function toggleNarrate() {
    if (!('speechSynthesis' in window)) { toast('Speech synthesis unavailable in this browser'); return; }
    narrating = !narrating;
    const btn = $('btn-narrate');
    btn.textContent = narrating ? '🔊 NARRATE' : '🔇 NARRATE';
    btn.style.borderColor = narrating ? 'var(--accent)' : '';
    btn.style.color = narrating ? 'var(--accent)' : '';
    if (!narrating) stopSpeaking();
    toast(narrating ? 'Narration on (used during TOUR)' : 'Narration off');
}
function tourStep() {
    if (tourIdx >= tourQueue.length) { stopTour(); stopSpeaking(); toast('Tour complete'); return; }
    const idx = tourQueue[tourIdx];
    selectFragment(idx); flyTo(idx);
    if (narrating) {
        const f = fragments[idx];
        const text = `${f.title || 'untitled'}${f.year ? '. ' + f.year + '.' : '.'} ${f.summary || ''}`.replace(/\s+/g,' ').trim();
        speak(text);
    }
    tourIdx++;
}
function toggleTour() { isTouring() ? stopTour() : startTour(); }
function startSpeechRec() {
    const Cls = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Cls) return;
    speechRec = new Cls();
    speechRec.continuous = true;
    speechRec.interimResults = true;
    speechRec.lang = navigator.language || 'en-US';
    speechFinal = ''; speechInterim = '';
    speechRec.onresult = (ev) => {
        speechInterim = '';
        for (let i = ev.resultIndex; i < ev.results.length; i++) {
            const t = ev.results[i][0].transcript;
            if (ev.results[i].isFinal) speechFinal += t;
            else speechInterim += t;
        }
        const live = $('rec-transcript');
        if (live) live.textContent = (speechFinal + speechInterim).trim();
    };
    speechRec.onerror = (e) => { console.warn('speech rec error', e.error); };
    try { speechRec.start(); } catch {}
}
function stopSpeechRec() {
    if (!speechRec) return;
    try { speechRec.stop(); } catch {}
    speechRec = null;
    return (speechFinal + speechInterim).trim();
}
async function toggleRecording() {
    const btn = $('btn-rec');
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        return;
    }
    if (selectedIdx < 0) { toast('Select a fragment first'); return; }
    if (!navigator.mediaDevices?.getUserMedia) { toast('Microphone API unavailable'); return; }
    let stream;
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
    catch (err) { toast('Mic blocked: ' + err.message); return; }
    const mime = pickRecorderMime();
    try { mediaRecorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined); }
    catch (err) { toast('Recorder error: ' + err.message); stream.getTracks().forEach(t => t.stop()); return; }
    recChunks = [];
    recStart = Date.now();
    btn.textContent = '◼ STOP';
    btn.style.borderColor = '#ff6868'; btn.style.color = '#ff8888';
    if (speechSupported) {
        const live = document.createElement('div');
        live.id = 'rec-transcript';
        live.style.cssText = 'position:fixed;top:80px;left:50%;transform:translateX(-50%);background:var(--panel);border:1px solid var(--accent);color:var(--fg);padding:10px 16px;border-radius:8px;font-size:0.84rem;max-width:60vw;backdrop-filter:blur(10px);box-shadow:var(--shadow);z-index:30;text-align:center';
        live.textContent = '🎙 listening…';
        document.body.appendChild(live);
        startSpeechRec();
    }
    recTimer = setInterval(() => {
        const s = Math.floor((Date.now() - recStart) / 1000);
        btn.textContent = '◼ ' + String(Math.floor(s/60)).padStart(2,'0') + ':' + String(s%60).padStart(2,'0');
    }, 250);
    mediaRecorder.ondataavailable = e => { if (e.data.size > 0) recChunks.push(e.data); };
    mediaRecorder.onstop = async () => {
        clearInterval(recTimer); recTimer = null;
        btn.textContent = 'REC'; btn.style.borderColor = ''; btn.style.color = '';
        const transcript = stopSpeechRec();
        const live = $('rec-transcript'); if (live) live.remove();
        stream.getTracks().forEach(t => t.stop());
        if (recChunks.length === 0) { toast('No audio captured'); mediaRecorder = null; return; }
        const blob = new Blob(recChunks, { type: mime || 'audio/webm' });
        const f = fragments[selectedIdx]; if (!f) return;
        const id = newMediaId();
        await mediaPut(id, blob);
        f.media = f.media || [];
        const dur = ((Date.now() - recStart) / 1000).toFixed(1);
        f.media.push({ id, kind: 'audio', name: `voice-note-${new Date().toISOString().slice(0,16).replace(/[:T]/g,'-')}.webm`, mime: blob.type, size: blob.size, transcript: transcript || undefined });
        if (transcript) {
            const stamp = new Date().toLocaleString();
            const block = `\n\n---\n🎙 ${stamp} (${dur}s)\n${transcript}`;
            f.summary = (f.summary || '') + block;
        }
        saveFragments();
        selectFragment(selectedIdx);
        toast(transcript ? `Saved ${dur}s voice note + transcript` : `Saved ${dur}s voice note`);
        mediaRecorder = null;
    };
    mediaRecorder.start();
    toast('Recording… click again to stop');
}
const GEOCODING_KEY = 'amni-life-geocoding-enabled';
let editGeoLat = null, editGeoLon = null;
async function findGeocode() {
    const raw = $('m-geocode').value.trim();
    if (!raw) { $('geocode-msg').textContent = 'enter a place name or "lat, lon"'; return; }
    const m = raw.match(/^\s*(-?\d{1,3}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)\s*$/);
    if (m) {
        const lat = parseFloat(m[1]), lon = parseFloat(m[2]);
        if (Math.abs(lat) > 90 || Math.abs(lon) > 180) { $('geocode-msg').textContent = 'lat must be ±90, lon must be ±180'; return; }
        editGeoLat = lat; editGeoLon = lon;
        $('geocode-msg').textContent = `→ ${lat.toFixed(4)}, ${lon.toFixed(4)}`;
        return;
    }
    if (localStorage.getItem(GEOCODING_KEY) !== '1') { $('geocode-msg').textContent = 'Enable OpenStreetMap geocoding in CONNECT first (or paste "lat, lon" directly).'; return; }
    $('geocode-msg').textContent = 'looking up via OpenStreetMap…';
    try {
        const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(raw)}`, { headers: { 'Accept-Language': navigator.language || 'en' } });
        if (!r.ok) throw new Error('HTTP ' + r.status);
        const j = await r.json();
        if (j.length === 0) { $('geocode-msg').textContent = 'no match found'; return; }
        const lat = parseFloat(j[0].lat), lon = parseFloat(j[0].lon);
        editGeoLat = lat; editGeoLon = lon;
        $('m-geocode').value = lat.toFixed(4) + ', ' + lon.toFixed(4);
        $('geocode-msg').textContent = `→ ${j[0].display_name}`;
    } catch (err) { $('geocode-msg').textContent = 'lookup failed: ' + err.message; }
}
const GP_CID_KEY = 'amni-life-gphotos-cid';
const GP_TOKEN_KEY = 'amni-life-gphotos-token';
const GP_SCOPE = 'https://www.googleapis.com/auth/photoslibrary.readonly';
const GP_GSI_URL = 'https://accounts.google.com/gsi/client';
let gpTokenClient = null, gpToken = null, gpTokenExpiry = 0;
async function readExif(blob) {
    try {
        const head = await blob.slice(0, Math.min(blob.size, 256 * 1024)).arrayBuffer();
        const v = new DataView(head);
        if (v.byteLength < 4 || v.getUint16(0) !== 0xFFD8) return null;
        let off = 2;
        while (off < v.byteLength - 4) {
            const m = v.getUint16(off);
            if ((m & 0xFF00) !== 0xFF00) break;
            const len = v.getUint16(off + 2);
            if (m === 0xFFE1 && v.byteLength >= off + 10) {
                const sig = String.fromCharCode(v.getUint8(off+4), v.getUint8(off+5), v.getUint8(off+6), v.getUint8(off+7));
                if (sig === 'Exif') return parseTiff(v, off + 10);
            }
            if (m === 0xFFDA || len < 2) break;
            off += 2 + len;
        }
    } catch {}
    return null;
}
function parseTiff(v, base) {
    if (v.byteLength < base + 8) return null;
    const bo = v.getUint16(base);
    const le = bo === 0x4949;
    const u16 = o => v.getUint16(o, le);
    const u32 = o => v.getUint32(o, le);
    if (u16(base + 2) !== 0x002A) return null;
    const ifd0 = base + u32(base + 4);
    const tags0 = readIFD(v, base, ifd0, le);
    let exifPtr = tags0[0x8769];
    let gpsPtr = tags0[0x8825];
    let result = {};
    if (exifPtr) {
        const exif = readIFD(v, base, base + exifPtr, le);
        const dt = exif[0x9003] || exif[0x9004] || tags0[0x0132];
        if (dt) {
            const m = dt.match(/^(\d{4}):(\d{2}):(\d{2})/);
            if (m) result.year = parseInt(m[1], 10);
            result.dateStr = dt.trim();
        }
    } else if (tags0[0x0132]) {
        const m = tags0[0x0132].match(/^(\d{4}):(\d{2}):(\d{2})/);
        if (m) result.year = parseInt(m[1], 10);
        result.dateStr = tags0[0x0132].trim();
    }
    if (gpsPtr) {
        const gps = readIFD(v, base, base + gpsPtr, le);
        const latRef = gps[0x0001], lat = gps[0x0002];
        const lonRef = gps[0x0003], lon = gps[0x0004];
        if (lat && Array.isArray(lat) && lon && Array.isArray(lon)) {
            const dms = a => a[0] + a[1]/60 + a[2]/3600;
            result.lat = dms(lat) * (latRef === 'S' ? -1 : 1);
            result.lon = dms(lon) * (lonRef === 'W' ? -1 : 1);
        }
    }
    return result;
}
function readIFD(v, base, ifdOff, le) {
    const u16 = o => v.getUint16(o, le);
    const u32 = o => v.getUint32(o, le);
    if (ifdOff + 2 > v.byteLength) return {};
    const n = u16(ifdOff);
    const out = {};
    for (let i = 0; i < n; i++) {
        const e = ifdOff + 2 + i * 12;
        if (e + 12 > v.byteLength) break;
        const tag = u16(e);
        const type = u16(e + 2);
        const count = u32(e + 4);
        const valOff = e + 8;
        const sizes = { 1:1, 2:1, 3:2, 4:4, 5:8, 7:1, 9:4, 10:8 };
        const sz = (sizes[type] || 1) * count;
        const dataOff = sz <= 4 ? valOff : base + u32(valOff);
        if (type === 2) {
            try {
                let s = '';
                for (let k = 0; k < count - 1; k++) s += String.fromCharCode(v.getUint8(dataOff + k));
                out[tag] = s;
            } catch {}
        } else if (type === 3) {
            out[tag] = u16(dataOff);
        } else if (type === 4) {
            out[tag] = u32(dataOff);
        } else if (type === 5 && count >= 1) {
            const arr = [];
            for (let k = 0; k < Math.min(count, 4); k++) {
                const num = u32(dataOff + k * 8);
                const den = u32(dataOff + k * 8 + 4);
                arr.push(den ? num / den : 0);
            }
            out[tag] = count === 1 ? arr[0] : arr;
        }
    }
    return out;
}
function pickFolder() { $('folder-input').click(); }
async function readTakeoutSidecar(file) {
    try {
        const text = await file.text();
        const j = JSON.parse(text);
        const ts = j.photoTakenTime?.timestamp || j.creationTime?.timestamp;
        const out = {};
        if (ts) {
            const d = new Date(parseInt(ts, 10) * 1000);
            out.year = d.getFullYear();
            out.dateStr = d.toISOString().slice(0, 19).replace('T', ' ');
        }
        const g = j.geoData || j.geoDataExif;
        if (g && (g.latitude || g.longitude)) { out.lat = g.latitude; out.lon = g.longitude; }
        if (j.title) out.takeoutTitle = j.title;
        if (j.description) out.description = j.description;
        return out;
    } catch { return null; }
}
function indexTakeoutSidecars(files) {
    const map = new Map();
    for (const f of files) {
        const path = f.webkitRelativePath || f.name;
        if (!path.toLowerCase().endsWith('.json')) continue;
        const photoPath = path.replace(/\.json$/i, '');
        map.set(photoPath, f);
        const photoPath2 = path.replace(/\.suppl\.json$/i, '').replace(/\.supplemental-metadata\.json$/i, '').replace(/\.json$/i, '');
        if (photoPath2 !== photoPath) map.set(photoPath2, f);
    }
    return map;
}
async function importFolder(files) {
    if (!dbHandle) { toast('IndexedDB unavailable; can\'t store media'); return; }
    const allFiles = [...files];
    const photos = allFiles.filter(f => f.type.startsWith('image/') || f.type.startsWith('video/'));
    if (photos.length === 0) { toast('No images or videos found in that folder'); return; }
    const sidecarMap = indexTakeoutSidecars(allFiles);
    const prog = $('folder-progress');
    let done = 0, withDate = 0, withGps = 0, withSidecar = 0, errs = 0;
    const startSize = fragments.length;
    const baseId = (n) => 'p' + Date.now().toString(36).slice(-4) + '-' + n.toString(36);
    for (const file of photos) {
        try {
            const path = file.webkitRelativePath || file.name;
            const sf = sidecarMap.get(path);
            const sidecar = sf ? await readTakeoutSidecar(sf) : null;
            if (sidecar) withSidecar++;
            const exif = file.type.startsWith('image/') ? await readExif(file) : null;
            const lm = new Date(file.lastModified);
            const year = sidecar?.year || exif?.year || lm.getFullYear();
            const dateStr = sidecar?.dateStr || exif?.dateStr || lm.toISOString().slice(0, 19).replace('T', ' ');
            const lat = sidecar?.lat ?? exif?.lat;
            const lon = sidecar?.lon ?? exif?.lon;
            if (sidecar?.year || exif?.year) withDate++;
            const tags = [file.type.startsWith('video/') ? 'video' : 'photo'];
            if (typeof lat === 'number') { tags.push('geo'); withGps++; }
            if (sidecar) tags.push('takeout');
            const id = baseId(fragments.length);
            const mediaId = newMediaId();
            await mediaPut(mediaId, file);
            const folderName = (file.webkitRelativePath || '').split('/').slice(0, -1).join('/') || (file.type.startsWith('video/') ? 'videos' : 'photos');
            const summary = `${dateStr}${typeof lat === 'number' ? `\nlat ${lat.toFixed(4)}, lon ${lon.toFixed(4)}` : ''}\n${file.name} · ${(file.size/1024).toFixed(0)} KB${sidecar?.description ? '\n' + sidecar.description : ''}`;
            fragments.push({ id, title: (sidecar?.takeoutTitle || file.name).replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '), kind: 'event', year, summary, tags: [...tags, folderName.split('/').pop()].filter(Boolean), connections: [], lat, lon, media: [{ id: mediaId, kind: file.type.startsWith('video/') ? 'video' : 'image', name: file.name, mime: file.type, size: file.size, lat, lon }] });
            done++;
        } catch (err) { errs++; console.warn('import skip', file.name, err); }
        if (done % 8 === 0 || done === photos.length) prog.textContent = `imported ${done}/${photos.length}…`;
        if (done % 25 === 0) await new Promise(r => setTimeout(r, 0));
    }
    prog.textContent = `done — ${done} imported (${withDate} with date, ${withGps} with GPS, ${withSidecar} via Takeout sidecar, ${errs} skipped)`;
    saveFragments(); rebuildIndex(); recomputeYearBounds();
    await computeLayouts();
    buildPoints(); buildEdges(); renderFragsList(); renderTagFilters(); renderEdgeFilters(); updateStats();
    toast(`Imported ${done}${withSidecar ? ` (${withSidecar} from Takeout)` : ''} · ${fragments.length - startSize} new fragments`);
}
async function loadGSI() {
    if (window.google?.accounts?.oauth2) return true;
    return new Promise((res) => {
        const s = document.createElement('script');
        s.src = GP_GSI_URL; s.async = true; s.defer = true;
        s.onload = () => res(true); s.onerror = () => res(false);
        document.head.appendChild(s);
    });
}
function loadGPState() {
    try { const t = JSON.parse(localStorage.getItem(GP_TOKEN_KEY) || 'null'); if (t && t.exp > Date.now()) { gpToken = t.token; gpTokenExpiry = t.exp; } } catch {}
}
function saveGPToken(token, expiresIn) {
    gpToken = token; gpTokenExpiry = Date.now() + (expiresIn - 60) * 1000;
    try { localStorage.setItem(GP_TOKEN_KEY, JSON.stringify({ token, exp: gpTokenExpiry })); } catch {}
}
function gpStatus(msg) { $('gphotos-status').textContent = msg; }
function gpUpdateUI() {
    const cid = localStorage.getItem(GP_CID_KEY) || '';
    $('gphotos-client-id').value = cid;
    const connected = !!gpToken && Date.now() < gpTokenExpiry;
    $('btn-gphotos-import').disabled = !connected;
    $('btn-gphotos-disconnect').disabled = !connected;
    gpStatus(connected ? `connected · token expires in ${Math.floor((gpTokenExpiry-Date.now())/60000)} min` : (cid ? 'client ID saved · click CONNECT' : 'enter client ID + SAVE first'));
}
function gpSaveCid() {
    const v = $('gphotos-client-id').value.trim();
    if (!v) { toast('Paste a Client ID first'); return; }
    localStorage.setItem(GP_CID_KEY, v); gpUpdateUI();
    toast('Client ID saved');
}
async function gpConnect() {
    const cid = localStorage.getItem(GP_CID_KEY);
    if (!cid) { toast('Save a Client ID first'); return; }
    const ok = await loadGSI();
    if (!ok) { toast('Could not load Google Identity Services (offline?)'); return; }
    gpTokenClient = google.accounts.oauth2.initTokenClient({
        client_id: cid, scope: GP_SCOPE,
        callback: (resp) => { if (resp.access_token) { saveGPToken(resp.access_token, resp.expires_in || 3600); gpUpdateUI(); toast('Connected to Google Photos'); } else { toast('Auth failed: ' + (resp.error || 'unknown')); } }
    });
    gpTokenClient.requestAccessToken({ prompt: '' });
}
function gpDisconnect() {
    gpToken = null; gpTokenExpiry = 0;
    try { localStorage.removeItem(GP_TOKEN_KEY); } catch {}
    if (window.google?.accounts?.oauth2 && gpToken) google.accounts.oauth2.revoke(gpToken, () => {});
    gpUpdateUI(); toast('Disconnected');
}
async function gpImport() {
    if (!gpToken) { toast('Connect first'); return; }
    gpStatus('fetching mediaItems…');
    let added = 0, errs = 0;
    try {
        const r = await fetch('https://photoslibrary.googleapis.com/v1/mediaItems?pageSize=50', { headers: { Authorization: 'Bearer ' + gpToken } });
        if (!r.ok) throw new Error('HTTP ' + r.status);
        const j = await r.json();
        const items = j.mediaItems || [];
        gpStatus(`fetched ${items.length} items, downloading…`);
        for (const item of items) {
            try {
                const isVideo = item.mimeType?.startsWith('video/');
                const url = item.baseUrl + (isVideo ? '=dv' : '=w1280-h1280');
                const blob = await (await fetch(url)).blob();
                const id = 'g' + (item.id || Math.random().toString(36).slice(2)).slice(0, 12);
                const mediaId = newMediaId();
                await mediaPut(mediaId, blob);
                const yr = item.mediaMetadata?.creationTime ? new Date(item.mediaMetadata.creationTime).getFullYear() : null;
                const summary = `${item.mediaMetadata?.creationTime || ''}\n${item.filename || ''}\n${item.mediaMetadata?.width||''}×${item.mediaMetadata?.height||''}`.trim();
                fragments.push({ id, title: (item.filename || 'photo').replace(/\.[^.]+$/, ''), kind: 'event', year: yr, summary, tags: ['google-photos','photo'], connections: [], media: [{ id: mediaId, kind: isVideo ? 'video' : 'image', name: item.filename, mime: item.mimeType }] });
                added++;
                gpStatus(`importing ${added}/${items.length}…`);
            } catch (err) { errs++; console.warn('gp item skip', err); }
        }
        saveFragments(); rebuildIndex();
        await computeLayouts();
        buildPoints(); buildEdges(); renderFragsList(); renderTagFilters(); updateStats();
        gpStatus(`imported ${added} (${errs} skipped) · token good for ${Math.floor((gpTokenExpiry-Date.now())/60000)} min`);
        toast(`Imported ${added} from Google Photos`);
    } catch (err) {
        gpStatus('error: ' + err.message);
        if (String(err).includes('401') || String(err).includes('403')) { gpToken = null; localStorage.removeItem(GP_TOKEN_KEY); gpUpdateUI(); }
    }
}
function openConnect() {
    sharing = false; editingId = null; linkingFrom = null;
    showOnly(['connect-fields']);
    $('modal-save').style.display = 'none';
    loadGPState(); gpUpdateUI();
    $('folder-progress').textContent = '';
    const oh = $('origin-hint'); if (oh) oh.textContent = location.origin;
    openModal('CONNECT TO YOUR LIFE');
}
function fragmentLatLon(f) {
    if (typeof f.lat === 'number' && typeof f.lon === 'number') return [f.lat, f.lon];
    for (const m of f.media || []) if (typeof m.lat === 'number' && typeof m.lon === 'number') return [m.lat, m.lon];
    return null;
}
const GLOBE_R = 22;
function latLonToXYZ(lat, lon, r) {
    const phi = (90 - lat) * Math.PI / 180;
    const theta = (lon + 180) * Math.PI / 180;
    return { x: -r * Math.sin(phi) * Math.cos(theta), y: r * Math.cos(phi), z: r * Math.sin(phi) * Math.sin(theta) };
}
const CONTINENTS = [
    [[71,-156],[68,-141],[60,-141],[57,-135],[55,-130],[52,-130],[49,-124],[47,-124],[40,-124],[34,-120],[32,-117],[27,-112],[23,-106],[18,-104],[16,-95],[18,-92],[18,-87],[21,-87],[18,-77],[15,-83],[10,-83],[8,-78],[6,-77],[1,-79],[-3,-81],[-12,-77],[-17,-71],[-23,-70],[-30,-71],[-37,-73],[-41,-74],[-46,-75],[-53,-72],[-54,-65],[-50,-58],[-39,-62],[-34,-58],[-27,-49],[-22,-42],[-15,-39],[-7,-35],[1,-50],[5,-52],[10,-61],[12,-72],[12,-71],[14,-83],[19,-90],[22,-97],[26,-97],[28,-95],[30,-89],[31,-81],[26,-80],[25,-80],[31,-81],[36,-76],[40,-74],[44,-67],[44,-60],[47,-52],[60,-65],[68,-66],[71,-78],[73,-95],[74,-114],[71,-156]],
    [[37,-9],[44,-9],[44,-1],[51,2],[51,12],[55,8],[57,11],[58,8],[63,5],[71,28],[69,33],[60,30],[60,28],[55,21],[54,12],[51,7],[49,2],[47,-3],[43,-2],[36,-6],[37,-9]],
    [[37,-9],[36,-1],[33,9],[31,29],[30,32],[12,43],[8,49],[-2,42],[-12,40],[-26,33],[-34,26],[-34,18],[-27,15],[-19,12],[-7,9],[5,3],[5,-3],[12,-15],[16,-16],[20,-17],[27,-13],[35,-6],[37,-9]],
    [[71,30],[77,80],[81,100],[71,140],[66,170],[60,170],[55,160],[42,141],[34,131],[31,121],[24,118],[22,114],[10,104],[1,103],[-7,108],[-9,121],[-3,134],[5,121],[14,121],[17,109],[20,93],[16,85],[7,80],[8,77],[18,72],[24,67],[36,52],[40,49],[42,40],[42,30],[37,26],[36,29],[39,28],[42,28],[44,28],[42,27],[42,30],[71,30]],
    [[-12,131],[-12,141],[-26,153],[-39,147],[-31,131],[-32,115],[-21,114],[-12,131]],
    [[12,-72],[2,-79],[-5,-81],[-15,-75],[-23,-70],[-37,-73],[-50,-72],[-55,-65],[-50,-58],[-39,-62],[-34,-58],[-27,-49],[-22,-42],[-15,-39],[-7,-35],[1,-50],[5,-52],[10,-61],[12,-72]]
];
let continentLines = null;
function buildContinents() {
    if (continentLines) { globeGroup?.remove(continentLines); continentLines.geometry.dispose(); continentLines.material.dispose(); continentLines = null; }
    if (!globeGroup) return;
    const positions = [];
    const r = GLOBE_R + 0.15;
    for (const poly of CONTINENTS) {
        for (let i = 0; i < poly.length - 1; i++) {
            const [la1, lo1] = poly[i], [la2, lo2] = poly[i+1];
            const a = latLonToXYZ(la1, lo1, r), b = latLonToXYZ(la2, lo2, r);
            positions.push(a.x, a.y, a.z, b.x, b.y, b.z);
        }
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
    const cs = getComputedStyle(document.documentElement);
    const col = new THREE.Color(cs.getPropertyValue('--accent2').trim() || '#f5c842');
    continentLines = new THREE.LineSegments(geom, new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 0.45, depthWrite: false }));
    globeGroup.add(continentLines);
}
function computeMapLayout() {
    const out = new Array(fragments.length);
    const ungeo = fragments.filter(f => !fragmentLatLon(f)).length;
    let stripIdx = 0;
    const ringR = GLOBE_R * 1.55;
    fragments.forEach((f, i) => {
        const ll = fragmentLatLon(f);
        if (ll) {
            const p = latLonToXYZ(ll[0], ll[1], GLOBE_R + 0.4);
            out[i] = { x: p.x, y: p.y, z: p.z };
        } else {
            const a = ungeo > 1 ? (stripIdx / ungeo) * Math.PI * 2 : 0;
            stripIdx++;
            out[i] = { x: ringR * Math.cos(a), y: -GLOBE_R * 1.4, z: ringR * Math.sin(a) };
        }
    });
    return out;
}
let globeMesh = null, globeGroup = null;
function buildGlobe() {
    if (globeGroup) { scene.remove(globeGroup); globeGroup.traverse(o => { o.geometry?.dispose(); o.material?.dispose(); }); globeGroup = null; globeMesh = null; }
    globeGroup = new THREE.Group();
    const sphereGeom = new THREE.SphereGeometry(GLOBE_R, 32, 24);
    const cs = getComputedStyle(document.documentElement);
    const fillCol = new THREE.Color(cs.getPropertyValue('--bg2').trim() || '#10131a');
    const lineCol = new THREE.Color(cs.getPropertyValue('--accent').trim() || '#7cc4ff');
    const fill = new THREE.Mesh(sphereGeom, new THREE.MeshBasicMaterial({ color: fillCol, transparent: true, opacity: 0.45, depthWrite: false }));
    globeGroup.add(fill);
    const wire = new THREE.Mesh(sphereGeom.clone(), new THREE.MeshBasicMaterial({ color: lineCol, wireframe: true, transparent: true, opacity: 0.18, depthWrite: false }));
    globeGroup.add(wire);
    const ringGeo = new THREE.RingGeometry(GLOBE_R * 1.5, GLOBE_R * 1.6, 96);
    ringGeo.rotateX(-Math.PI / 2);
    ringGeo.translate(0, -GLOBE_R * 1.4, 0);
    const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: lineCol, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false }));
    globeGroup.add(ring);
    globeMesh = globeGroup;
    globeGroup.visible = (currentView === 'map');
    scene.add(globeGroup);
    buildContinents();
}
function setGlobeVisible(v) { if (globeGroup) globeGroup.visible = v; }
function syncGlobeColors() {
    if (!globeGroup) return;
    const cs = getComputedStyle(document.documentElement);
    const fillCol = new THREE.Color(cs.getPropertyValue('--bg2').trim() || '#10131a');
    const lineCol = new THREE.Color(cs.getPropertyValue('--accent').trim() || '#7cc4ff');
    const accent2 = new THREE.Color(cs.getPropertyValue('--accent2').trim() || '#f5c842');
    globeGroup.children[0].material.color = fillCol;
    globeGroup.children[1].material.color = lineCol;
    globeGroup.children[2].material.color = lineCol;
    if (continentLines) continentLines.material.color = accent2;
}
function computeCalendarLayout() {
    const out = new Array(fragments.length);
    const ys = fragments.map(f => f.year).filter(y => typeof y === 'number');
    const ymin = ys.length ? Math.min(...ys) : 2000;
    const ymax = ys.length ? Math.max(...ys) : 2000;
    const yspan = Math.max(1, ymax - ymin);
    const yScale = Math.max(2.6, Math.min(4.0, 50 / Math.max(yspan, 6)));
    const cellCount = new Map();
    fragments.forEach((f, i) => {
        const y = f.year || ymin;
        const m = (f.month && f.month >= 1 && f.month <= 12) ? f.month : ((Math.abs(f.id?.split('').reduce((a,c)=>a+c.charCodeAt(0),0) || i*31) % 12) + 1);
        const key = y + ':' + m;
        const seen = cellCount.get(key) || 0;
        cellCount.set(key, seen + 1);
        const x = (m - 6.5) * 4.5;
        const z = ((y - ymin) - yspan / 2) * yScale;
        const yOffset = seen * 1.6;
        out[i] = { x: x * SCALE * 0.6, y: yOffset * SCALE * 0.6, z: z * SCALE * 0.6 };
    });
    return out;
}
async function computeLayouts() {
    const g = { nodes: fragments.map(f => ({ id: f.id, kind: f.kind, year: f.year || 2000, mass: 1.0 })), edges: edges.map(e => ({ s: e.s, t: e.t })) };
    const json = compute_all(JSON.stringify(g), 220);
    const all = JSON.parse(json);
    const apply = arr => arr.map(p => ({ x: p.x * SCALE, y: p.y * SCALE, z: p.z * SCALE }));
    positions = { timeline: apply(all.timeline), constellation: apply(all.constellation), spiral: apply(all.spiral), cluster: apply(all.cluster), radial: apply(all.radial), map: computeMapLayout(), calendar: computeCalendarLayout() };
}
function makeSpriteTexture() {
    const c = document.createElement('canvas'); c.width = 256; c.height = 256;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(128,128,0,128,128,128);
    g.addColorStop(0,'rgba(255,255,255,1)'); g.addColorStop(0.44,'rgba(255,255,255,1)'); g.addColorStop(0.5,'rgba(255,255,255,0.55)'); g.addColorStop(0.62,'rgba(255,255,255,0.14)'); g.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(0,0,256,256);
    const t = new THREE.CanvasTexture(c); t.needsUpdate = true; return t;
}
let searchFilterActive = false, searchFilterQuery = '';
function isVisible(idx) {
    const f = fragments[idx]; if (!activeKinds.has(f.kind)) return false;
    const y = f.year;
    if (y && (y < activeYearMin || y > activeYearMax)) return false;
    if (activeTags.size > 0 && !(f.tags || []).some(t => activeTags.has(t))) return false;
    if (moodFilterValues.size > 0) {
        const m = typeof f.mood === 'number' ? f.mood : 0;
        if (!moodFilterValues.has(m)) return false;
    }
    if (searchFilterActive && searchFilterQuery) {
        const q = searchFilterQuery.toLowerCase();
        if (!((f.title || '').toLowerCase().includes(q) ||
              (f.summary || '').toLowerCase().includes(q) ||
              (f.tags || []).some(t => t.toLowerCase().includes(q)) ||
              (f.kind || '').toLowerCase() === q ||
              String(f.year || '') === q)) return false;
    }
    return true;
}
function recomputeYearBounds() {
    const ys = fragments.map(f => f.year).filter(y => typeof y === 'number');
    if (ys.length === 0) { yearMin = 1900; yearMax = 2100; }
    else { yearMin = Math.min(...ys); yearMax = Math.max(...ys); }
    activeYearMin = Math.min(activeYearMin, yearMin);
    activeYearMax = Math.max(activeYearMax, yearMax);
    if (activeYearMin < yearMin || activeYearMin > yearMax) activeYearMin = yearMin;
    if (activeYearMax > yearMax || activeYearMax < yearMin) activeYearMax = yearMax;
    const lo = $('year-min'), hi = $('year-max');
    if (lo && hi) {
        lo.min = yearMin; lo.max = yearMax; lo.value = activeYearMin;
        hi.min = yearMin; hi.max = yearMax; hi.value = activeYearMax;
        $('year-lo').textContent = activeYearMin;
        $('year-hi').textContent = activeYearMax;
    }
}
let timelineAxis = null;
function buildTimelineAxis() {
    if (timelineAxis) { scene.remove(timelineAxis); timelineAxis.geometry.dispose(); timelineAxis.material.dispose(); timelineAxis = null; }
    const arr = positions.timeline; if (!arr || arr.length === 0) return;
    let xMin = Infinity, xMax = -Infinity;
    for (const p of arr) { if (p.x < xMin) xMin = p.x; if (p.x > xMax) xMax = p.x; }
    if (!Number.isFinite(xMin)) return;
    const pad = (xMax - xMin) * 0.05 + 1;
    const cs = getComputedStyle(document.documentElement);
    const col = new THREE.Color(cs.getPropertyValue('--accent').trim() || '#7cc4ff');
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([xMin - pad, 0, 0, xMax + pad, 0, 0]), 3));
    timelineAxis = new THREE.Line(g, new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 0.18, depthWrite: false }));
    timelineAxis.visible = (currentView === 'timeline');
    scene.add(timelineAxis);
}
function setTimelineAxisVisible(v) { if (timelineAxis) timelineAxis.visible = v; }
function fragmentColor(f) {
    if (moodOverlay) {
        const m = (typeof f.mood === 'number') ? Math.max(-2, Math.min(2, f.mood)) : 0;
        return MOOD_COLORS[String(m)] || MOOD_COLORS['0'];
    }
    return KIND_COLORS[f.kind] || '#cccccc';
}
function buildPoints() {
    if (pointsMesh) { scene.remove(pointsMesh); pointsMesh.geometry.dispose(); pointsMesh.material.dispose(); }
    const n = fragments.length;
    const geom = new THREE.BufferGeometry();
    const pos = new Float32Array(n * 3);
    const col = new Float32Array(n * 3);
    const siz = new Float32Array(n);
    const hi = new Float32Array(n);
    const alpha = new Float32Array(n).fill(1.0);
    const src = positions[currentView] || positions.constellation;
    for (let i = 0; i < n; i++) {
        pos[i*3] = src[i].x; pos[i*3+1] = src[i].y; pos[i*3+2] = src[i].z;
        const c = new THREE.Color(fragmentColor(fragments[i]));
        col[i*3] = c.r; col[i*3+1] = c.g; col[i*3+2] = c.b;
        siz[i] = (KIND_SIZE[fragments[i].kind] || 1.0) * (isVisible(i) ? 1.0 : 0.0);
        hi[i] = 0.0;
        if (scrubYear !== null) { const y = fragments[i].year; alpha[i] = (!y || y <= scrubYear) ? 1.0 : 0.14; }
    }
    geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geom.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geom.setAttribute('size', new THREE.BufferAttribute(siz, 1));
    geom.setAttribute('aHi', new THREE.BufferAttribute(hi, 1));
    geom.setAttribute('aAlpha', new THREE.BufferAttribute(alpha, 1));
    const themeMul = (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--canvas-mul')) || 1.0) * userDotSize;
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    const mat = new THREE.ShaderMaterial({
        uniforms: { uMap: { value: makeSpriteTexture() }, uPixelRatio: { value: window.devicePixelRatio || 1 }, uTime: { value: 0 }, uMul: { value: themeMul } },
        vertexShader: `attribute float size;attribute float aHi;attribute float aAlpha;varying vec3 vColor;varying float vHi;varying float vAlpha;uniform float uPixelRatio;uniform float uMul;void main(){vColor=color;vHi=aHi;vAlpha=aAlpha;vec4 mv=modelViewMatrix*vec4(position,1.0);float boost=1.0+aHi*0.9;gl_PointSize=size*900.0*uPixelRatio*boost*uMul/(-mv.z);gl_Position=projectionMatrix*mv;}`,
        fragmentShader: `varying vec3 vColor;varying float vHi;varying float vAlpha;uniform sampler2D uMap;void main(){vec4 t=texture2D(uMap,gl_PointCoord);if(t.a<0.04)discard;vec3 col=vColor*(1.0+vHi*0.6);gl_FragColor=vec4(col,t.a*vAlpha);}`,
        vertexColors: true, transparent: true, depthWrite: false, blending: isLight ? THREE.NormalBlending : THREE.AdditiveBlending
    });
    pointsMesh = new THREE.Points(geom, mat);
    scene.add(pointsMesh);
}
function setHilite(idx, val) {
    if (!pointsMesh) return;
    const a = pointsMesh.geometry.attributes.aHi;
    if (idx >= 0 && idx < a.count) { a.array[idx] = val; a.needsUpdate = true; }
}
function clearHilites() {
    if (!pointsMesh) return;
    const a = pointsMesh.geometry.attributes.aHi;
    a.array.fill(0); a.needsUpdate = true;
}
function updateScrubAlpha() {
    if (!pointsMesh) return;
    const aa = pointsMesh.geometry.attributes.aAlpha; if (!aa) return;
    for (let i = 0; i < fragments.length; i++) { const y = fragments[i].year; aa.array[i] = (scrubYear === null || !y || y <= scrubYear) ? 1.0 : 0.14; }
    aa.needsUpdate = true;
}
function resetScrubAlpha() {
    if (!pointsMesh) return;
    const aa = pointsMesh.geometry.attributes.aAlpha; if (!aa) return;
    aa.array.fill(1.0); aa.needsUpdate = true;
}
function toggleScrubber() {
    scrubActive = !scrubActive;
    $('scrubber-bar').classList.toggle('show', scrubActive);
    const btn = $('btn-scrub');
    if (btn) { btn.style.borderColor = scrubActive ? 'var(--accent2)' : ''; btn.style.color = scrubActive ? 'var(--accent2)' : ''; }
    if (scrubActive) {
        $('scrub-range').min = yearMin; $('scrub-range').max = yearMax; $('scrub-range').value = yearMin;
        $('scrub-year-label').textContent = yearMin; $('scrub-year-end').textContent = yearMax;
        scrubYear = yearMin; updateScrubAlpha();
    } else {
        if (scrubPlayTimer) { clearInterval(scrubPlayTimer); scrubPlayTimer = null; scrubPlaying = false; $('scrub-play').textContent = '▶'; }
        scrubYear = null; resetScrubAlpha();
    }
    snd('view');
}
function scrubPlayPause() {
    scrubPlaying = !scrubPlaying;
    $('scrub-play').textContent = scrubPlaying ? '⏸' : '▶';
    if (scrubPlaying) {
        scrubPlayTimer = setInterval(() => {
            const cur = parseInt($('scrub-range').value, 10);
            if (cur >= yearMax) { scrubPlaying = false; $('scrub-play').textContent = '▶'; clearInterval(scrubPlayTimer); scrubPlayTimer = null; return; }
            const next = cur + 1; $('scrub-range').value = next; $('scrub-year-label').textContent = next; scrubYear = next; updateScrubAlpha();
        }, SCRUB_SPEEDS[scrubSpeedIdx]);
    } else { clearInterval(scrubPlayTimer); scrubPlayTimer = null; }
}
function cycleScrubSpeed() {
    if (scrubPlaying) { clearInterval(scrubPlayTimer); scrubPlayTimer = null; }
    scrubSpeedIdx = (scrubSpeedIdx + 1) % SCRUB_SPEEDS.length;
    const labels = ['×1','×2','×5'];
    $('scrub-speed').textContent = labels[scrubSpeedIdx];
    if (scrubPlaying) { scrubPlaying = false; scrubPlayPause(); }
}
function toggleFocus() {
    focusMode = !focusMode;
    document.body.classList.toggle('focus-mode', focusMode);
    $('focus-hint').classList.toggle('show', focusMode);
    const btn = $('btn-focus');
    if (btn) { btn.style.borderColor = focusMode ? 'var(--accent)' : ''; btn.style.color = focusMode ? 'var(--accent)' : ''; btn.textContent = focusMode ? '◉ FOCUS' : '○ FOCUS'; }
    toast(focusMode ? 'Focus mode · press F or Esc to exit' : 'Focus mode off');
}
function exportCSV() {
    const sep = ',', q = v => (typeof v === 'string' && (v.includes(sep) || v.includes('"') || v.includes('\n'))) ? `"${v.replace(/"/g,'""')}"` : (v === null || v === undefined ? '' : v);
    const hdr = ['id','title','kind','year','month','day','tags','summary','mood','lat','lon','connections','media'];
    const rows = fragments.map(f => [f.id,f.title||'',f.kind,f.year||'',f.month||'',f.day||'',(f.tags||[]).join(';'),(f.summary||'').replace(/\n/g,' '),typeof f.mood==='number'?f.mood:'',typeof f.lat==='number'?f.lat:'',typeof f.lon==='number'?f.lon:'',(f.connections||[]).length,(f.media||[]).length].map(q));
    const csv = [hdr,...rows].map(r=>r.join(sep)).join('\n');
    const blob = new Blob(['﻿'+csv],{type:'text/csv;charset=utf-8;'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'amni-life.csv'; a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),60000);
    toast('CSV exported · '+fragments.length+' rows');
}
function buildEdges() {
    if (edgesMesh) { scene.remove(edgesMesh); edgesMesh.geometry.dispose(); edgesMesh.material.dispose(); edgesMesh = null; }
    if (!showEdges || edges.length === 0) return;
    const src = positions[currentView] || positions.constellation;
    const visible = edges.filter(e => isVisible(e.s) && isVisible(e.t) && activeEdgeTypes.has(e.type || 'with'));
    if (visible.length === 0) return;
    const pos = new Float32Array(visible.length * 6);
    const col = new Float32Array(visible.length * 6);
    visible.forEach((e, i) => {
        const a = src[e.s], b = src[e.t];
        pos[i*6]=a.x; pos[i*6+1]=a.y; pos[i*6+2]=a.z;
        pos[i*6+3]=b.x; pos[i*6+4]=b.y; pos[i*6+5]=b.z;
        const ca = new THREE.Color(KIND_COLORS[fragments[e.s].kind] || '#888');
        const cb = new THREE.Color(KIND_COLORS[fragments[e.t].kind] || '#888');
        col[i*6]=ca.r; col[i*6+1]=ca.g; col[i*6+2]=ca.b;
        col[i*6+3]=cb.r; col[i*6+4]=cb.g; col[i*6+5]=cb.b;
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.userData.visible = visible;
    const m = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.22, depthWrite: false });
    edgesMesh = new THREE.LineSegments(g, m);
    scene.add(edgesMesh);
}
function syncEdgePositions() {
    if (!edgesMesh) return;
    const src = positions[currentView] || positions.constellation;
    const visible = edgesMesh.geometry.userData.visible || edges;
    const pa = edgesMesh.geometry.attributes.position;
    visible.forEach((e, i) => {
        const a = src[e.s], b = src[e.t];
        pa.array[i*6]=a.x; pa.array[i*6+1]=a.y; pa.array[i*6+2]=a.z;
        pa.array[i*6+3]=b.x; pa.array[i*6+4]=b.y; pa.array[i*6+5]=b.z;
    });
    pa.needsUpdate = true;
}
function viewExtent(view) {
    const a = positions[view] || [];
    let max = 0;
    for (const p of a) { const r = Math.max(Math.abs(p.x), Math.abs(p.y), Math.abs(p.z)); if (r > max) max = r; }
    return Math.max(max, 6);
}
function fitCameraToView(view) {
    const ext = viewExtent(view);
    const fovRad = camera.fov * Math.PI / 180;
    const dist = (ext * 1.35) / Math.tan(fovRad / 2) * 0.65 + ext * 0.4;
    camSrc = camera.position.clone();
    camTgtSrc = controls.target.clone();
    const dir = new THREE.Vector3().subVectors(camera.position, controls.target).normalize();
    camDst = new THREE.Vector3(dir.x * dist, dir.y * dist + ext * 0.18, dir.z * dist);
    camTgtDst = new THREE.Vector3(0, 0, 0);
    camT = 0.0;
    controls.maxDistance = Math.max(220, dist * 3);
}
function setView(view, animate = true) {
    if (!positions[view]) return;
    if (view === currentView && animate) return;
    snd('view');
    currentView = view;
    localStorage.setItem(VIEW_KEY, view);
    setGlobeVisible(view === 'map');
    setTimelineAxisVisible(view === 'timeline');
    if (animate && pointsMesh) {
        lerpSrc = pointsMesh.geometry.attributes.position.array.slice();
        lerpDst = new Float32Array(fragments.length * 3);
        const dst = positions[view];
        for (let i = 0; i < fragments.length; i++) { lerpDst[i*3] = dst[i].x; lerpDst[i*3+1] = dst[i].y; lerpDst[i*3+2] = dst[i].z; }
        lerpT = 0.0;
        fitCameraToView(view);
    } else {
        buildPoints(); buildEdges();
    }
    $('view-select').value = view;
}
function flyTo(idx) {
    if (idx < 0 || idx >= fragments.length) return;
    const p = positions[currentView][idx];
    const dist = Math.max(8, controls.target.distanceTo(camera.position) * 0.6);
    const dir = new THREE.Vector3().subVectors(camera.position, controls.target).normalize();
    camSrc = camera.position.clone();
    camDst = new THREE.Vector3(p.x + dir.x * dist, p.y + dir.y * dist + 2, p.z + dir.z * dist);
    camTgtSrc = controls.target.clone();
    camTgtDst = new THREE.Vector3(p.x, p.y, p.z);
    camT = 0.0;
}
async function renderWaveform(blob, w = 160, h = 80) {
    try {
        const ab = await blob.arrayBuffer();
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const buf = await ctx.decodeAudioData(ab.slice(0));
        const data = buf.getChannelData(0);
        const samples = 60;
        const block = Math.floor(data.length / samples);
        const peaks = new Array(samples);
        for (let i = 0; i < samples; i++) {
            let mx = 0;
            for (let j = 0; j < block; j++) { const v = Math.abs(data[i*block + j] || 0); if (v > mx) mx = v; }
            peaks[i] = mx;
        }
        ctx.close();
        const c = document.createElement('canvas'); c.width = w; c.height = h;
        const cc = c.getContext('2d');
        const cs = getComputedStyle(document.documentElement);
        const accent = cs.getPropertyValue('--accent').trim() || '#7cc4ff';
        cc.fillStyle = accent; cc.globalAlpha = 0.6;
        const bw = w / samples;
        for (let i = 0; i < samples; i++) {
            const bh = Math.max(1, peaks[i] * h * 0.85);
            cc.fillRect(i * bw, (h - bh) / 2, Math.max(1, bw - 1), bh);
        }
        return c.toDataURL();
    } catch { return null; }
}
async function renderMediaGallery(f) {
    const el = $('detail-media'); el.innerHTML = '';
    const items = f.media || [];
    if (items.length === 0) { el.style.display = 'none'; return; }
    el.style.display = 'grid';
    const lbItems = [];
    for (const m of items) {
        const url = await mediaURL(m.id);
        if (!url) continue;
        const tile = document.createElement('div'); tile.className = 'media-tile';
        if (m.kind === 'image') tile.innerHTML = `<img src="${url}" alt="${m.name||''}" loading="lazy"/>`;
        else if (m.kind === 'video') tile.innerHTML = `<video src="${url}" controls muted preload="metadata"></video>`;
        else if (m.kind === 'audio') {
            const blob = await mediaGet(m.id);
            const wave = blob ? await renderWaveform(blob) : null;
            tile.innerHTML = `${wave ? `<img class="wave" src="${wave}" alt="waveform" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0.6"/>` : ''}<audio src="${url}" controls style="position:absolute;left:8px;right:8px;bottom:8px;width:calc(100% - 16px)"></audio>`;
            tile.classList.add('audio-tile');
        }
        const x = document.createElement('button'); x.className = 'media-x'; x.textContent = '×';
        x.onclick = async (ev) => { ev.stopPropagation(); await mediaDelete(m.id); f.media = (f.media||[]).filter(z => z.id !== m.id); saveFragments(); selectFragment(selectedIdx); };
        tile.appendChild(x);
        const lbIdx = lbItems.length;
        lbItems.push({ id: m.id, url, kind: m.kind, name: m.name, mime: m.mime, lat: m.lat, lon: m.lon, rotation: m.rotation || 0 });
        if (m.rotation && (m.kind === 'image' || m.kind === 'video')) {
            const inner = tile.querySelector('img,video');
            if (inner) inner.style.transform = `rotate(${m.rotation}deg)`;
        }
        if (m.kind === 'image' || m.kind === 'video') tile.onclick = (ev) => { if (ev.target === x) return; openLightbox(lbItems, lbIdx); };
        el.appendChild(tile);
    }
}
function openLightbox(items, startIdx) {
    lightboxItems = items.filter(i => i.kind === 'image' || i.kind === 'video');
    lightboxIdx = Math.max(0, Math.min(startIdx, lightboxItems.length - 1));
    if (lightboxItems.length === 0) return;
    renderLightbox();
    $('lightbox').classList.add('open');
}
function closeLightbox() { $('lightbox').classList.remove('open'); $('lightbox-stage').innerHTML = ''; }
function lightboxStep(d) {
    if (lightboxItems.length === 0) return;
    lightboxIdx = (lightboxIdx + d + lightboxItems.length) % lightboxItems.length;
    renderLightbox();
}
function renderLightbox() {
    const m = lightboxItems[lightboxIdx]; if (!m) return;
    const stage = $('lightbox-stage');
    const rot = m.rotation || 0;
    const transform = rot ? ` style="transform:rotate(${rot}deg)"` : '';
    stage.innerHTML = m.kind === 'video' ? `<video src="${m.url}" controls autoplay${transform}></video>` : `<img src="${m.url}" alt="${m.name||''}"${transform}/>`;
    const meta = `${m.name || ''}${m.lat !== undefined ? ` · ${m.lat.toFixed(3)}, ${m.lon.toFixed(3)}` : ''} · ${lightboxIdx + 1}/${lightboxItems.length}`;
    $('lightbox-meta').textContent = meta;
}
function rotateLightbox() {
    const m = lightboxItems[lightboxIdx]; if (!m || m.kind === 'audio') return;
    m.rotation = ((m.rotation || 0) + 90) % 360;
    if (selectedIdx >= 0) {
        const f = fragments[selectedIdx];
        const realM = (f.media || []).find(x => x.id === m.id || x.name === m.name);
        if (realM) { realM.rotation = m.rotation; saveFragments(); }
    }
    renderLightbox();
}
const MD_ESCAPE = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
function renderMarkdown(src, highlight) {
    if (!src) return '';
    let s = MD_ESCAPE(src);
    s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" style="color:var(--accent)">$1</a>');
    s = s.replace(/(^|[^*])\*\*([^*\n]+)\*\*/g, '$1<strong>$2</strong>');
    s = s.replace(/(^|[^*_])\*([^*\n]+)\*/g, '$1<em>$2</em>');
    s = s.replace(/(^|[^_])_([^_\n]+)_/g, '$1<em>$2</em>');
    s = s.replace(/`([^`\n]+)`/g, '<code style="background:var(--bg);padding:1px 5px;border-radius:3px;font-size:0.8em">$1</code>');
    s = s.replace(/\n/g, '<br/>');
    if (highlight && highlight.length >= 2) {
        const escaped = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        try { s = s.replace(new RegExp(`(${escaped})`, 'gi'), '<mark style="background:rgba(245,200,66,0.45);color:inherit;padding:0 2px;border-radius:2px">$1</mark>'); } catch {}
    }
    return s;
}
function activeSearchQuery() {
    if (searchFilterActive && searchFilterQuery) return searchFilterQuery;
    const live = $('search')?.value?.trim();
    return live && live.length >= 2 ? live : '';
}
function findPath(srcIdx, dstIdx) {
    if (srcIdx < 0 || dstIdx < 0 || srcIdx === dstIdx) return;
    const adj = new Map();
    fragments.forEach((f, i) => {
        const list = adj.get(i) || [];
        (f.connections || []).forEach(c => { const j = idToIdx.get(c.to); if (j !== undefined) list.push(j); });
        adj.set(i, list);
    });
    fragments.forEach((f, i) => {
        (f.connections || []).forEach(c => {
            const j = idToIdx.get(c.to); if (j === undefined) return;
            const back = adj.get(j) || []; if (!back.includes(i)) back.push(i); adj.set(j, back);
        });
    });
    const visited = new Set([srcIdx]);
    const parent = new Map();
    const q = [srcIdx];
    while (q.length) {
        const u = q.shift(); if (u === dstIdx) break;
        for (const v of (adj.get(u) || [])) {
            if (visited.has(v)) continue;
            visited.add(v); parent.set(v, u); q.push(v);
        }
    }
    if (!parent.has(dstIdx) && srcIdx !== dstIdx) { toast(`No path from "${fragments[srcIdx].title}" to "${fragments[dstIdx].title}"`); return; }
    pathHighlight.clear(); pathEdges.clear();
    let cur = dstIdx; pathHighlight.add(cur);
    const seq = [cur];
    while (parent.has(cur)) { const p = parent.get(cur); pathHighlight.add(p); seq.push(p); cur = p; }
    seq.reverse();
    for (let i = 0; i < seq.length - 1; i++) pathEdges.add(seq[i] + ':' + seq[i+1]);
    fragments.forEach((_, i) => setHilite(i, pathHighlight.has(i) ? 1.2 : 0));
    renderFragsList();
    toast(`Path: ${seq.length - 1} hops · ${seq.map(i => fragments[i].title).join(' → ')}`);
}
function clearPath() { pathHighlight.clear(); pathEdges.clear(); clearHilites(); renderFragsList(); }
const STOPWORDS = new Set(['the','a','an','of','in','on','at','to','and','or','for','with','by','from','that','this','it','its','was','were','is','are','be','been','as','my','your','our','i','we','you','they','their','them','he','she','him','her','his','hers','what','who','when','where','how','why','one','two','three','first','last','some','any','all','no','not','do','did','done','have','has','had','will','would','could','should','may','can','if','but','so','than','then','too','very','just','really']);
function tokens(text) {
    return (text || '').toLowerCase().match(/[a-z]+/g)?.filter(w => w.length > 2 && !STOPWORDS.has(w)) || [];
}
function findRelated(idx, max = 4) {
    const f = fragments[idx]; if (!f) return [];
    const fTokens = new Set([...tokens(f.title), ...tokens(f.summary)]);
    const fTags = new Set(f.tags || []);
    const existingLinks = new Set((f.connections || []).map(c => c.to));
    const fYear = f.year;
    const scored = [];
    fragments.forEach((g, j) => {
        if (j === idx || existingLinks.has(g.id)) return;
        let score = 0;
        const gTags = new Set(g.tags || []);
        const tagOverlap = [...gTags].filter(t => fTags.has(t)).length;
        score += tagOverlap * 4;
        const gTokens = new Set([...tokens(g.title), ...tokens(g.summary)]);
        const wordOverlap = [...gTokens].filter(w => fTokens.has(w)).length;
        score += wordOverlap * 1.5;
        if (fYear && g.year) {
            const dy = Math.abs(fYear - g.year);
            if (dy === 0) score += 2; else if (dy <= 1) score += 1.2; else if (dy <= 3) score += 0.6;
        }
        if (score >= 3) scored.push({ j, score, tagOverlap, wordOverlap });
    });
    return scored.sort((a, b) => b.score - a.score).slice(0, max);
}
function renderSuggester(idx) {
    const wrap = $('suggester'); const body = $('suggester-body');
    if (!wrap || !body) return;
    const rel = findRelated(idx);
    if (rel.length === 0) { wrap.style.display = 'none'; return; }
    body.innerHTML = '';
    const f = fragments[idx];
    rel.forEach(({ j, score }) => {
        const g = fragments[j];
        const row = document.createElement('div'); row.className = 'sg-row';
        row.innerHTML = `<span class="sg-title">${g.title || '(untitled)'}<span class="sg-score">· score ${score.toFixed(1)}</span></span><button class="sg-link">+ link</button>`;
        const btn = row.querySelector('.sg-link');
        btn.onclick = () => {
            f.connections = f.connections || [];
            if (!f.connections.some(c => c.to === g.id)) f.connections.push({ to: g.id, type: 'with' });
            saveFragments(); rebuildIndex();
            row.classList.add('linked');
            btn.textContent = 'linked';
            btn.disabled = true;
            buildEdges(); renderEdgeFilters();
            const conns = $('detail-connections');
            const newRow = document.createElement('div'); newRow.className = 'conn';
            newRow.innerHTML = `<span>${g.title || '(untitled)'}</span><span class="conn-type">with</span>`;
            newRow.onclick = () => { selectFragment(j); flyTo(j); renderFragsList(); };
            conns.appendChild(newRow);
        };
        body.appendChild(row);
    });
    wrap.style.display = '';
}
function backlinks(idx) {
    const id = fragments[idx]?.id; if (!id) return [];
    return fragments.map((f, i) => ({ f, i })).filter(({ f, i }) => i !== idx && (f.connections || []).some(c => c.to === id));
}
function selectFragment(idx) {
    clearHilites();
    if (hoveredIdx >= 0) setHilite(hoveredIdx, 0.6);
    if (idx !== selectedIdx && idx >= 0) snd('select');
    selectedIdx = idx;
    if (idx >= 0) setHilite(idx, 1.4);
    if (idx < 0) { $('detail').classList.remove('open'); return; }
    const f = fragments[idx];
    $('detail-kind').textContent = f.kind.toUpperCase();
    $('detail-kind').style.color = KIND_COLORS[f.kind];
    const titleEl = $('detail-title');
    titleEl.textContent = f.title || '(untitled)';
    titleEl.classList.add('editable-title');
    titleEl.title = 'Click to edit';
    titleEl.onclick = startTitleEdit;
    const kindEl = $('detail-kind');
    kindEl.classList.add('editable-kind');
    kindEl.title = 'Click to change kind';
    kindEl.onclick = startKindEdit;
    const pin = $('btn-pin');
    pin.textContent = f.pinned ? '★' : '☆';
    pin.classList.toggle('pinned', !!f.pinned);
    const ll = fragmentLatLon(f);
    const llStr = ll ? ' · ' + ll[0].toFixed(2) + ',' + ll[1].toFixed(2) : '';
    $('detail-meta').textContent = (f.year ? f.year + ' · ' : '') + f.kind + ' · ' + f.id + ((f.media||[]).length ? ' · ' + f.media.length + ' media' : '') + llStr;
    const sumEl = $('detail-summary');
    sumEl.innerHTML = renderMarkdown(f.summary || '', activeSearchQuery());
    sumEl.classList.add('editable-summary');
    sumEl.title = 'Click to edit';
    sumEl.onclick = startSummaryEdit;
    const tagsEl = $('detail-tags'); tagsEl.innerHTML = '';
    (f.tags || []).forEach(t => {
        const el = document.createElement('span'); el.className = 'tag';
        el.innerHTML = `${t}<span class="tag-x" title="Remove tag">×</span>`;
        el.onclick = (ev) => {
            if (ev.target.classList.contains('tag-x')) { removeFragmentTag(idx, t); ev.stopPropagation(); return; }
            toggleTag(t);
        };
        tagsEl.appendChild(el);
    });
    renderMediaGallery(f);
    const connEl = $('detail-connections'); connEl.innerHTML = '';
    const conns = (f.connections || []).map(c => ({ ...c, idx: idToIdx.get(c.to) })).filter(c => c.idx !== undefined);
    if (conns.length === 0) connEl.innerHTML = '<div style="color:var(--dim);font-size:0.74rem;font-style:italic">no connections yet</div>';
    conns.forEach(c => {
        const row = document.createElement('div'); row.className = 'conn';
        const tgt = fragments[c.idx];
        row.innerHTML = `<span>${tgt.title || '(untitled)'}</span><span class="conn-type">${c.type || 'with'}</span>`;
        row.onclick = () => { selectFragment(c.idx); flyTo(c.idx); renderFragsList(); };
        connEl.appendChild(row);
    });
    const backs = backlinks(idx);
    const backEl = $('detail-backlinks'), backTitle = $('detail-back-title');
    backEl.innerHTML = '';
    if (backs.length === 0) { backTitle.style.display = 'none'; }
    else {
        backTitle.style.display = '';
        backs.forEach(({ f: bf, i: bi }) => {
            const c = (bf.connections || []).find(x => x.to === f.id);
            const row = document.createElement('div'); row.className = 'conn';
            row.innerHTML = `<span>${bf.title || '(untitled)'}</span><span class="conn-type">← ${c?.type || 'links'}</span>`;
            row.onclick = () => { selectFragment(bi); flyTo(bi); renderFragsList(); };
            backEl.appendChild(row);
        });
    }
    $('detail').classList.add('open');
    renderFragsList();
    renderSuggester(idx);
}
function updateMultiUI() {
    const m = $('fragslist-multi');
    if (multiSelected.size === 0) m.style.display = 'none';
    else { m.style.display = ''; $('multi-count').textContent = multiSelected.size; }
}
function clearMulti() { multiSelected.clear(); updateMultiUI(); renderFragsList(); }
function renderFragsList() {
    const body = $('fragslist-body'); body.innerHTML = '';
    const sorted = fragments.map((f,i)=>({f,i})).sort((a,b) => {
        const ap = a.f.pinned ? 1 : 0, bp = b.f.pinned ? 1 : 0;
        if (ap !== bp) return bp - ap;
        if (a.f.pinned && b.f.pinned) {
            const ao = typeof a.f.pinOrder === 'number' ? a.f.pinOrder : 999;
            const bo = typeof b.f.pinOrder === 'number' ? b.f.pinOrder : 999;
            if (ao !== bo) return ao - bo;
        }
        return (a.f.year||9999) - (b.f.year||9999);
    });
    sorted.forEach(({f,i}) => {
        const row = document.createElement('div');
        let cls = 'frag-row' + (i === selectedIdx ? ' active' : '');
        if (multiSelected.has(i)) cls += ' multi';
        if (pathHighlight.has(i)) cls += ' path';
        if (f.pinned) { cls += ' pinned'; row.draggable = true; row.dataset.id = f.id; }
        row.className = cls;
        const pinIcon = f.pinned ? '<span class="frag-pin">★</span>' : '';
        const recurIcon = f.recurring === 'yearly' ? '<span class="frag-pin" style="color:var(--accent)" title="Yearly recurring">↻</span>' : '';
        row.innerHTML = `<span class="frag-dot" style="background:${KIND_COLORS[f.kind]}"></span>${pinIcon}${recurIcon}<span class="frag-title">${f.title || '(untitled)'}</span><span class="frag-year">${f.year || ''}</span>`;
        if (f.pinned) {
            row.ondragstart = (e) => { e.dataTransfer.setData('text/plain', f.id); e.dataTransfer.effectAllowed = 'move'; row.style.opacity = '0.4'; };
            row.ondragend = () => { row.style.opacity = '1'; };
            row.ondragover = (e) => { if (!fragments.find(x => x.id === e.dataTransfer.types && x.pinned)) {} e.preventDefault(); e.dataTransfer.dropEffect = 'move'; row.style.background = 'rgba(245,200,66,0.18)'; };
            row.ondragleave = () => { row.style.background = ''; };
            row.ondrop = (e) => {
                e.preventDefault(); row.style.background = '';
                const draggedId = e.dataTransfer.getData('text/plain');
                if (!draggedId || draggedId === f.id) return;
                reorderPinnedFragments(draggedId, f.id);
            };
        }
        row.onclick = (e) => {
            if (e.shiftKey) {
                multiSelected.has(i) ? multiSelected.delete(i) : multiSelected.add(i);
                row.classList.toggle('multi');
                updateMultiUI();
                return;
            }
            if (e.altKey && selectedIdx >= 0 && selectedIdx !== i) { findPath(selectedIdx, i); return; }
            selectFragment(i); flyTo(i);
        };
        body.appendChild(row);
    });
    updateMultiUI();
}
async function multiDelete() {
    if (multiSelected.size === 0) return;
    if (!confirm(`Delete ${multiSelected.size} fragments? Connections to/from them will also be removed.`)) return;
    const toDel = new Set([...multiSelected].map(i => fragments[i].id));
    fragments = fragments.filter(f => !toDel.has(f.id));
    fragments.forEach(f => { f.connections = (f.connections || []).filter(c => !toDel.has(c.to)); });
    saveFragments(); rebuildIndex(); recomputeYearBounds();
    await computeLayouts();
    buildPoints(); buildEdges(); renderFragsList(); renderTagFilters(); renderEdgeFilters();
    multiSelected.clear(); selectFragment(-1);
    updateStats();
    toast(`Deleted ${toDel.size} fragments`);
}
function multiAddTag() {
    if (multiSelected.size === 0) return;
    const tag = prompt(`Tag to add to ${multiSelected.size} fragments:`, '');
    if (!tag) return;
    const t = tag.trim().replace(/^#/, '');
    if (!t) return;
    multiSelected.forEach(i => {
        const f = fragments[i]; f.tags = f.tags || [];
        if (!f.tags.includes(t)) f.tags.push(t);
    });
    saveFragments();
    renderTagFilters(); renderFragsList();
    if (selectedIdx >= 0) selectFragment(selectedIdx);
    toast(`Tagged ${multiSelected.size} fragments with #${t}`);
}
function kindCounts() {
    const m = {};
    allKinds().forEach(k => m[k] = 0);
    fragments.forEach(f => { if (m[f.kind] !== undefined) m[f.kind]++; });
    return m;
}
function renderFilters() {
    const f = $('filters'); f.innerHTML = '';
    const counts = kindCounts();
    allKinds().forEach(k => {
        const chip = document.createElement('div');
        chip.className = 'chip' + (activeKinds.has(k) ? '' : ' off');
        const isCustom = customKinds.some(c => c.name === k);
        const customBadge = isCustom ? `<span style="font-size:0.55rem;color:var(--dim);margin-left:auto">·custom</span>` : '';
        chip.innerHTML = `<span class="chip-dot" style="background:${KIND_COLORS[k]}"></span>${k}${customBadge}<span class="chip-count">${counts[k]}</span>`;
        chip.onclick = (ev) => {
            if (ev.shiftKey && isCustom) {
                if (confirm(`Remove custom kind "${k}"? Existing fragments using it will keep the kind name.`)) {
                    customKinds = customKinds.filter(c => c.name !== k);
                    saveCustomKinds(); rebuildKindMaps();
                    activeKinds.delete(k);
                    renderFilters(); buildPoints(); applyFilters();
                }
                return;
            }
            activeKinds.has(k) ? activeKinds.delete(k) : activeKinds.add(k);
            chip.classList.toggle('off');
            applyFilters();
        };
        f.appendChild(chip);
    });
    const addChip = document.createElement('div');
    addChip.className = 'chip';
    addChip.style.cssText = 'border-style:dashed;color:var(--dim);justify-content:center';
    addChip.innerHTML = '+ kind';
    addChip.onclick = openAddKind;
    f.appendChild(addChip);
}
function openAddKind() {
    const name = prompt('New kind name (e.g. "trip", "creation", "dream"):', '');
    if (!name) return;
    const clean = name.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    if (!clean) return;
    if (allKinds().includes(clean)) { toast(`"${clean}" already exists`); return; }
    const palette = ['#ff6b9d','#ffd166','#06d6a0','#4cc9f0','#7209b7','#f72585','#3a86ff','#ff9f1c','#2ec4b6','#e63946'];
    const usedColors = new Set([...Object.values(KIND_COLORS)]);
    const color = palette.find(c => !usedColors.has(c)) || palette[customKinds.length % palette.length];
    const userColor = prompt('Color (hex like #ff6b9d, or blank to use ' + color + '):', color);
    const finalColor = (userColor || '').match(/^#[0-9a-fA-F]{3,8}$/) ? userColor : color;
    customKinds.push({ name: clean, color: finalColor, size: 1.0 });
    saveCustomKinds(); rebuildKindMaps();
    activeKinds.add(clean);
    renderFilters(); renderKindOptions(); buildPoints(); applyFilters();
    toast(`Added kind: ${clean}`);
}
function renderKindOptions() {
    const sel = $('m-kind'); if (!sel) return;
    const cur = sel.value;
    sel.innerHTML = '';
    allKinds().forEach(k => {
        const o = document.createElement('option'); o.value = k; o.textContent = k.charAt(0).toUpperCase() + k.slice(1);
        sel.appendChild(o);
    });
    if (allKinds().includes(cur)) sel.value = cur;
}
function topTags(limit) {
    const m = new Map();
    fragments.forEach(f => (f.tags || []).forEach(t => m.set(t, (m.get(t) || 0) + 1)));
    return [...m.entries()].sort((a,b) => b[1] - a[1]).slice(0, limit).map(x => x[0]);
}
function tagCounts() {
    const m = new Map();
    fragments.forEach(f => (f.tags || []).forEach(t => m.set(t, (m.get(t) || 0) + 1)));
    return m;
}
function edgeCounts() {
    const m = {}; EDGE_TYPES.forEach(t => m[t] = 0);
    edges.forEach(e => { const t = e.type || 'with'; if (m[t] !== undefined) m[t]++; });
    return m;
}
function renderEdgeFilters() {
    const el = $('edgefilters'); el.innerHTML = '';
    const counts = edgeCounts();
    if (edges.length === 0) return;
    EDGE_TYPES.forEach(t => {
        if (counts[t] === 0) return;
        const chip = document.createElement('div');
        chip.className = 'chip edge' + (activeEdgeTypes.has(t) ? ' on' : '');
        chip.innerHTML = `${t}<span class="chip-count">${counts[t]}</span>`;
        chip.onclick = () => {
            activeEdgeTypes.has(t) ? activeEdgeTypes.delete(t) : activeEdgeTypes.add(t);
            chip.classList.toggle('on');
            buildEdges();
        };
        el.appendChild(chip);
    });
}
function renderTagFilters() {
    const el = $('tagfilters'); el.innerHTML = '';
    const tags = topTags(MAX_TAG_CHIPS);
    if (tags.length === 0) return;
    const counts = tagCounts();
    tags.forEach(t => {
        const chip = document.createElement('div');
        chip.className = 'chip tag' + (activeTags.has(t) ? ' on' : '');
        chip.innerHTML = `#${t}<span class="chip-count">${counts.get(t) || 0}</span>`;
        chip.onclick = () => toggleTag(t);
        el.appendChild(chip);
    });
}
function toggleTag(t) {
    activeTags.has(t) ? activeTags.delete(t) : activeTags.add(t);
    renderTagFilters();
    applyFilters();
}
function applyFilters() {
    if (!pointsMesh) return;
    const sa = pointsMesh.geometry.attributes.size;
    fragments.forEach((f, i) => { sa.array[i] = (KIND_SIZE[f.kind] || 1.0) * (isVisible(i) ? 1.0 : 0.0); });
    sa.needsUpdate = true;
    buildEdges();
    updateStats();
}
const _pickV = new THREE.Vector3();
function pickAtPixel(px, py, rect) {
    if (!pointsMesh) return -1;
    const arr = pointsMesh.geometry.attributes.position.array;
    let bestIdx = -1, bestScore = PICK_PIXELS * PICK_PIXELS;
    for (let i = 0; i < fragments.length; i++) {
        if (!isVisible(i)) continue;
        _pickV.set(arr[i*3], arr[i*3+1], arr[i*3+2]);
        _pickV.project(camera);
        if (_pickV.z >= 1 || _pickV.z <= -1) continue;
        const sx = (_pickV.x + 1) * 0.5 * rect.width;
        const sy = (1 - _pickV.y) * 0.5 * rect.height;
        const dx = sx - px, dy = sy - py;
        const d2 = dx*dx + dy*dy;
        if (d2 < bestScore) { bestScore = d2; bestIdx = i; }
    }
    return bestIdx;
}
function onPointer(e) {
    if (linking) { updateLinkLine(e.clientX, e.clientY); }
    const rect = renderer.domElement.getBoundingClientRect();
    const px = e.clientX - rect.left, py = e.clientY - rect.top;
    const idx = pickAtPixel(px, py, rect);
    if (hoveredIdx !== idx) {
        if (hoveredIdx >= 0 && hoveredIdx !== selectedIdx) setHilite(hoveredIdx, 0.0);
        if (idx >= 0 && idx !== selectedIdx) setHilite(idx, 0.6);
        hoveredIdx = idx;
    }
    if (idx >= 0) {
        const f = fragments[idx];
        tooltip.style.display = 'block';
        tooltip.style.left = (e.clientX + 12) + 'px';
        tooltip.style.top = (e.clientY + 12) + 'px';
        tooltip.textContent = `${f.title}${f.year ? ' · ' + f.year : ''}`;
        renderer.domElement.style.cursor = 'pointer';
    } else {
        tooltip.style.display = 'none';
        renderer.domElement.style.cursor = 'grab';
    }
}
function onClick(e) {
    if (e.target !== renderer.domElement) return;
    if (linking) return;
    if (hoveredIdx >= 0) { selectFragment(hoveredIdx); flyTo(hoveredIdx); }
    else { selectFragment(-1); }
}
function startLink(srcIdx, e) {
    if (srcIdx < 0) return;
    linking = { src: srcIdx, x: e.clientX, y: e.clientY };
    $('link-overlay').classList.add('active');
    controls.enabled = false;
    updateLinkLine(e.clientX, e.clientY);
    toast('Drag to another node to link');
}
function updateLinkLine(x, y) {
    if (!linking) return;
    const arr = pointsMesh.geometry.attributes.position.array;
    const v = new THREE.Vector3(arr[linking.src*3], arr[linking.src*3+1], arr[linking.src*3+2]);
    v.project(camera);
    const rect = renderer.domElement.getBoundingClientRect();
    const sx = (v.x + 1) * 0.5 * rect.width + rect.left;
    const sy = (1 - v.y) * 0.5 * rect.height + rect.top;
    const line = $('link-line');
    line.setAttribute('x1', sx); line.setAttribute('y1', sy);
    line.setAttribute('x2', x); line.setAttribute('y2', y);
}
function cancelLink() {
    if (!linking) return;
    linking = null;
    $('link-overlay').classList.remove('active');
    controls.enabled = true;
}
async function commitLink(dstIdx) {
    if (!linking) return;
    const src = linking.src;
    cancelLink();
    if (dstIdx < 0 || dstIdx === src) { toast('Link cancelled'); return; }
    const sf = fragments[src], df = fragments[dstIdx];
    if (!sf || !df) return;
    sf.connections = sf.connections || [];
    if (sf.connections.some(c => c.to === df.id)) { toast(`Already linked → ${df.title}`); return; }
    sf.connections.push({ to: df.id, type: 'with' });
    saveFragments(); rebuildIndex();
    buildEdges(); renderEdgeFilters();
    selectFragment(src);
    toast(`Linked: ${sf.title} → ${df.title}`);
}
function onPointerDown(e) {
    if (!e.shiftKey) return;
    if (e.target !== renderer.domElement) return;
    const rect = renderer.domElement.getBoundingClientRect();
    const idx = pickAtPixel(e.clientX - rect.left, e.clientY - rect.top, rect);
    if (idx < 0) return;
    e.preventDefault();
    startLink(idx, e);
}
function onPointerUp(e) {
    if (!linking) return;
    const rect = renderer.domElement.getBoundingClientRect();
    const idx = pickAtPixel(e.clientX - rect.left, e.clientY - rect.top, rect);
    commitLink(idx);
}
function showOnly(rows) { ['f-title-row','f-kindyear-row','f-summary-row','f-tags-row','f-mood-row','f-recur-row','f-geo-row','link-fields','share-fields','connect-fields','decrypt-fields'].forEach(id => { const el = $(id); if (el) el.style.display = rows.includes(id) ? '' : 'none'; }); }
function openModal(title) { $('modal-title').textContent = title; $('modal-bg').classList.add('open'); }
function closeModal() { $('modal-bg').classList.remove('open'); editingId = null; linkingFrom = null; sharing = false; showOnly(['f-title-row','f-kindyear-row','f-summary-row','f-tags-row']); $('modal-save').style.display = ''; $('connect-fields').style.display = 'none'; }
function openAdd() {
    editingId = null; sharing = false; linkingFrom = null;
    const now = new Date();
    renderKindOptions();
    $('m-title').value = ''; $('m-kind').value = 'event';
    $('m-year').value = String(now.getFullYear());
    $('m-month').value = ''; $('m-day').value = '';
    $('m-summary').value = ''; $('m-tags').value = '';
    $('m-mood').value = '0'; $('m-mood-num').textContent = '0';
    $('m-recurring').checked = false;
    $('m-geocode').value = '';
    $('geocode-msg').textContent = '';
    editGeoLat = null; editGeoLon = null;
    showOnly(['f-title-row','f-kindyear-row','f-summary-row','f-tags-row','f-mood-row','f-recur-row','f-geo-row']);
    $('modal-save').style.display = '';
    const trow = $('template-row');
    if (trow) {
        trow.style.display = '';
        const chips = $('template-chips'); chips.innerHTML = '';
        FRAG_TEMPLATES.forEach(t => {
            const c = document.createElement('button'); c.className = 'tpl-chip'; c.textContent = t.label;
            c.onclick = () => { $('m-kind').value = t.kind; if (t.tags && !$('m-tags').value) $('m-tags').value = t.tags; chips.querySelectorAll('.tpl-chip').forEach(x => x.classList.remove('active')); c.classList.add('active'); $('m-title').focus(); };
            chips.appendChild(c);
        });
    }
    openModal('ADD FRAGMENT');
}
function openEdit() {
    if (selectedIdx < 0) return;
    const f = fragments[selectedIdx];
    editingId = f.id; sharing = false; linkingFrom = null;
    renderKindOptions();
    $('m-title').value = f.title || ''; $('m-kind').value = f.kind;
    $('m-year').value = f.year || '';
    $('m-month').value = f.month || '';
    $('m-day').value = f.day || '';
    $('m-summary').value = f.summary || ''; $('m-tags').value = (f.tags || []).join(', ');
    $('m-mood').value = String(typeof f.mood === 'number' ? f.mood : 0);
    $('m-mood-num').textContent = $('m-mood').value;
    $('m-recurring').checked = f.recurring === 'yearly';
    if (typeof f.lat === 'number' && typeof f.lon === 'number') { $('m-geocode').value = f.lat.toFixed(4) + ', ' + f.lon.toFixed(4); editGeoLat = f.lat; editGeoLon = f.lon; }
    else { $('m-geocode').value = ''; editGeoLat = null; editGeoLon = null; }
    $('geocode-msg').textContent = '';
    showOnly(['f-title-row','f-kindyear-row','f-summary-row','f-tags-row','f-mood-row','f-recur-row','f-geo-row']);
    $('modal-save').style.display = '';
    const etrow = $('template-row'); if (etrow) etrow.style.display = 'none';
    openModal('EDIT FRAGMENT');
}
function openLink() {
    if (selectedIdx < 0) return;
    linkingFrom = fragments[selectedIdx].id; sharing = false; editingId = null;
    const sel = $('m-link-target'); sel.innerHTML = '';
    fragments.forEach((f, i) => {
        if (i === selectedIdx) return;
        const o = document.createElement('option'); o.value = f.id; o.textContent = `${f.title} (${f.kind}${f.year ? ', ' + f.year : ''})`;
        sel.appendChild(o);
    });
    showOnly(['link-fields']);
    $('modal-save').style.display = '';
    openModal('LINK FRAGMENTS');
}
function bytesToB64Url(bytes) { return btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); }
function b64UrlToBytes(b64) {
    const norm = b64.replace(/-/g,'+').replace(/_/g,'/');
    const padded = norm + '==='.slice((norm.length + 3) % 4);
    const bin = atob(padded);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
}
async function deriveKey(passphrase, salt) {
    const km = await crypto.subtle.importKey('raw', new TextEncoder().encode(passphrase), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 200000, hash: 'SHA-256' }, km, { name: 'AES-GCM', length: 256 }, false, ['encrypt','decrypt']);
}
async function encryptCompressed(jsonStr, passphrase) {
    const compressed = await new Response(new Blob([jsonStr]).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(passphrase, salt);
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, compressed);
    const out = new Uint8Array(salt.length + iv.length + ct.byteLength);
    out.set(salt, 0); out.set(iv, salt.length); out.set(new Uint8Array(ct), salt.length + iv.length);
    return { b64: bytesToB64Url(out), bytes: out.byteLength, plain: jsonStr.length, compressed: compressed.byteLength };
}
async function decryptShare(b64, passphrase) {
    const bytes = b64UrlToBytes(b64);
    if (bytes.byteLength < 28) throw new Error('payload too short');
    const salt = bytes.slice(0, 16);
    const iv = bytes.slice(16, 28);
    const ct = bytes.slice(28);
    const key = await deriveKey(passphrase, salt);
    const compressed = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
    return await new Response(new Blob([compressed]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).text();
}
async function buildShareLink() {
    const compact = { fragments: fragments.map(f => ({ i: f.id, t: f.title, k: f.kind, y: f.year || null, s: f.summary || '', g: f.tags || [], la: typeof f.lat==='number'?f.lat:undefined, lo: typeof f.lon==='number'?f.lon:undefined, c: (f.connections || []).map(x => [x.to, x.type || 'with']) })) };
    const json = JSON.stringify(compact);
    const enc = $('share-encrypt').checked;
    if (enc) {
        const pass = $('share-passphrase').value.trim();
        if (!pass || pass.length < 4) { $('share-link').textContent = '(passphrase too short)'; $('share-stats').textContent = 'Need at least 4 characters'; return null; }
        const r = await encryptCompressed(json, pass);
        const url = location.origin + location.pathname + '#e=' + r.b64;
        $('share-link').textContent = url;
        $('share-stats').textContent = `${fragments.length} fragments · ${edges.length} edges · ${r.plain} → ${r.bytes} bytes (${Math.round(r.bytes/r.plain*100)}%) · AES-GCM 256, PBKDF2 200k, encrypted`;
        return url;
    }
    const stream = new Blob([json]).stream().pipeThrough(new CompressionStream('deflate-raw'));
    const buf = await new Response(stream).arrayBuffer();
    const b64 = bytesToB64Url(new Uint8Array(buf));
    const url = location.origin + location.pathname + '#m=' + b64;
    $('share-link').textContent = url;
    $('share-stats').textContent = `${fragments.length} fragments · ${edges.length} edges · ${json.length} → ${buf.byteLength} bytes (${Math.round(buf.byteLength/json.length*100)}%) · plaintext`;
    return url;
}
async function openShare() {
    sharing = true; editingId = null; linkingFrom = null;
    showOnly(['share-fields']);
    $('share-encrypt').checked = false;
    $('share-passphrase').style.display = 'none'; $('share-passphrase').value = '';
    $('share-link').textContent = 'Compressing…';
    $('share-stats').textContent = '';
    $('modal-save').style.display = 'none';
    openModal('SHARE MAP');
    const url = await buildShareLink();
    if (url) { try { await navigator.clipboard.writeText(url); toast('Share link copied to clipboard'); } catch {} }
}
async function regenShareLink() {
    $('share-link').textContent = 'Working…';
    const url = await buildShareLink();
    if (url) { try { await navigator.clipboard.writeText(url); toast('New link copied'); } catch {} }
}
function applyShareFragments(text) {
    const c = JSON.parse(text);
    fragments = (c.fragments || []).map(f => ({ id: f.i, title: f.t, kind: f.k, year: f.y, summary: f.s, tags: f.g || [], lat: typeof f.la==='number'?f.la:undefined, lon: typeof f.lo==='number'?f.lo:undefined, connections: (f.c || []).map(([to,ty]) => ({ to, type: ty })), media: [] }));
}
function parseFragHash() {
    const m = location.hash.match(/[#&]f=([a-zA-Z0-9_-]+)/);
    return m ? m[1] : null;
}
function applyFragDeepLink() {
    const id = parseFragHash(); if (!id) return false;
    const i = idToIdx.get(id);
    if (i === undefined) return false;
    setTimeout(() => { selectFragment(i); flyTo(i); }, 400);
    return true;
}
async function tryRestoreFromHash() {
    const plain = location.hash.match(/[#&]m=([A-Za-z0-9_-]+)/);
    const enc = location.hash.match(/[#&]e=([A-Za-z0-9_-]+)/);
    if (plain) {
        try {
            const bytes = b64UrlToBytes(plain[1]);
            const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
            const text = await new Response(stream).text();
            applyShareFragments(text);
            toast(`Loaded shared map: ${fragments.length} fragments`);
            return true;
        } catch (err) { console.warn('plain hash restore failed', err); return false; }
    }
    if (enc) { window._pendingEncShare = enc[1]; return false; }
    return false;
}
async function promptDecrypt() {
    if (!window._pendingEncShare) return;
    showOnly(['decrypt-fields']);
    $('modal-save').style.display = 'none';
    $('decrypt-msg').textContent = '';
    $('decrypt-passphrase').value = '';
    openModal('UNLOCK SHARED MAP');
    setTimeout(() => $('decrypt-passphrase').focus(), 100);
}
async function tryDecrypt() {
    const pass = $('decrypt-passphrase').value;
    if (!pass) { $('decrypt-msg').textContent = 'enter a passphrase'; return; }
    $('decrypt-msg').textContent = 'unlocking…';
    try {
        const text = await decryptShare(window._pendingEncShare, pass);
        applyShareFragments(text);
        rebuildIndex(); recomputeYearBounds();
        await computeLayouts();
        buildPoints(); buildEdges(); renderFragsList(); renderTagFilters(); renderEdgeFilters();
        updateStats();
        window._pendingEncShare = null;
        closeModal();
        toast(`Unlocked: ${fragments.length} fragments`);
    } catch (err) { $('decrypt-msg').textContent = 'wrong passphrase or corrupt link'; }
}
async function saveModal() {
    if (sharing) { closeModal(); return; }
    if ($('connect-fields').style.display !== 'none') { closeModal(); return; }
    if ($('decrypt-fields').style.display !== 'none') { closeModal(); return; }
    const title = $('m-title').value.trim();
    const kind = $('m-kind').value;
    const yearRaw = $('m-year').value.trim();
    const year = yearRaw ? parseInt(yearRaw, 10) : null;
    const monthRaw = $('m-month').value;
    const month = monthRaw ? parseInt(monthRaw, 10) : null;
    const dayRaw = $('m-day').value.trim();
    const day = dayRaw ? Math.max(1, Math.min(31, parseInt(dayRaw, 10))) : null;
    const summary = $('m-summary').value.trim();
    const tags = $('m-tags').value.split(',').map(s => s.trim()).filter(Boolean);
    const moodRaw = parseInt($('m-mood').value, 10);
    const mood = (Number.isFinite(moodRaw) && moodRaw !== 0) ? Math.max(-2, Math.min(2, moodRaw)) : null;
    const recurring = $('m-recurring').checked ? 'yearly' : null;
    if (linkingFrom) {
        const tgt = $('m-link-target').value;
        const ty = $('m-link-type').value;
        const f = fragments.find(x => x.id === linkingFrom);
        if (f && tgt && tgt !== linkingFrom) {
            f.connections = f.connections || [];
            if (!f.connections.some(c => c.to === tgt)) f.connections.push({ to: tgt, type: ty });
        }
    } else if (editingId) {
        if (!title) { alert('Title is required.'); return; }
        const f = fragments.find(x => x.id === editingId);
        if (f) {
            Object.assign(f, { title, kind, year, summary, tags });
            if (month) f.month = month; else delete f.month;
            if (day) f.day = day; else delete f.day;
            if (mood !== null) f.mood = mood; else delete f.mood;
            if (recurring) f.recurring = recurring; else delete f.recurring;
            if (editGeoLat !== null && editGeoLon !== null) { f.lat = editGeoLat; f.lon = editGeoLon; }
            else if ($('m-geocode').value.trim() === '') { delete f.lat; delete f.lon; }
        }
    } else {
        if (!title) { alert('Title is required.'); return; }
        const f = { id: newId(), title, kind, year, summary, tags, connections: [], media: [], addedAt: Date.now() };
        if (month) f.month = month;
        if (day) f.day = day;
        if (mood !== null) f.mood = mood;
        if (recurring) f.recurring = recurring;
        if (editGeoLat !== null && editGeoLon !== null) { f.lat = editGeoLat; f.lon = editGeoLon; }
        fragments.push(f);
    }
    saveFragments();
    rebuildIndex();
    recomputeYearBounds();
    await computeLayouts();
    buildPoints(); buildEdges(); buildTimelineAxis();
    renderFragsList(); renderTagFilters(); renderEdgeFilters();
    if (selectedIdx >= 0 && selectedIdx < fragments.length) selectFragment(selectedIdx);
    closeModal();
    updateStats();
}
function deleteSelected() {
    if (selectedIdx < 0) return;
    const f = fragments[selectedIdx];
    if (!confirm(`Delete "${f.title}"? This removes it and any connections to it. Media stays in IndexedDB until garbage-collected.`)) return;
    const id = f.id;
    (f.media || []).forEach(m => mediaDelete(m.id));
    fragments.splice(selectedIdx, 1);
    fragments.forEach(x => { x.connections = (x.connections || []).filter(c => c.to !== id); });
    saveFragments(); rebuildIndex();
    computeLayouts().then(() => { buildPoints(); buildEdges(); renderFragsList(); renderTagFilters(); selectFragment(-1); updateStats(); });
}
function exportJSON() {
    const blob = new Blob([JSON.stringify({ fragments }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `amni-life-${new Date().toISOString().slice(0,10)}.json`; a.click();
    URL.revokeObjectURL(url);
    localStorage.setItem('amni-life-last-export', String(Date.now()));
    hideBackupBanner();
    toast('Exported (media not included; export each via the gallery)');
}
function pad2(n) { return String(n).padStart(2, '0'); }
function exportICS() {
    const fold = s => s.replace(/(.{73})/g, '$1\r\n ');
    const escape = s => (s || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
    const dtstamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const lines = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Amni-Scient//Amni-Life//EN','CALSCALE:GREGORIAN','METHOD:PUBLISH','X-WR-CALNAME:My Memory Map'];
    fragments.forEach(f => {
        if (!f.year) return;
        const m = f.month || 1, d = f.day || 1;
        const dateStr = `${f.year}${pad2(m)}${pad2(d)}`;
        const next = new Date(f.year, m - 1, d + 1);
        const dateEnd = `${next.getFullYear()}${pad2(next.getMonth() + 1)}${pad2(next.getDate())}`;
        const summary = escape(`${f.title || '(untitled)'}${f.kind && f.kind !== 'event' ? ' [' + f.kind + ']' : ''}`);
        const desc = escape(f.summary || '');
        const tags = (f.tags || []).map(t => '#' + t).join(' ');
        const uid = `${f.id}@amni-life`;
        lines.push('BEGIN:VEVENT');
        lines.push('UID:' + uid);
        lines.push('DTSTAMP:' + dtstamp);
        lines.push('DTSTART;VALUE=DATE:' + dateStr);
        lines.push('DTEND;VALUE=DATE:' + dateEnd);
        lines.push(fold('SUMMARY:' + summary));
        if (desc || tags) lines.push(fold('DESCRIPTION:' + desc + (tags ? '\\n\\n' + tags : '')));
        if (tags) lines.push(fold('CATEGORIES:' + (f.tags || []).join(',')));
        if (f.recurring === 'yearly' || (f.month && f.day)) {
            if (f.recurring === 'yearly') lines.push('RRULE:FREQ=YEARLY');
        }
        const ll = fragmentLatLon(f);
        if (ll) lines.push(`GEO:${ll[0].toFixed(6)};${ll[1].toFixed(6)}`);
        lines.push('END:VEVENT');
    });
    lines.push('END:VCALENDAR');
    const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `amni-life-${new Date().toISOString().slice(0,10)}.ics`; a.click();
    URL.revokeObjectURL(url);
    toast(`Exported ${fragments.filter(f => f.year).length} dated fragments to .ics`);
}
function importJSON() { $('file-input').click(); }
function parseCSV(text) {
    const out = [];
    let i = 0, field = '', row = [], inQuotes = false;
    while (i < text.length) {
        const c = text[i];
        if (inQuotes) {
            if (c === '"' && text[i+1] === '"') { field += '"'; i += 2; continue; }
            if (c === '"') { inQuotes = false; i++; continue; }
            field += c; i++;
        } else {
            if (c === '"') { inQuotes = true; i++; continue; }
            if (c === ',') { row.push(field); field = ''; i++; continue; }
            if (c === '\r') { i++; continue; }
            if (c === '\n') { row.push(field); out.push(row); row = []; field = ''; i++; continue; }
            field += c; i++;
        }
    }
    if (field !== '' || row.length > 0) { row.push(field); out.push(row); }
    return out;
}
function csvToFragments(text) {
    const rows = parseCSV(text).filter(r => r.length > 0 && r.some(c => c.trim() !== ''));
    if (rows.length === 0) return [];
    const header = rows[0].map(s => s.trim().toLowerCase());
    const find = names => { for (const n of names) { const k = header.indexOf(n); if (k >= 0) return k; } return -1; };
    const iTitle = find(['title','name','subject','headline']);
    const iKind = find(['kind','category','type']);
    const iYear = find(['year','date']);
    const iSummary = find(['summary','description','notes','body']);
    const iTags = find(['tags','keywords','labels']);
    const iLat = find(['lat','latitude']);
    const iLon = find(['lon','lng','long','longitude']);
    const VALID_KINDS = new Set(allKinds());
    const out = [];
    let n = 1;
    while (idToIdx.has('c' + String(n).padStart(3, '0'))) n++;
    rows.slice(1).forEach((r, idx) => {
        const title = (iTitle >= 0 ? r[iTitle] : r[0] || '').trim();
        if (!title) return;
        let kind = (iKind >= 0 ? r[iKind] : 'event').trim().toLowerCase();
        if (!VALID_KINDS.has(kind)) kind = 'event';
        const yearRaw = (iYear >= 0 ? r[iYear] : '').trim();
        const yearMatch = yearRaw.match(/(\d{4})/);
        const year = yearMatch ? parseInt(yearMatch[1], 10) : null;
        const summary = (iSummary >= 0 ? r[iSummary] : '').trim();
        const tagsStr = (iTags >= 0 ? r[iTags] : '').trim();
        const tags = tagsStr ? tagsStr.split(/[,;|]/).map(s => s.trim()).filter(Boolean) : [];
        const lat = iLat >= 0 ? parseFloat(r[iLat]) : NaN;
        const lon = iLon >= 0 ? parseFloat(r[iLon]) : NaN;
        const id = 'c' + String(n + idx).padStart(3, '0');
        const f = { id, title, kind, year, summary, tags, connections: [], media: [] };
        if (Number.isFinite(lat) && Number.isFinite(lon)) { f.lat = lat; f.lon = lon; }
        out.push(f);
    });
    return out;
}
function parseICS(text) {
    const unfolded = text.replace(/\r\n /g, '').replace(/\r\n\t/g, '');
    const lines = unfolded.split(/\r\n|\n/);
    const events = [];
    let cur = null;
    const unesc = s => (s || '').replace(/\\n/g, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\');
    for (const line of lines) {
        if (line === 'BEGIN:VEVENT') cur = {};
        else if (line === 'END:VEVENT') { if (cur) events.push(cur); cur = null; }
        else if (cur) {
            const idx = line.indexOf(':'); if (idx < 0) continue;
            const left = line.slice(0, idx);
            const right = line.slice(idx + 1);
            const propEnd = left.indexOf(';');
            const prop = (propEnd >= 0 ? left.slice(0, propEnd) : left).toUpperCase();
            cur[prop] = right;
        }
    }
    return events;
}
function icsToFragments(text) {
    const events = parseICS(text);
    const out = [];
    let n = 1;
    while (idToIdx.has('i' + String(n).padStart(3, '0'))) n++;
    events.forEach((ev, i) => {
        const dt = ev.DTSTART || '';
        const m = dt.match(/(\d{4})(\d{2})(\d{2})/);
        if (!m) return;
        const year = parseInt(m[1], 10), month = parseInt(m[2], 10), day = parseInt(m[3], 10);
        const title = (ev.SUMMARY || '').replace(/\\n/g, ' ').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\').trim() || '(untitled event)';
        const summary = (ev.DESCRIPTION || '').replace(/\\n/g, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\').trim();
        const tags = (ev.CATEGORIES || '').split(',').map(s => s.trim()).filter(Boolean);
        tags.push('ical');
        const recurring = /FREQ=YEARLY/i.test(ev.RRULE || '') ? 'yearly' : null;
        const id = 'i' + String(n + i).padStart(3, '0');
        const f = { id, title, kind: 'event', year, month, day, summary, tags, connections: [], media: [], addedAt: Date.now() };
        if (recurring) f.recurring = recurring;
        const geo = ev.GEO;
        if (geo) {
            const g = geo.split(/[;,]/).map(parseFloat);
            if (g.length === 2 && Number.isFinite(g[0]) && Number.isFinite(g[1])) { f.lat = g[0]; f.lon = g[1]; }
        }
        out.push(f);
    });
    return out;
}
async function onFile(e) {
    const file = e.target.files[0]; if (!file) return;
    const text = await file.text();
    const lower = file.name.toLowerCase();
    const isCSV = lower.endsWith('.csv') || file.type === 'text/csv';
    const isICS = lower.endsWith('.ics') || file.type === 'text/calendar';
    try {
        if (isICS) {
            const newFrags = icsToFragments(text);
            if (newFrags.length === 0) throw new Error('no VEVENTs parsed');
            fragments = fragments.concat(newFrags);
            saveFragments(); rebuildIndex(); recomputeYearBounds();
            await computeLayouts();
            buildPoints(); buildEdges(); renderFragsList(); renderTagFilters(); renderEdgeFilters();
            updateStats();
            toast(`Imported ${newFrags.length} from .ics`);
            e.target.value = '';
            return;
        }
        if (isCSV) {
            const newFrags = csvToFragments(text);
            if (newFrags.length === 0) throw new Error('no rows parsed; check headers (title, kind, year, summary, tags, lat, lon)');
            fragments = fragments.concat(newFrags);
            saveFragments(); rebuildIndex(); recomputeYearBounds();
            await computeLayouts();
            buildPoints(); buildEdges(); renderFragsList(); renderTagFilters(); renderEdgeFilters();
            updateStats();
            toast(`Imported ${newFrags.length} from CSV`);
        } else {
            const j = JSON.parse(text);
            if (!Array.isArray(j.fragments)) throw new Error('expected { fragments: [...] }');
            fragments = j.fragments;
            saveFragments(); rebuildIndex(); recomputeYearBounds();
            await computeLayouts();
            buildPoints(); buildEdges(); renderFragsList(); renderTagFilters(); renderEdgeFilters(); selectFragment(-1);
            updateStats();
            toast(`Imported ${fragments.length} fragments`);
        }
    } catch (err) { snd('error'); alert('Import failed: ' + err.message); }
    e.target.value = '';
}
async function resetToSample() {
    if (!confirm('Reset to sample data? Your current map will be replaced (media stays in IndexedDB).')) return;
    localStorage.removeItem(STORAGE_KEY);
    location.hash = '';
    fragments = await fetchSample();
    saveFragments(); rebuildIndex(); recomputeYearBounds();
    await computeLayouts();
    buildPoints(); buildEdges(); renderFragsList(); renderTagFilters(); selectFragment(-1);
    updateStats();
}
function searchMatches(q) {
    q = q.trim().toLowerCase();
    if (!q) return [];
    return fragments.map((f, i) => ({ f, i })).filter(({ f }) =>
        (f.title || '').toLowerCase().includes(q) ||
        (f.summary || '').toLowerCase().includes(q) ||
        (f.tags || []).some(t => t.toLowerCase().includes(q)) ||
        (f.kind || '').toLowerCase() === q ||
        String(f.year || '') === q ||
        (f.id || '').toLowerCase() === q
    );
}
function renderSearchResults(q) {
    const el = $('search-results');
    if (!q.trim()) { el.style.display = 'none'; el.innerHTML = ''; return; }
    const hits = searchMatches(q).slice(0, 50);
    el.style.display = 'block'; el.innerHTML = '';
    if (hits.length === 0) { el.innerHTML = '<div class="sr-empty">no fragments match this query</div>'; return; }
    hits.forEach((h, idx) => {
        const f = h.f;
        const row = document.createElement('div');
        row.className = 'sr-row' + (idx === 0 ? ' sel' : '');
        row.innerHTML = `<span class="sr-dot" style="background:${KIND_COLORS[f.kind]}"></span><span class="sr-title">${f.title || '(untitled)'}<div class="sr-summary">${(f.summary || '').slice(0, 110).replace(/\n/g, ' ')}</div></span><span class="sr-meta">${f.year || ''} · ${f.kind}</span>`;
        row.onclick = () => { selectFragment(h.i); flyTo(h.i); $('search-results').style.display = 'none'; };
        el.appendChild(row);
    });
}
let searchSpeechRec = null;
function toggleVoiceSearch() {
    const Cls = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Cls) { toast('Voice search not supported in this browser'); return; }
    if (searchSpeechRec) { try { searchSpeechRec.stop(); } catch {} searchSpeechRec = null; $('micbtn').classList.remove('recording'); return; }
    searchSpeechRec = new Cls();
    searchSpeechRec.continuous = false;
    searchSpeechRec.interimResults = true;
    searchSpeechRec.lang = navigator.language || 'en-US';
    let interim = '';
    searchSpeechRec.onresult = (ev) => {
        interim = '';
        let final = '';
        for (let i = 0; i < ev.results.length; i++) {
            const t = ev.results[i][0].transcript;
            if (ev.results[i].isFinal) final += t;
            else interim += t;
        }
        const text = (final || interim).replace(/[.,;!?]/g, '').trim();
        $('search').value = text;
        $('search').dispatchEvent(new Event('input', { bubbles: true }));
    };
    searchSpeechRec.onend = () => { searchSpeechRec = null; $('micbtn').classList.remove('recording'); if ($('search').value.trim()) searchHandler(); };
    searchSpeechRec.onerror = (e) => { searchSpeechRec = null; $('micbtn').classList.remove('recording'); if (e.error !== 'no-speech') toast('Mic error: ' + e.error); };
    try { searchSpeechRec.start(); $('micbtn').classList.add('recording'); toast('Listening…'); } catch (err) { toast('Mic blocked: ' + err.message); searchSpeechRec = null; }
}
function searchHandler() {
    const q = $('search').value.trim();
    if (!q) { $('search-results').style.display = 'none'; return; }
    const hits = searchMatches(q);
    if (hits.length === 0) { toast('No match'); return; }
    selectFragment(hits[0].i); flyTo(hits[0].i);
    $('search-results').style.display = 'none';
}
function syncSceneToTheme() {
    const cs = getComputedStyle(document.documentElement);
    const sceneCol = cs.getPropertyValue('--scene').trim() || '#0b0d12';
    const fogStr = parseFloat(cs.getPropertyValue('--fog')) || 0.012;
    if (scene) {
        scene.background = new THREE.Color(sceneCol);
        scene.fog = new THREE.FogExp2(sceneCol, fogStr);
    }
    syncGlobeColors();
    const themeMul = (parseFloat(cs.getPropertyValue('--canvas-mul')) || 1.0) * userDotSize;
    if (pointsMesh) {
        pointsMesh.material.uniforms.uMul.value = themeMul;
        const isLight = document.documentElement.getAttribute('data-theme') === 'light';
        const want = isLight ? THREE.NormalBlending : THREE.AdditiveBlending;
        if (pointsMesh.material.blending !== want) { pointsMesh.material.blending = want; pointsMesh.material.needsUpdate = true; }
    }
    if (edgesMesh) {
        const isLight = document.documentElement.getAttribute('data-theme') === 'light';
        edgesMesh.material.opacity = isLight ? 0.35 : 0.22;
        edgesMesh.material.needsUpdate = true;
    }
    if (timelineAxis) {
        const accent = new THREE.Color(cs.getPropertyValue('--accent').trim() || '#7cc4ff');
        timelineAxis.material.color = accent;
        timelineAxis.material.needsUpdate = true;
    }
}
function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem(THEME_KEY, t);
    syncSceneToTheme();
}
function cycleTheme() {
    const cur = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = THEMES[(THEMES.indexOf(cur) + 1) % THEMES.length];
    applyTheme(next);
    toast(`Theme: ${next}`);
}
function openThemeBuilder(editName) {
    const cs = getComputedStyle(document.documentElement);
    const get = v => cs.getPropertyValue(v).trim();
    let preset = customThemes.find(t => t.name === editName);
    $('tb-name').value = preset ? preset.name : 'my-theme';
    $('tb-bg').value = preset?.bg || get('--bg') || '#0b0d12';
    $('tb-bg2').value = preset?.bg2 || get('--bg2') || '#10131a';
    $('tb-fg').value = preset?.fg || get('--fg') || '#e8ecf3';
    $('tb-dim').value = preset?.dim || get('--dim') || '#7d8597';
    $('tb-accent').value = preset?.accent || get('--accent') || '#7cc4ff';
    $('tb-accent2').value = preset?.accent2 || get('--accent2') || '#f5c842';
    $('tb-delete').style.display = preset ? '' : 'none';
    $('tb-delete').dataset.name = preset ? preset.name : '';
    $('theme-builder').classList.add('show');
    updateTbPreview();
}
function closeThemeBuilder() { $('theme-builder').classList.remove('show'); }
function updateTbPreview() {
    const card = $('tb-preview');
    card.style.background = $('tb-bg2').value;
    card.style.color = $('tb-fg').value;
    card.style.borderColor = $('tb-bg2').value;
    card.querySelectorAll('div').forEach(d => {
        if (d.style.color === '') return;
    });
    const accent = $('tb-accent').value;
    const accent2 = $('tb-accent2').value;
    const dim = $('tb-dim').value;
    const ds = card.querySelectorAll('div');
    if (ds[0]) ds[0].style.color = accent;
    if (ds[1]) ds[1].style.color = accent2;
    if (ds[2]) ds[2].style.color = dim;
}
function saveCustomTheme() {
    let name = $('tb-name').value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    if (!name) { toast('Theme name required'); return; }
    if (BUILTIN_THEMES.includes(name)) { toast('That name is built-in; pick another'); return; }
    const theme = {
        name, bg: $('tb-bg').value, bg2: $('tb-bg2').value,
        fg: $('tb-fg').value, dim: $('tb-dim').value,
        accent: $('tb-accent').value, accent2: $('tb-accent2').value
    };
    const idx = customThemes.findIndex(t => t.name === name);
    if (idx >= 0) customThemes[idx] = theme; else customThemes.push(theme);
    saveCustomThemes();
    closeThemeBuilder();
    applyTheme(name);
    toast(`Theme saved: ${name}`);
}
function deleteCustomTheme() {
    const name = $('tb-delete').dataset.name; if (!name) return;
    if (!confirm(`Delete custom theme "${name}"?`)) return;
    customThemes = customThemes.filter(t => t.name !== name);
    saveCustomThemes();
    closeThemeBuilder();
    applyTheme('dark');
    toast(`Theme deleted: ${name}`);
}
async function attachFiles(files) {
    if (selectedIdx < 0) { toast('Select a fragment first to attach media'); return; }
    const f = fragments[selectedIdx];
    f.media = f.media || [];
    let added = 0;
    for (const file of files) {
        const k = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : file.type.startsWith('audio/') ? 'audio' : null;
        if (!k) continue;
        const id = newMediaId();
        await mediaPut(id, file);
        f.media.push({ id, kind: k, name: file.name, mime: file.type, size: file.size });
        added++;
    }
    if (added === 0) { toast('No supported files (image/video/audio only)'); return; }
    saveFragments();
    selectFragment(selectedIdx);
    toast(`Attached ${added} ${added === 1 ? 'file' : 'files'}`);
}
function setupDropzone() {
    const dz = $('dropzone');
    let depth = 0;
    window.addEventListener('dragenter', e => { if (e.dataTransfer && [...e.dataTransfer.types].includes('Files')) { depth++; dz.classList.add('show'); } });
    window.addEventListener('dragleave', e => { depth = Math.max(0, depth - 1); if (depth === 0) dz.classList.remove('show'); });
    window.addEventListener('dragover', e => { e.preventDefault(); });
    window.addEventListener('drop', e => {
        e.preventDefault(); depth = 0; dz.classList.remove('show');
        const files = [...(e.dataTransfer.files || [])];
        const csv = files.find(f => f.name.toLowerCase().endsWith('.csv'));
        if (csv) {
            csv.text().then(async text => {
                try {
                    const newFrags = csvToFragments(text);
                    if (newFrags.length === 0) throw new Error('no rows parsed');
                    fragments = fragments.concat(newFrags);
                    saveFragments(); rebuildIndex(); recomputeYearBounds();
                    await computeLayouts();
                    buildPoints(); buildEdges(); renderFragsList(); renderTagFilters(); renderEdgeFilters();
                    updateStats();
                    toast(`Imported ${newFrags.length} from CSV`);
                } catch (err) { snd('error'); toast('CSV import failed: ' + err.message); }
            });
            return;
        }
        if (files.length > 0) attachFiles(files);
    });
}
function updateStats() {
    const filtCount = fragments.filter((_, i) => isVisible(i)).length;
    const filterStr = (filtCount === fragments.length) ? '' : ` (${filtCount} shown)`;
    const geoCount = fragments.filter(f => fragmentLatLon(f)).length;
    const geoStr = geoCount > 0 ? ` · ${geoCount} geo` : '';
    $('stats').textContent = `${fragments.length} fragments${filterStr}${geoStr} · ${edges.length} connections · wasm ${version()} · v0.26.0`;
}
function setupUI() {
    $('view-select').onchange = e => setView(e.target.value);
    $('btn-add').onclick = openAdd;
    $('btn-edit').onclick = openEdit;
    $('btn-link').onclick = openLink;
    $('btn-delete').onclick = deleteSelected;
    $('btn-media').onclick = () => { if (selectedIdx < 0) { toast('Select a fragment first'); return; } $('media-input').click(); };
    $('btn-rec').onclick = toggleRecording;
    $('btn-tour').onclick = toggleTour;
    $('btn-reveal').onclick = toggleReveal;
    const ts = $('tour-speed');
    ts.value = String(tourStepMs);
    ts.oninput = e => {
        tourStepMs = parseInt(e.target.value, 10);
        localStorage.setItem(TOUR_SPEED_KEY, String(tourStepMs));
        if (tourTimer) { clearInterval(tourTimer); tourTimer = setInterval(tourStep, tourStepMs); }
    };
    $('btn-stats').onclick = showStats;
    $('btn-mood').onclick = toggleMood;
    $('btn-quiz').onclick = startQuiz;
    $('quiz-close').onclick = closeQuiz;
    $('quiz-skip').onclick = nextQuiz;
    $('quiz-reveal').onclick = revealQuiz;
    $('quiz-next').onclick = nextQuiz;
    $('quiz-guess').addEventListener('keydown', e => { if (e.key === 'Enter') { checkQuizGuess(); setTimeout(() => $('quiz-next').focus(), 100); } });
    $('quiz-modal').addEventListener('click', e => { if (e.target.id === 'quiz-modal') closeQuiz(); });
    $('btn-print').onclick = doPrint;
    $('btn-help').onclick = showHelp;
    $('help-close').onclick = closeHelp;
    $('help-panel').addEventListener('click', e => { if (e.target.id === 'help-panel') closeHelp(); });
    $('minimap').addEventListener('click', onMinimapClick);
    $('minimap').classList.add('show');
    $('stats-close').onclick = closeStats;
    $('stats-panel').addEventListener('click', e => { if (e.target.id === 'stats-panel') closeStats(); });
    $('m-mood').addEventListener('input', e => { $('m-mood-num').textContent = e.target.value; });
    $('btn-narrate').onclick = toggleNarrate;
    $('otd-close').onclick = dismissOTD;
    $('qc-input').oninput = renderQCPreview;
    $('qc-input').addEventListener('keydown', e => {
        if (e.key === 'Escape') { closeQuickCapture(); return; }
        if (e.key === 'Enter') { commitQuickCapture(); return; }
    });
    $('quick-capture').addEventListener('click', e => { if (e.target.id === 'quick-capture') closeQuickCapture(); });
    $('btn-sound').onclick = toggleSound;
    const ds = $('dot-size');
    ds.value = String(Math.round(userDotSize * 100));
    ds.oninput = e => {
        userDotSize = parseFloat(e.target.value) / 100;
        localStorage.setItem(DOT_SIZE_KEY, String(userDotSize));
        syncSceneToTheme();
    };
    if (soundEnabled) { const b = $('btn-sound'); b.textContent = '🔊 SOUND'; b.style.borderColor = 'var(--accent)'; b.style.color = 'var(--accent)'; }
    $('welcome-close').onclick = () => dismissWelcome($('welcome-skip').checked);
    $('welcome-go-btn').onclick = () => dismissWelcome($('welcome-skip').checked);
    $('welcome-tour-btn').onclick = () => { dismissWelcome($('welcome-skip').checked); setTimeout(() => toggleTour(), 600); };
    $('multi-delete').onclick = multiDelete;
    $('multi-tag').onclick = multiAddTag;
    $('multi-clear').onclick = clearMulti;
    $('share-encrypt').onchange = e => { $('share-passphrase').style.display = e.target.checked ? 'block' : 'none'; if (e.target.checked) setTimeout(() => $('share-passphrase').focus(), 80); };
    $('share-passphrase').oninput = () => { /* user updates pass; click REGENERATE to apply */ };
    $('btn-share-regen').onclick = regenShareLink;
    $('btn-decrypt').onclick = tryDecrypt;
    $('decrypt-passphrase').addEventListener('keydown', e => { if (e.key === 'Enter') tryDecrypt(); });
    $('btn-wall').onclick = openWall;
    $('wall-close').onclick = closeWall;
    $('btn-export').onclick = exportJSON;
    $('btn-import').onclick = importJSON;
    $('btn-import').title = 'Import JSON or CSV (drop a CSV anywhere too)';
    $('btn-export').onclick = (e) => { e.stopPropagation(); const m = $('export-menu'); m.style.display = m.style.display === 'block' ? 'none' : 'block'; };
    document.addEventListener('click', (e) => { const m = $('export-menu'); if (m && !$('export-wrap').contains(e.target)) m.style.display = 'none'; });
    $('exp-json').onclick = () => { $('export-menu').style.display = 'none'; exportJSON(); };
    $('exp-ics').onclick = () => { $('export-menu').style.display = 'none'; exportICS(); };
    $('exp-csv').onclick = () => { $('export-menu').style.display = 'none'; exportCSV(); };
    $('btn-scrub').onclick = toggleScrubber;
    $('btn-focus').onclick = toggleFocus;
    $('scrub-play').onclick = scrubPlayPause;
    $('scrub-speed').onclick = cycleScrubSpeed;
    $('scrub-close').onclick = toggleScrubber;
    $('scrub-range').oninput = e => { const v = parseInt(e.target.value,10); $('scrub-year-label').textContent = v; scrubYear = v; updateScrubAlpha(); };
    $('btn-raw').onclick = showRawJSON;
    $('btn-deeplink').onclick = copyDeepLink;
    $('qr-close').onclick = closeQRPanel;
    $('qr-modal').addEventListener('click', e => { if (e.target.id === 'qr-modal') closeQRPanel(); });
    $('prompt-close').onclick = dismissPrompt;
    $('prompt-skip').onclick = skipPrompt;
    $('prompt-capture').onclick = captureFromPrompt;
    function applyMobile() {
        const mobile = window.innerWidth <= 880;
        $('topbar').classList.toggle('collapsed', mobile);
        $('topbar').classList.toggle('expanded', false);
        $('burger').classList.toggle('show', mobile);
    }
    $('burger').onclick = () => $('topbar').classList.toggle('expanded');
    applyMobile();
    window.addEventListener('resize', applyMobile);
    $('raw-close').onclick = closeRawJSON;
    $('raw-modal').addEventListener('click', e => { if (e.target.id === 'raw-modal') closeRawJSON(); });
    $('raw-copy').onclick = copyRawJSON;
    $('backup-btn').onclick = () => { exportJSON(); };
    $('backup-dismiss').onclick = dismissBackup;
    $('btn-share').onclick = openShare;
    $('btn-folder').onclick = pickFolder;
    $('btn-folder-modal').onclick = pickFolder;
    $('btn-connect').onclick = openConnect;
    $('btn-gphotos-save').onclick = gpSaveCid;
    $('btn-geocode').onclick = findGeocode;
    $('geocoding-enabled').checked = localStorage.getItem(GEOCODING_KEY) === '1';
    $('geocoding-enabled').onchange = (e) => localStorage.setItem(GEOCODING_KEY, e.target.checked ? '1' : '0');
    $('btn-gphotos-connect').onclick = gpConnect;
    $('btn-gphotos-import').onclick = gpImport;
    $('btn-gphotos-disconnect').onclick = gpDisconnect;
    $('folder-input').onchange = e => { const fs = [...e.target.files]; e.target.value = ''; if (fs.length) importFolder(fs); };
    $('lightbox-prev').onclick = () => lightboxStep(-1);
    $('lightbox-next').onclick = () => lightboxStep(1);
    $('lightbox-close').onclick = closeLightbox;
    $('lightbox-rotate').onclick = rotateLightbox;
    $('lightbox').addEventListener('click', e => { if (e.target.id === 'lightbox') closeLightbox(); });
    $('year-min').oninput = e => { let v = parseInt(e.target.value, 10); if (v > activeYearMax) v = activeYearMax; activeYearMin = v; e.target.value = v; $('year-lo').textContent = v; applyFilters(); };
    $('year-max').oninput = e => { let v = parseInt(e.target.value, 10); if (v < activeYearMin) v = activeYearMin; activeYearMax = v; e.target.value = v; $('year-hi').textContent = v; applyFilters(); };
    window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installPromptEvent = e; $('btn-install').classList.add('show'); });
    $('btn-install').onclick = async () => {
        if (!installPromptEvent) { toast('Install via your browser menu (no install prompt available)'); return; }
        installPromptEvent.prompt();
        const r = await installPromptEvent.userChoice;
        if (r.outcome === 'accepted') toast('Installed!');
        installPromptEvent = null; $('btn-install').classList.remove('show');
    };
    window.addEventListener('appinstalled', () => { toast('Amni-Life installed'); $('btn-install').classList.remove('show'); });
    $('btn-reset').onclick = resetToSample;
    $('btn-theme').onclick = cycleTheme;
    $('btn-theme').oncontextmenu = (e) => { e.preventDefault(); const cur = document.documentElement.getAttribute('data-theme'); openThemeBuilder(customThemes.some(t => t.name === cur) ? cur : null); };
    $('tb-close').onclick = closeThemeBuilder;
    $('tb-cancel').onclick = closeThemeBuilder;
    $('tb-save').onclick = saveCustomTheme;
    $('tb-delete').onclick = deleteCustomTheme;
    ['tb-bg','tb-bg2','tb-fg','tb-dim','tb-accent','tb-accent2'].forEach(id => $(id).oninput = updateTbPreview);
    $('theme-builder').addEventListener('click', e => { if (e.target.id === 'theme-builder') closeThemeBuilder(); });
    $('btn-list').onclick = () => $('fragslist').classList.toggle('open');
    $('btn-edges').onclick = () => { showEdges = !showEdges; buildEdges(); };
    $('btn-labels').onclick = toggleLabels;
    if (persistentLabels) { const b = $('btn-labels'); if (b) { b.style.borderColor = 'var(--accent)'; b.style.color = 'var(--accent)'; } }
    $('btn-spin').onclick = () => { autoSpin = !autoSpin; controls.autoRotate = autoSpin; };
    $('detail-close').onclick = () => selectFragment(-1);
    $('modal-close').onclick = closeModal;
    $('modal-cancel').onclick = closeModal;
    $('modal-save').onclick = saveModal;
    $('file-input').onchange = onFile;
    $('media-input').onchange = e => { const fs = [...e.target.files]; e.target.value = ''; if (fs.length) attachFiles(fs); };
    $('search').addEventListener('keydown', e => { if (e.key === 'Enter') { if (searchFilterActive) { searchFilterQuery = e.target.value.trim(); applyFilters(); $('search-results').style.display = 'none'; } else searchHandler(); } else if (e.key === 'Escape') { $('search-results').style.display = 'none'; e.target.blur(); } });
    $('search').addEventListener('input', e => {
        if (searchFilterActive) { searchFilterQuery = e.target.value.trim(); applyFilters(); }
        else renderSearchResults(e.target.value);
        if (selectedIdx >= 0) { const sumEl = $('detail-summary'); if (sumEl && !sumEl.classList.contains('summary-edit')) sumEl.innerHTML = renderMarkdown(fragments[selectedIdx].summary || '', activeSearchQuery()); }
    });
    $('filterbtn').onclick = toggleSearchFilter;
    $('micbtn').onclick = toggleVoiceSearch;
    $('btn-add-tag').onclick = addFragmentTag;
    $('btn-pin').onclick = togglePin;
    $('search').addEventListener('blur', () => setTimeout(() => $('search-results').style.display = 'none', 180));
    $('search').addEventListener('focus', e => { if (e.target.value.trim()) renderSearchResults(e.target.value); });
    $('modal-bg').addEventListener('click', e => { if (e.target.id === 'modal-bg') closeModal(); });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') { if (focusMode) { toggleFocus(); return; } if ($('lightbox').classList.contains('open')) { closeLightbox(); return; } if ($('wall').classList.contains('open')) { closeWall(); return; } if (linking) { cancelLink(); return; } if (isTouring()) { stopTour(); return; } closeModal(); selectFragment(-1); }
        if ($('lightbox').classList.contains('open')) {
            if (e.key === 'ArrowLeft') { lightboxStep(-1); return; }
            if (e.key === 'ArrowRight') { lightboxStep(1); return; }
            if (e.key === 'r' || e.key === 'R') { rotateLightbox(); return; }
        }
        if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); return; }
        if ((e.metaKey || e.ctrlKey) && (e.key === 'Z' || (e.shiftKey && e.key === 'z') || e.key === 'y')) { e.preventDefault(); redo(); return; }
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); openQuickCapture(); return; }
        if ((e.metaKey || e.ctrlKey) && e.key === '/') { e.preventDefault(); showHelp(); return; }
        if ((e.metaKey || e.ctrlKey) && e.key === 'p') { e.preventDefault(); doPrint(); return; }
        if (e.key === 'ArrowRight' || e.key === 'j') { e.preventDefault(); stepFragment(1); return; }
        if (e.key === 'ArrowLeft' || e.key === 'k') { e.preventDefault(); stepFragment(-1); return; }
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        if (e.key === '/') { e.preventDefault(); $('search').focus(); }
        if (e.key === 'l') $('btn-list').click();
        if (e.key === 't') cycleTheme();
        if (e.key === 'n') openAdd();
        if (e.key === 'e') $('btn-edges').click();
        if (e.key === 's') $('btn-spin').click();
        if (e.key === 'f') toggleFocus();
    });
    renderer.domElement.addEventListener('pointermove', onPointer);
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('click', onClick);
    window.addEventListener('resize', onResize);
    setupDropzone();
}
function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
function animate() {
    requestAnimationFrame(animate);
    if (lerpDst && lerpT < 1.0) {
        lerpT = Math.min(1.0, lerpT + 1.0 / LERP_FRAMES);
        const t = ease(lerpT);
        const arr = pointsMesh.geometry.attributes.position.array;
        for (let i = 0; i < arr.length; i++) arr[i] = lerpSrc[i] + (lerpDst[i] - lerpSrc[i]) * t;
        pointsMesh.geometry.attributes.position.needsUpdate = true;
        syncEdgePositions();
        if (lerpT >= 1.0) { lerpSrc = null; lerpDst = null; }
    }
    if (camDst && camT < 1.0) {
        camT = Math.min(1.0, camT + 1.0 / CAM_FRAMES);
        const t = ease(camT);
        camera.position.lerpVectors(camSrc, camDst, t);
        controls.target.lerpVectors(camTgtSrc, camTgtDst, t);
        if (camT >= 1.0) { camSrc = null; camDst = null; }
    }
    if (pointsMesh) pointsMesh.material.uniforms.uTime.value = performance.now() * 0.001;
    controls.update();
    renderer.render(scene, camera);
    updateSelectedLabel();
    updateHoverLabels();
    if (performance.now() % 4 < 1) drawMinimap();
    updatePersistentLabels();
}
const _labelV = new THREE.Vector3();
function updateSelectedLabel() {
    const lbl = $('sel-label'); if (!lbl) return;
    if (selectedIdx < 0 || !pointsMesh) { lbl.classList.remove('show'); return; }
    const arr = pointsMesh.geometry.attributes.position.array;
    _labelV.set(arr[selectedIdx*3], arr[selectedIdx*3+1], arr[selectedIdx*3+2]);
    _labelV.project(camera);
    if (_labelV.z >= 1 || _labelV.z <= -1) { lbl.classList.remove('show'); return; }
    const rect = renderer.domElement.getBoundingClientRect();
    const sx = (_labelV.x + 1) * 0.5 * rect.width + rect.left;
    const sy = (1 - _labelV.y) * 0.5 * rect.height + rect.top;
    const f = fragments[selectedIdx]; if (!f) return;
    if (lbl.dataset.idx !== String(selectedIdx)) { lbl.textContent = `${f.title || '(untitled)'}${f.year ? ' · ' + f.year : ''}`; lbl.dataset.idx = String(selectedIdx); }
    lbl.style.left = sx + 'px';
    lbl.style.top = (sy - 18) + 'px';
    lbl.classList.add('show');
}
async function load() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 18, 52);
    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('root').insertBefore(renderer.domElement, document.getElementById('topbar'));
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; controls.dampingFactor = 0.08;
    controls.autoRotate = autoSpin; controls.autoRotateSpeed = 0.35;
    controls.minDistance = 4; controls.maxDistance = 220;
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    buildGlobe();
    await init();
    try { dbHandle = await openMediaDB(); } catch (err) { console.warn('IDB unavailable', err); }
    const restored = await tryRestoreFromHash();
    if (!restored) {
        let stored = loadFragments();
        fragments = stored && stored.length > 0 ? stored : await fetchSample();
        if (!stored) saveFragments();
    }
    if (window._pendingEncShare) setTimeout(() => promptDecrypt(), 600);
    rebuildIndex();
    activeYearMin = 1900; activeYearMax = 2100;
    recomputeYearBounds();
    activeYearMin = yearMin; activeYearMax = yearMax;
    await computeLayouts();
    const savedView = localStorage.getItem(VIEW_KEY);
    if (savedView && positions[savedView]) currentView = savedView;
    $('view-select').value = currentView;
    buildPoints(); buildEdges(); buildTimelineAxis(); renderFilters(); renderTagFilters(); renderEdgeFilters(); renderFragsList(); recomputeYearBounds();
    setGlobeVisible(currentView === 'map');
    setTimelineAxisVisible(currentView === 'timeline');
    const initExt = viewExtent(currentView);
    const initDist = Math.max(58, initExt * 1.35);
    camera.position.set(0, initExt * 0.32, initDist);
    controls.target.set(0, 0, 0);
    setupUI();
    applyTheme(localStorage.getItem(THEME_KEY) || 'dark');
    new MutationObserver(syncSceneToTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    updateStats();
    setTimeout(() => { $('loader').classList.add('fade'); setTimeout(() => $('loader').remove(), 600); }, 200);
    animate();
    setTimeout(() => showWelcome(), 1100);
    setTimeout(() => renderOTD(), 1400);
    setTimeout(() => checkBackupBanner(), 2000);
    setTimeout(() => { applyFragDeepLink(); rotateDailyPrompt(); }, 1700);
    window.addEventListener('hashchange', () => applyFragDeepLink());
}
load().catch(err => { console.error(err); $('loader-text').textContent = 'load failed: ' + err.message; });
