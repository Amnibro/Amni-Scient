const td = new TextDecoder(), te = new TextEncoder(), N = Number;
export async function start(o = {}) {
  const url = o.wasm || document.querySelector('script[data-wasm]')?.dataset.wasm || 'app.wasm';
  let ex = null, mem = null, busy = 0, cur = null, frames = false, raf = 0, dead = false, gl = null, list = [], obuf = '', ebuf = '';
  const q = [], H = [null, document, window, document.body, document.documentElement], hix = new Map(H.map((v, i) => [v, i])), free = [], fetches = new Map(), jsres = new Map(), timers = new Map(), holes = [];
  hix.delete(null);
  let nid = 1;
  const nh = v => { if (v == null) return 0; const k = hix.get(v); if (k) return k; const i = free.length ? free.pop() : H.length; H[i] = v; hix.set(v, i); return i; };
  const rel = i => { if (i > 4 && H[i] !== undefined) { hix.delete(H[i]); H[i] = undefined; free.push(i); } };
  const u8 = () => new Uint8Array(mem.buffer), dv = () => new DataView(mem.buffer);
  const B = (p, n) => u8().subarray(p, p + n);
  const S = (p, n) => td.decode(B(p, n));
  const put = (r, v) => { const b = typeof v === 'string' ? te.encode(v) : v, p = ex.he_grow(r, b.length); u8().set(b, p); return b.length; };
  const out = (s, err) => { let b = (err ? ebuf : obuf) + s, i; while ((i = b.indexOf('\n')) >= 0) { (err ? console.error : console.log)(b.slice(0, i)); b = b.slice(i + 1); } err ? ebuf = b : obuf = b; };
  const fail = e => { if (e && e.helium_exit !== undefined) { dead = true; frames = false; return; } dead = true; frames = false; console.error('helium trapped:', e); o.onerror?.(e); };
  const run = (f, a) => { if (dead || !ex[f]) return; busy++; try { return ex[f](...a); } catch (e) { fail(e); } finally { busy--; } };
  const drain = () => { while (!busy && q.length && !dead) { const [f, a, c] = q.shift(); cur = c; run(f, a); cur = null; } };
  const fire = (tag, kind, c) => { q.push(['he_event', [tag, kind], c]); drain(); };
  const evc = () => cur || {};
  const ev = () => evc().e || {};
  const loop = t => { raf = 0; if (!frames || dead) return; if (!busy) { run('he_frame', [t]); drain(); } if (frames) raf = requestAnimationFrame(loop); };
  const now = () => performance.now();
  const mmap = len => { len = Math.ceil(len / 65536) * 65536; const k = holes.findIndex(h => h[1] >= len); if (k >= 0) { const [a, l] = holes[k]; if (l === len) holes.splice(k, 1); else holes[k] = [a + len, l - len]; u8().fill(0, a, a + len); return a; } try { return mem.grow(len / 65536) * 65536; } catch { return -12; } };
  const sys = (n, a, b, c, d) => {
    switch (N(n)) {
      case 1: { const fd = N(a); if (fd !== 1 && fd !== 2) return -9n; out(td.decode(B(N(b), N(c))), fd === 2); return c; }
      case 9: return BigInt(mmap(N(b)));
      case 11: { const p = N(a), l = Math.ceil(N(b) / 65536) * 65536; if (p % 65536 === 0 && l > 0) holes.push([p, l]); return 0n; }
      case 28: { if (N(c) === 4) u8().fill(0, N(a), N(a) + N(b)); return 0n; }
      case 228: { const t = N(a) === 0 ? Date.now() * 1e6 : now() * 1e6, p = N(b), w = dv(); w.setBigInt64(p, BigInt(Math.floor(t / 1e9)), true); w.setBigInt64(p + 8, BigInt(Math.floor(t % 1e9)), true); return 0n; }
      case 318: { const k = N(b), t = new Uint8Array(k); crypto.getRandomValues(t); u8().set(t, N(a)); return b; }
      case 204: { u8().fill(0, N(c), N(c) + 8); u8()[N(c)] = 1; return 8n; }
      case 60: case 231: throw { helium_exit: N(a) };
      case 10: case 13: case 14: case 35: case 131: case 202: return 0n;
      case 2: case 4: return -2n;
      default: return -38n;
    }
  };
  const el = h => H[h];
  const mods = e => (e.shiftKey ? 1 : 0) | (e.ctrlKey ? 2 : 0) | (e.altKey ? 4 : 0) | (e.metaKey ? 8 : 0);
  const loc = { protocol: () => location.protocol, host: () => location.host, hostname: () => location.hostname, pathname: () => location.pathname, search: () => location.search, hash: () => location.hash, href: () => location.href, origin: () => location.origin };
  const finish = (id, tag, rec) => { fetches.set(id, rec); fire(tag, 3, { id, status: rec.status }); };
  const gunzip = async (u, b) => /\.gz(\?|#|$)/.test(u) && b[0] === 0x1f && b[1] === 0x8b && globalThis.DecompressionStream ? new Uint8Array(await new Response(new Blob([b]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer()) : b;
  const doFetch = (u, init, tag, ms) => {
    const id = nid++, ctl = new AbortController(), to = ms > 0 ? setTimeout(() => ctl.abort(), ms) : 0;
    (async () => {
      try {
        const r = await fetch(u, { ...init, signal: ctl.signal }), total = +r.headers.get('content-length') || 0;
        if (!r.body || !total) { const b = new Uint8Array(await r.arrayBuffer()); finish(id, tag, { status: r.status, bytes: await gunzip(u, b) }); return; }
        const rd = r.body.getReader(), parts = []; let got = 0, last = 0;
        for (;;) { const { done, value } = await rd.read(); if (done) break; parts.push(value); got += value.length; const t = now(); if (t - last > 70) { last = t; fire(tag, 4, { id, loaded: got, total }); } }
        const b = new Uint8Array(got); let k = 0; for (const p of parts) { b.set(p, k); k += p.length; }
        finish(id, tag, { status: r.status, bytes: await gunzip(u, b) });
      } catch (e) { finish(id, tag, { status: 0, bytes: te.encode(String(e && e.message || e)) }); } finally { clearTimeout(to); }
    })();
    return id;
  };
  const jsv = v => v === null || ['string', 'number', 'boolean'].includes(typeof v) || Array.isArray(v) || (v && v.constructor === Object);
  const revive = a => Array.isArray(a) ? a.map(revive) : a && typeof a === 'object' ? ('$cb' in a ? (...x) => fire(a.$cb, 6, { json: JSON.stringify(x, (k, v) => typeof v === 'bigint' ? Number(v) : v) }) : '$h' in a ? H[a.$h] : Object.fromEntries(Object.entries(a).map(([k, v]) => [k, revive(v)]))) : a;
  const jsdone = (id, tag, v, err) => { jsres.set(id, err ? { err: String(err && err.message || err) } : jsv(v) ? { json: JSON.stringify(v) } : { h: nh(v) }); fire(tag, 5, { id, status: err ? 0 : 1 }); };
  const path = (o, p) => p.split('.').filter(Boolean).reduce((a, k) => a == null ? a : a[k], o);
  const env = {
    sys,
    he_log: (p, n) => console.log(S(p, n)), he_warn: (p, n) => console.warn(S(p, n)), he_error: (p, n) => console.error(S(p, n)),
    he_now: now, he_epoch_ms: () => Date.now(),
    he_frames: on => { frames = !!on; if (frames && !raf) raf = requestAnimationFrame(loop); },
    he_timer: (ms, tag) => { const id = nid++; timers.set(id, setTimeout(() => { timers.delete(id); fire(tag, 2, { id }); }, ms)); return id; },
    he_clear_timer: id => { clearTimeout(timers.get(id)); timers.delete(id); },
    he_win_w: () => innerWidth, he_win_h: () => innerHeight, he_dpr: () => devicePixelRatio || 1, he_device_memory: () => navigator.deviceMemory || 0,
    he_user_agent: r => { put(r, navigator.userAgent); }, he_secure: () => isSecureContext ? 1 : 0, he_has_webgpu: () => navigator.gpu ? 1 : 0,
    he_prefers_dark: () => matchMedia('(prefers-color-scheme: dark)').matches ? 1 : 0, he_reduced_motion: () => matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : 0,
    he_location: (p, n, r) => { put(r, (loc[S(p, n)] || (() => ''))()); },
    he_param: (p, n, r) => { const v = new URLSearchParams(location.search).get(S(p, n)); if (v == null) return 0; put(r, v); return 1; },
    he_set_url: (p, n, rep) => history[rep ? 'replaceState' : 'pushState'](null, '', S(p, n)), he_navigate: (p, n) => { location.href = S(p, n); }, he_open: (p, n) => { open(S(p, n), '_blank', 'noopener'); },
    he_title: (p, n) => { document.title = S(p, n); }, he_clipboard: (p, n) => { navigator.clipboard?.writeText(S(p, n)).catch(() => {}); },
    he_el: (p, n) => nh(document.getElementById(S(p, n))), he_query: (h, p, n) => nh(el(h)?.querySelector(S(p, n))),
    he_query_all: (h, p, n) => { list = [...(el(h)?.querySelectorAll(S(p, n)) || [])]; return list.length; }, he_list_at: i => nh(list[i]),
    he_create: (p, n) => nh(document.createElement(S(p, n))), he_create_svg: (p, n) => nh(document.createElementNS('http://www.w3.org/2000/svg', S(p, n))),
    he_append: (p, c) => { el(p)?.appendChild(el(c)); }, he_insert_before: (p, c, b) => { el(p)?.insertBefore(el(c), el(b) || null); },
    he_remove: h => el(h)?.remove(), he_release: rel, he_clear: h => { const e = el(h); if (e) e.replaceChildren(); },
    he_parent: h => nh(el(h)?.parentElement), he_closest: (h, p, n) => nh(el(h)?.closest?.(S(p, n))), he_child: (h, i) => nh(el(h)?.children[i]), he_child_count: h => el(h)?.children.length || 0,
    he_contains: (a, b) => el(a)?.contains(el(b)) ? 1 : 0, he_same: (a, b) => el(a) === el(b) ? 1 : 0,
    he_text: (h, p, n) => { const e = el(h); if (e) e.textContent = S(p, n); }, he_html: (h, p, n) => { const e = el(h); if (e) e.innerHTML = S(p, n); },
    he_append_html: (h, p, n) => el(h)?.insertAdjacentHTML('beforeend', S(p, n)), he_get_text: (h, r) => { put(r, el(h)?.textContent || ''); },
    he_attr: (h, a, an, v, vn) => el(h)?.setAttribute(S(a, an), S(v, vn)), he_del_attr: (h, a, an) => el(h)?.removeAttribute(S(a, an)),
    he_get_attr: (h, a, an, r) => { const v = el(h)?.getAttribute(S(a, an)); if (v == null) return 0; put(r, v); return 1; },
    he_style: (h, a, an, v, vn) => { const e = el(h), k = S(a, an); if (e) k.startsWith('--') || k.includes('-') ? e.style.setProperty(k, S(v, vn)) : e.style[k] = S(v, vn); },
    he_cls: (h, a, an, on) => { el(h)?.classList.toggle(S(a, an), !!on); }, he_has_cls: (h, a, an) => el(h)?.classList.contains(S(a, an)) ? 1 : 0,
    he_prop: (h, a, an, v, vn) => { const e = el(h); if (e) e[S(a, an)] = S(v, vn); }, he_prop_num: (h, a, an, v) => { const e = el(h); if (e) e[S(a, an)] = v; }, he_prop_bool: (h, a, an, v) => { const e = el(h); if (e) e[S(a, an)] = !!v; },
    he_get_prop: (h, a, an, r) => { const v = el(h)?.[S(a, an)]; if (v == null) return 0; put(r, String(v)); return 1; },
    he_get_num: (h, a, an) => +(el(h)?.[S(a, an)]) || 0, he_get_bool: (h, a, an) => el(h)?.[S(a, an)] ? 1 : 0,
    he_call: (h, a, an) => { const e = el(h), k = S(a, an); e?.[k]?.call(e); },
    he_scroll_into: (h, sm, c) => el(h)?.scrollIntoView({ behavior: sm ? 'smooth' : 'auto', block: c ? 'center' : 'nearest' }),
    he_rect: (h, p) => { const r = el(h)?.getBoundingClientRect() || { x: 0, y: 0, width: 0, height: 0 }, d = dv(); d.setFloat64(p, r.x, true); d.setFloat64(p + 8, r.y, true); d.setFloat64(p + 16, r.width, true); d.setFloat64(p + 24, r.height, true); },
    he_put_pixels: (h, w, ht, p, n) => { const c = el(h); if (!c || w <= 0 || ht <= 0) return; if (c.width !== w) c.width = w; if (c.height !== ht) c.height = ht; c.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(B(p, n).slice().buffer), w, ht), 0, 0); },
    he_listen: (h, k, kn, tag, f) => el(h)?.addEventListener(S(k, kn), e => { if (f & 1) e.preventDefault(); if (f & 8) e.stopPropagation(); fire(tag, 1, { e }); }, { passive: !!(f & 2), capture: !!(f & 4) }),
    he_capture_pointer: (h, id) => { try { el(h)?.setPointerCapture(id); } catch {} },
    he_ev_type: r => { put(r, ev().type || ''); }, he_ev_target: () => nh(ev().target),
    he_ev_x: () => ev().clientX ?? ev().touches?.[0]?.clientX ?? 0, he_ev_y: () => ev().clientY ?? ev().touches?.[0]?.clientY ?? 0,
    he_ev_dx: () => ev().deltaX ?? ev().movementX ?? 0, he_ev_dy: () => { const e = ev(); return (e.deltaY ?? e.movementY ?? 0) * (e.deltaMode === 1 ? 33 : e.deltaMode === 2 ? innerHeight : 1); },
    he_ev_button: () => ev().button ?? -1, he_ev_buttons: () => ev().buttons ?? 0, he_ev_pointer: () => ev().pointerId ?? 0, he_ev_mods: () => mods(ev()),
    he_ev_key: r => { put(r, ev().key || ''); }, he_ev_value: r => { put(r, ev().target?.value ?? ''); }, he_ev_checked: () => ev().target?.checked ? 1 : 0,
    he_ev_touches: () => ev().touches?.length || 0, he_ev_touch_x: i => ev().touches?.[i]?.clientX || 0, he_ev_touch_y: i => ev().touches?.[i]?.clientY || 0,
    he_ev_num: (p, n) => +path(ev(), S(p, n)) || 0, he_ev_str: (p, n, r) => { const v = path(ev(), S(p, n)); if (v == null) return 0; put(r, String(v)); return 1; },
    he_ev_prevent: () => ev().preventDefault?.(), he_ev_stop: () => ev().stopPropagation?.(),
    he_ev_id: () => evc().id || 0, he_ev_status: () => evc().status || 0, he_ev_loaded: () => evc().loaded || 0, he_ev_total: () => evc().total || 0, he_ev_json: r => { put(r, evc().json || ''); },
    he_store_get: (k, kn, r) => { try { const v = localStorage.getItem(S(k, kn)); if (v == null) return 0; put(r, v); return 1; } catch { return 0; } },
    he_store_set: (k, kn, v, vn) => { try { localStorage.setItem(S(k, kn), S(v, vn)); } catch {} }, he_store_del: (k, kn) => { try { localStorage.removeItem(S(k, kn)); } catch {} },
    he_fetch: (u, un, tag) => doFetch(S(u, un), {}, tag, 0),
    he_request: (u, un, m, mn, hj, hn, b, bn, tag, ms) => { const hs = S(hj, hn), body = B(b, bn); return doFetch(S(u, un), { method: S(m, mn), headers: hs ? JSON.parse(hs) : {}, body: body.length ? body.slice() : undefined }, tag, ms); },
    he_fetch_take: (id, r) => { const f = fetches.get(id); if (!f) return 0; put(r, f.bytes); return 1; }, he_fetch_free: id => { fetches.delete(id); },
    he_js_global: (p, n) => nh(path(globalThis, S(p, n))), he_js_get: (h, p, n) => nh(path(H[h], S(p, n))),
    he_js_import: (u, un, tag) => { const id = nid++; import(S(u, un)).then(m => jsdone(id, tag, m), e => jsdone(id, tag, null, e)); return id; },
    he_js_call: (h, m, mn, a, an, tag) => { const id = nid++, o = H[h], ms = S(m, mn), i = ms.lastIndexOf('.'), args = revive(JSON.parse(S(a, an) || '[]')); Promise.resolve().then(() => Reflect.apply(ms ? path(o, ms) : o, i < 0 ? o : path(o, ms.slice(0, i)), args)).then(v => jsdone(id, tag, v), e => jsdone(id, tag, null, e)); return id; },
    he_js_result: (id, r) => { const v = jsres.get(id); if (!v) return 0; put(r, v.json ?? v.err ?? ''); return v.err === undefined ? 1 : 0; }, he_js_handle: id => jsres.get(id)?.h || 0,
    he_gl_init: (c, aa, al) => { gl = el(c)?.getContext('webgl2', { antialias: !!aa, alpha: !!al, premultipliedAlpha: false, preserveDrawingBuffer: false }); return gl ? 1 : 0; },
    he_gl_viewport: (x, y, w, h) => gl.viewport(x, y, w, h), he_gl_clear_color: (r, g, b, a) => gl.clearColor(r, g, b, a), he_gl_clear: m => gl.clear(m),
    he_gl_enable: c => gl.enable(c), he_gl_disable: c => gl.disable(c), he_gl_blend_func: (s, d) => gl.blendFunc(s, d), he_gl_blend_func_sep: (a, b, c, d) => gl.blendFuncSeparate(a, b, c, d),
    he_gl_depth_mask: on => gl.depthMask(!!on), he_gl_depth_func: f => gl.depthFunc(f),
    he_gl_create_shader: k => nh(gl.createShader(k)), he_gl_shader_source: (s, p, n) => gl.shaderSource(H[s], S(p, n)),
    he_gl_compile_shader: s => { gl.compileShader(H[s]); return gl.getShaderParameter(H[s], gl.COMPILE_STATUS) ? 1 : 0; }, he_gl_shader_log: (s, r) => { put(r, gl.getShaderInfoLog(H[s]) || ''); },
    he_gl_create_program: () => nh(gl.createProgram()), he_gl_attach_shader: (p, s) => gl.attachShader(H[p], H[s]), he_gl_bind_attrib: (p, i, a, n) => gl.bindAttribLocation(H[p], i, S(a, n)),
    he_gl_link_program: p => { gl.linkProgram(H[p]); return gl.getProgramParameter(H[p], gl.LINK_STATUS) ? 1 : 0; }, he_gl_program_log: (p, r) => { put(r, gl.getProgramInfoLog(H[p]) || ''); },
    he_gl_use_program: p => gl.useProgram(H[p] || null), he_gl_uniform_loc: (p, a, n) => nh(gl.getUniformLocation(H[p], S(a, n))),
    he_gl_uniform1f: (l, x) => gl.uniform1f(H[l], x), he_gl_uniform2f: (l, x, y) => gl.uniform2f(H[l], x, y), he_gl_uniform3f: (l, x, y, z) => gl.uniform3f(H[l], x, y, z), he_gl_uniform4f: (l, x, y, z, w) => gl.uniform4f(H[l], x, y, z, w),
    he_gl_uniform1i: (l, v) => gl.uniform1i(H[l], v), he_gl_uniform_mat4: (l, p, n) => gl.uniformMatrix4fv(H[l], false, new Float32Array(B(p, n * 4).slice().buffer, 0, 16)),
    he_gl_create_buffer: () => nh(gl.createBuffer()), he_gl_bind_buffer: (t, b) => gl.bindBuffer(t, H[b] || null),
    he_gl_buffer_data: (t, p, n, u) => gl.bufferData(t, B(p, n), u), he_gl_buffer_alloc: (t, n, u) => gl.bufferData(t, n, u), he_gl_buffer_sub: (t, off, p, n) => gl.bufferSubData(t, off, B(p, n)),
    he_gl_create_vao: () => nh(gl.createVertexArray()), he_gl_bind_vao: v => gl.bindVertexArray(H[v] || null),
    he_gl_attrib_ptr: (i, s, k, n, st, off) => gl.vertexAttribPointer(i, s, k, !!n, st, off), he_gl_enable_attrib: i => gl.enableVertexAttribArray(i), he_gl_disable_attrib: i => gl.disableVertexAttribArray(i), he_gl_attrib_divisor: (i, d) => gl.vertexAttribDivisor(i, d),
    he_gl_draw_arrays: (m, f, c) => gl.drawArrays(m, f, c), he_gl_draw_elements: (m, c, k, o) => gl.drawElements(m, c, k, o), he_gl_draw_arrays_instanced: (m, f, c, n) => gl.drawArraysInstanced(m, f, c, n),
    he_gl_create_texture: () => nh(gl.createTexture()), he_gl_bind_texture: (t, x) => gl.bindTexture(t, H[x] || null), he_gl_active_texture: u => gl.activeTexture(u),
    he_gl_tex_rgba: (w, h, p, n) => gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, B(p, n)), he_gl_tex_param: (t, n, v) => gl.texParameteri(t, n, v), he_gl_generate_mipmap: t => gl.generateMipmap(t),
    he_gl_delete: h => { const v = H[h]; if (!v || !gl) return; for (const k of ['Buffer', 'Shader', 'Program', 'Texture', 'VertexArray']) if (v instanceof globalThis['WebGL' + k + (k === 'VertexArray' ? 'Object' : '')]) gl['delete' + k](v); rel(h); },
    he_gl_drawing_w: () => gl?.drawingBufferWidth || 0, he_gl_drawing_h: () => gl?.drawingBufferHeight || 0,
    sin: Math.sin, cos: Math.cos, tan: Math.tan, asin: Math.asin, acos: Math.acos, atan: Math.atan, atan2: Math.atan2, sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh, exp: Math.exp, log: Math.log, log2: Math.log2, log10: Math.log10, pow: Math.pow, cbrt: Math.cbrt, hypot: Math.hypot, expm1: Math.expm1, log1p: Math.log1p,
    sinf: Math.sin, cosf: Math.cos, tanf: Math.tan, asinf: Math.asin, acosf: Math.acos, atanf: Math.atan, atan2f: Math.atan2, expf: Math.exp, logf: Math.log, log2f: Math.log2, log10f: Math.log10, powf: Math.pow, cbrtf: Math.cbrt, hypotf: Math.hypot
  };
  const res = await fetch(url), bytes = await res.arrayBuffer(), mod = await WebAssembly.compile(bytes);
  const meta = new Uint8Array(WebAssembly.Module.customSections(mod, 'he.mem')[0] || new ArrayBuffer(5)), pages = meta[0] | meta[1] << 8 | meta[2] << 16 | meta[3] << 24;
  mem = new WebAssembly.Memory({ initial: pages, maximum: 65536, shared: meta[4] === 1 });
  const imports = { env: new Proxy({ ...env, memory: mem }, { get: (t, n) => t[n] || ((...a) => { console.warn('helium: missing import', n, a); return 0; }) }) };
  ex = (await WebAssembly.instantiate(mod, imports)).exports;
  busy++;
  try { ex.he_start(0n); } catch (e) { fail(e); } finally { busy--; }
  drain();
  return { exports: ex, handle: nh, get: i => H[i], fire, call: (f, ...a) => { const r = busy ? undefined : run(f, a); drain(); return r; } };
}
