const td = new TextDecoder(), te = new TextEncoder();
export async function start(o = {}) {
  const url = o.wasm || document.querySelector('script[data-wasm]')?.dataset.wasm || 'app.wasm';
  let ex = null, busy = 0, cur = null, frames = false, raf = 0, dead = false, gl = null, list = [], obuf = '', ebuf = '';
  const q = [], H = [null, document, window, document.body, document.documentElement], hix = new Map(H.map((v, i) => [v, i])), free = [], fetches = new Map(), jsres = new Map(), timers = new Map();
  hix.delete(null);
  let nid = 1;
  const nh = v => { if (v == null) return 0; const k = hix.get(v); if (k) return k; const i = free.length ? free.pop() : H.length; H[i] = v; hix.set(v, i); return i; };
  const rel = i => { if (i > 4 && H[i] !== undefined) { hix.delete(H[i]); H[i] = undefined; free.push(i); } };
  const u8 = () => new Uint8Array(ex.memory.buffer), dv = () => new DataView(ex.memory.buffer);
  const B = p => { const d = dv(), a = d.getUint32(p, true), n = Number(d.getBigInt64(p + 4, true)); return u8().subarray(a, a + n); };
  const S = p => td.decode(B(p));
  const put = (r, v) => { const b = typeof v === 'string' ? te.encode(v) : v, d = dv(), h = d.getUint32(r, true), s = d.getUint32(r + 4, true), top = d.getUint32(s, true); u8().set(b, top); d.setUint32(s, top + b.length, true); d.setBigInt64(h + 4, d.getBigInt64(h + 4, true) + BigInt(b.length), true); return b.length; };
  const out = (s, err) => { let b = (err ? ebuf : obuf) + s, i; while ((i = b.indexOf('\n')) >= 0) { (err ? console.error : console.log)(b.slice(0, i)); b = b.slice(i + 1); } err ? ebuf = b : obuf = b; };
  const fail = e => { if (e && e.helium_exit !== undefined) { dead = true; return; } dead = true; frames = false; console.error('helium trapped:', e); o.onerror?.(e); };
  const run = (f, a) => { if (dead || !ex[f]) return; busy++; try { return ex[f](...a); } catch (e) { fail(e); } finally { busy--; } };
  const drain = () => { while (!busy && q.length && !dead) { const [f, a, c] = q.shift(); cur = c; run(f, a); cur = null; } };
  const fire = (tag, kind, c) => { q.push(['he_event', [tag, kind], c]); drain(); };
  const evc = () => cur || {};
  const ev = () => evc().e || {};
  const loop = t => { raf = 0; if (!frames || dead) return; if (!busy) { run('he_frame', [t]); drain(); } if (frames) raf = requestAnimationFrame(loop); };
  const now = () => performance.now();
  const ENOSYS = 52;
  const wasi = new Proxy({
    fd_write: (fd, iov, cnt, nw) => { const d = dv(); let t = 0; for (let i = 0; i < cnt; i++) { const p = d.getUint32(iov + i * 8, true), l = d.getUint32(iov + i * 8 + 4, true); out(td.decode(u8().subarray(p, p + l)), fd === 2); t += l; } d.setUint32(nw, t, true); return 0; },
    fd_close: () => 0, fd_seek: () => 70, fd_fdstat_get: (fd, p) => { const d = dv(); d.setUint8(p, 2); d.setUint16(p + 2, 0, true); d.setBigUint64(p + 8, 0n, true); d.setBigUint64(p + 16, 0n, true); return 0; },
    fd_read: () => 8, fd_prestat_get: () => 8, fd_prestat_dir_name: () => 8, path_open: () => 44, fd_filestat_get: () => 8, path_filestat_get: () => 44,
    clock_time_get: (id, prec, p) => { dv().setBigUint64(p, BigInt(Math.round((id === 0 ? Date.now() : now()) * 1e6)), true); return 0; },
    clock_res_get: (id, p) => { dv().setBigUint64(p, 1000n, true); return 0; },
    random_get: (p, n) => { crypto.getRandomValues(u8().subarray(p, p + n)); return 0; },
    args_sizes_get: (c, s) => { dv().setUint32(c, 0, true); dv().setUint32(s, 0, true); return 0; }, args_get: () => 0,
    environ_sizes_get: (c, s) => { dv().setUint32(c, 0, true); dv().setUint32(s, 0, true); return 0; }, environ_get: () => 0,
    proc_exit: c => { throw { helium_exit: c }; }, sched_yield: () => 0, poll_oneoff: () => ENOSYS
  }, { get: (t, n) => t[n] || (() => ENOSYS) });
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
    he_log: p => console.log(S(p)), he_warn: p => console.warn(S(p)), he_error: p => console.error(S(p)),
    he_now: now, he_epoch_ms: () => Date.now(),
    he_frames: on => { frames = !!on; if (frames && !raf) raf = requestAnimationFrame(loop); },
    he_timer: (ms, tag) => { const id = nid++; timers.set(id, setTimeout(() => { timers.delete(id); fire(tag, 2, { id }); }, ms)); return id; },
    he_clear_timer: id => { clearTimeout(timers.get(id)); timers.delete(id); },
    he_win_w: () => innerWidth, he_win_h: () => innerHeight, he_dpr: () => devicePixelRatio || 1, he_device_memory: () => navigator.deviceMemory || 0,
    he_user_agent: r => put(r, navigator.userAgent), he_secure: () => isSecureContext ? 1 : 0, he_has_webgpu: () => navigator.gpu ? 1 : 0,
    he_prefers_dark: () => matchMedia('(prefers-color-scheme: dark)').matches ? 1 : 0, he_reduced_motion: () => matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : 0,
    he_location: (p, r) => put(r, (loc[S(p)] || (() => ''))()),
    he_param: (n, r) => { const v = new URLSearchParams(location.search).get(S(n)); if (v == null) return 0; put(r, v); return 1; },
    he_set_url: (u, rep) => history[rep ? 'replaceState' : 'pushState'](null, '', S(u)), he_navigate: u => { location.href = S(u); }, he_open: u => { open(S(u), '_blank', 'noopener'); },
    he_title: s => { document.title = S(s); }, he_clipboard: s => { navigator.clipboard?.writeText(S(s)).catch(() => {}); },
    he_el: id => nh(document.getElementById(S(id))), he_query: (h, s) => nh(el(h)?.querySelector(S(s))),
    he_query_all: (h, s) => { list = [...(el(h)?.querySelectorAll(S(s)) || [])]; return list.length; }, he_list_at: i => nh(list[i]),
    he_create: t => nh(document.createElement(S(t))), he_create_svg: t => nh(document.createElementNS('http://www.w3.org/2000/svg', S(t))),
    he_append: (p, c) => el(p)?.appendChild(el(c)), he_insert_before: (p, c, b) => el(p)?.insertBefore(el(c), el(b) || null),
    he_remove: h => el(h)?.remove(), he_release: rel, he_clear: h => { const e = el(h); if (e) e.replaceChildren(); },
    he_parent: h => nh(el(h)?.parentElement), he_closest: (h, s) => nh(el(h)?.closest?.(S(s))), he_child: (h, i) => nh(el(h)?.children[i]), he_child_count: h => el(h)?.children.length || 0,
    he_contains: (a, b) => el(a)?.contains(el(b)) ? 1 : 0, he_same: (a, b) => el(a) === el(b) ? 1 : 0,
    he_text: (h, s) => { const e = el(h); if (e) e.textContent = S(s); }, he_html: (h, s) => { const e = el(h); if (e) e.innerHTML = S(s); },
    he_append_html: (h, s) => el(h)?.insertAdjacentHTML('beforeend', S(s)), he_get_text: (h, r) => put(r, el(h)?.textContent || ''),
    he_attr: (h, n, v) => el(h)?.setAttribute(S(n), S(v)), he_del_attr: (h, n) => el(h)?.removeAttribute(S(n)),
    he_get_attr: (h, n, r) => { const v = el(h)?.getAttribute(S(n)); if (v == null) return 0; put(r, v); return 1; },
    he_style: (h, p, v) => { const e = el(h), k = S(p); if (e) k.startsWith('--') || k.includes('-') ? e.style.setProperty(k, S(v)) : e.style[k] = S(v); },
    he_cls: (h, n, on) => el(h)?.classList.toggle(S(n), !!on), he_has_cls: (h, n) => el(h)?.classList.contains(S(n)) ? 1 : 0,
    he_prop: (h, n, v) => { const e = el(h); if (e) e[S(n)] = S(v); }, he_prop_num: (h, n, v) => { const e = el(h); if (e) e[S(n)] = v; }, he_prop_bool: (h, n, v) => { const e = el(h); if (e) e[S(n)] = !!v; },
    he_get_prop: (h, n, r) => { const v = el(h)?.[S(n)]; if (v == null) return 0; put(r, String(v)); return 1; },
    he_get_num: (h, n) => +(el(h)?.[S(n)]) || 0, he_get_bool: (h, n) => el(h)?.[S(n)] ? 1 : 0,
    he_call: (h, m) => { const e = el(h), k = S(m); e?.[k]?.call(e); },
    he_scroll_into: (h, sm, c) => el(h)?.scrollIntoView({ behavior: sm ? 'smooth' : 'auto', block: c ? 'center' : 'nearest' }),
    he_put_pixels: (h, w, ht, p) => { const c = el(h); if (!c || w <= 0 || ht <= 0) return; if (c.width !== w) c.width = w; if (c.height !== ht) c.height = ht; c.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(B(p).slice().buffer), w, ht), 0, 0); },
    he_rect: (h, p) => { const r = el(h)?.getBoundingClientRect() || { x: 0, y: 0, width: 0, height: 0 }, d = dv(); d.setFloat64(p, r.x, true); d.setFloat64(p + 8, r.y, true); d.setFloat64(p + 16, r.width, true); d.setFloat64(p + 24, r.height, true); },
    he_listen: (h, k, tag, f) => el(h)?.addEventListener(S(k), e => { if (f & 1) e.preventDefault(); if (f & 8) e.stopPropagation(); fire(tag, 1, { e }); }, { passive: !!(f & 2), capture: !!(f & 4) }),
    he_capture_pointer: (h, id) => { try { el(h)?.setPointerCapture(id); } catch {} },
    he_ev_type: r => put(r, ev().type || ''), he_ev_target: () => nh(ev().target),
    he_ev_x: () => ev().clientX ?? ev().touches?.[0]?.clientX ?? 0, he_ev_y: () => ev().clientY ?? ev().touches?.[0]?.clientY ?? 0,
    he_ev_dx: () => ev().deltaX ?? ev().movementX ?? 0, he_ev_dy: () => { const e = ev(); return (e.deltaY ?? e.movementY ?? 0) * (e.deltaMode === 1 ? 33 : e.deltaMode === 2 ? innerHeight : 1); },
    he_ev_button: () => ev().button ?? -1, he_ev_buttons: () => ev().buttons ?? 0, he_ev_pointer: () => ev().pointerId ?? 0, he_ev_mods: () => mods(ev()),
    he_ev_key: r => put(r, ev().key || ''), he_ev_value: r => put(r, ev().target?.value ?? ''), he_ev_checked: () => ev().target?.checked ? 1 : 0,
    he_ev_touches: () => ev().touches?.length || 0, he_ev_touch_x: i => ev().touches?.[i]?.clientX || 0, he_ev_touch_y: i => ev().touches?.[i]?.clientY || 0,
    he_ev_num: n => +path(ev(), S(n)) || 0, he_ev_str: (n, r) => { const v = path(ev(), S(n)); if (v == null) return 0; put(r, String(v)); return 1; },
    he_ev_prevent: () => ev().preventDefault?.(), he_ev_stop: () => ev().stopPropagation?.(),
    he_ev_id: () => evc().id || 0, he_ev_status: () => evc().status || 0, he_ev_loaded: () => evc().loaded || 0, he_ev_total: () => evc().total || 0, he_ev_json: r => put(r, evc().json || ''),
    he_store_get: (k, r) => { try { const v = localStorage.getItem(S(k)); if (v == null) return 0; put(r, v); return 1; } catch { return 0; } },
    he_store_set: (k, v) => { try { localStorage.setItem(S(k), S(v)); } catch {} }, he_store_del: k => { try { localStorage.removeItem(S(k)); } catch {} },
    he_fetch: (u, tag) => doFetch(S(u), {}, tag, 0),
    he_request: (u, m, hj, b, tag, ms) => { const hs = S(hj), body = B(b); return doFetch(S(u), { method: S(m), headers: hs ? JSON.parse(hs) : {}, body: body.length ? body.slice() : undefined }, tag, ms); },
    he_fetch_take: (id, r) => { const f = fetches.get(id); if (!f) return 0; put(r, f.bytes); return 1; }, he_fetch_free: id => fetches.delete(id),
    he_js_global: p => nh(path(globalThis, S(p))), he_js_get: (h, p) => nh(path(H[h], S(p))),
    he_js_import: (u, tag) => { const id = nid++; import(S(u)).then(m => jsdone(id, tag, m), e => jsdone(id, tag, null, e)); return id; },
    he_js_call: (h, m, a, tag) => { const id = nid++, o = H[h], ms = S(m), i = ms.lastIndexOf('.'), args = revive(JSON.parse(S(a) || '[]')); Promise.resolve().then(() => Reflect.apply(ms ? path(o, ms) : o, i < 0 ? o : path(o, ms.slice(0, i)), args)).then(v => jsdone(id, tag, v), e => jsdone(id, tag, null, e)); return id; },
    he_js_result: (id, r) => { const v = jsres.get(id); if (!v) return 0; put(r, v.json ?? v.err ?? ''); return v.err === undefined ? 1 : 0; }, he_js_handle: id => jsres.get(id)?.h || 0,
    he_gl_init: (c, aa, al) => { gl = el(c)?.getContext('webgl2', { antialias: !!aa, alpha: !!al, premultipliedAlpha: false, preserveDrawingBuffer: false }); return gl ? 1 : 0; },
    he_gl_viewport: (x, y, w, h) => gl.viewport(x, y, w, h), he_gl_clear_color: (r, g, b, a) => gl.clearColor(r, g, b, a), he_gl_clear: m => gl.clear(m),
    he_gl_enable: c => gl.enable(c), he_gl_disable: c => gl.disable(c), he_gl_blend_func: (s, d) => gl.blendFunc(s, d), he_gl_blend_func_sep: (a, b, c, d) => gl.blendFuncSeparate(a, b, c, d),
    he_gl_depth_mask: on => gl.depthMask(!!on), he_gl_depth_func: f => gl.depthFunc(f),
    he_gl_create_shader: k => nh(gl.createShader(k)), he_gl_shader_source: (s, p) => gl.shaderSource(H[s], S(p)),
    he_gl_compile_shader: s => { gl.compileShader(H[s]); return gl.getShaderParameter(H[s], gl.COMPILE_STATUS) ? 1 : 0; }, he_gl_shader_log: (s, r) => put(r, gl.getShaderInfoLog(H[s]) || ''),
    he_gl_create_program: () => nh(gl.createProgram()), he_gl_attach_shader: (p, s) => gl.attachShader(H[p], H[s]), he_gl_bind_attrib: (p, i, n) => gl.bindAttribLocation(H[p], i, S(n)),
    he_gl_link_program: p => { gl.linkProgram(H[p]); return gl.getProgramParameter(H[p], gl.LINK_STATUS) ? 1 : 0; }, he_gl_program_log: (p, r) => put(r, gl.getProgramInfoLog(H[p]) || ''),
    he_gl_use_program: p => gl.useProgram(H[p] || null), he_gl_uniform_loc: (p, n) => nh(gl.getUniformLocation(H[p], S(n))),
    he_gl_uniform1f: (l, x) => gl.uniform1f(H[l], x), he_gl_uniform2f: (l, x, y) => gl.uniform2f(H[l], x, y), he_gl_uniform3f: (l, x, y, z) => gl.uniform3f(H[l], x, y, z), he_gl_uniform4f: (l, x, y, z, w) => gl.uniform4f(H[l], x, y, z, w),
    he_gl_uniform1i: (l, v) => gl.uniform1i(H[l], v), he_gl_uniform_mat4: (l, p) => gl.uniformMatrix4fv(H[l], false, new Float32Array(u8().slice(dv().getUint32(p, true), dv().getUint32(p, true) + 64).buffer)),
    he_gl_create_buffer: () => nh(gl.createBuffer()), he_gl_bind_buffer: (t, b) => gl.bindBuffer(t, H[b] || null),
    he_gl_buffer_data: (t, p, u) => gl.bufferData(t, B(p), u), he_gl_buffer_alloc: (t, n, u) => gl.bufferData(t, n, u), he_gl_buffer_sub: (t, off, p) => gl.bufferSubData(t, off, B(p)),
    he_gl_create_vao: () => nh(gl.createVertexArray()), he_gl_bind_vao: v => gl.bindVertexArray(H[v] || null),
    he_gl_attrib_ptr: (i, s, k, n, st, off) => gl.vertexAttribPointer(i, s, k, !!n, st, off), he_gl_enable_attrib: i => gl.enableVertexAttribArray(i), he_gl_disable_attrib: i => gl.disableVertexAttribArray(i), he_gl_attrib_divisor: (i, d) => gl.vertexAttribDivisor(i, d),
    he_gl_draw_arrays: (m, f, c) => gl.drawArrays(m, f, c), he_gl_draw_elements: (m, c, k, o) => gl.drawElements(m, c, k, o), he_gl_draw_arrays_instanced: (m, f, c, n) => gl.drawArraysInstanced(m, f, c, n),
    he_gl_create_texture: () => nh(gl.createTexture()), he_gl_bind_texture: (t, x) => gl.bindTexture(t, H[x] || null), he_gl_active_texture: u => gl.activeTexture(u),
    he_gl_tex_rgba: (w, h, p) => gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, B(p)), he_gl_tex_param: (t, n, v) => gl.texParameteri(t, n, v), he_gl_generate_mipmap: t => gl.generateMipmap(t),
    he_gl_delete: h => { const v = H[h]; if (!v || !gl) return; for (const k of ['Buffer', 'Shader', 'Program', 'Texture', 'VertexArray']) if (v instanceof globalThis['WebGL' + k + (k === 'VertexArray' ? 'Object' : '')]) gl['delete' + k](v); rel(h); },
    he_gl_drawing_w: () => gl?.drawingBufferWidth || 0, he_gl_drawing_h: () => gl?.drawingBufferHeight || 0
  };
  const res = await fetch(url), imports = { wasi_snapshot_preview1: wasi, env: new Proxy(env, { get: (t, n) => t[n] || ((...a) => console.warn('helium: missing import', n, a)) }) };
  const { instance } = WebAssembly.instantiateStreaming && res.headers.get('content-type')?.includes('wasm') ? await WebAssembly.instantiateStreaming(res, imports) : await WebAssembly.instantiate(await res.arrayBuffer(), imports);
  ex = instance.exports;
  busy++;
  try { ex._initialize?.(); ex.goose_init(0, 0); } catch (e) { fail(e); } finally { busy--; }
  drain();
  return { exports: ex, handle: nh, get: i => H[i], fire, call: (f, ...a) => { const r = busy ? undefined : run(f, a); drain(); return r; } };
}
