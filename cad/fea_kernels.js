export const mv = {wg: 64, uniform: [["NX","u32"],["NY","u32"],["NZ","u32"],["nx","u32"],["ny","u32"],["nz","u32"],["ke","u32"],["mode","u32"],["om","f32"]], buffers: [["K","f32","read"],["sc","f32","read"],["cq","i32","read"],["x","f32","read"],["b","f32","read"],["d","f32","read"],["y","f32","read_write"]], wgsl: `struct U { p_NX: u32,p_NY: u32,p_NZ: u32,p_nx: u32,p_ny: u32,p_nz: u32,p_ke: u32,p_mode: u32,p_om: f32 };
@group(0) @binding(0) var<uniform> u: U;
@group(0) @binding(1) var<storage, read> b_K: array<f32>;
@group(0) @binding(2) var<storage, read> b_sc: array<f32>;
@group(0) @binding(3) var<storage, read> b_cq: array<i32>;
@group(0) @binding(4) var<storage, read> b_x: array<f32>;
@group(0) @binding(5) var<storage, read> b_b: array<f32>;
@group(0) @binding(6) var<storage, read> b_d: array<f32>;
@group(0) @binding(7) var<storage, read_write> b_y: array<f32>;
fn h_lox(l_a: u32) -> u32 {
    return ((((l_a & 3u) + 1u) >> 1u) & 1u);
    return 0u;
}
fn h_loy(l_a: u32) -> u32 {
    return (((l_a & 3u) >> 1u) & 1u);
    return 0u;
}
fn h_loz(l_a: u32) -> u32 {
    return (l_a >> 2u);
    return 0u;
}
@compute @workgroup_size(64) fn main(@builtin(global_invocation_id) gw_g: vec3u, @builtin(num_workgroups) gw_n: vec3u) {
    let l_n: u32 = (gw_g.x + gw_g.y * gw_n.x * 64u);
    if ((l_n >= ((u.p_NX * u.p_NY) * u.p_NZ))) {
        return;
    }
    let l_i: u32 = (l_n % u.p_NX);
    let l_j: u32 = ((l_n / u.p_NX) % u.p_NY);
    let l_k: u32 = (l_n / (u.p_NX * u.p_NY));
    let l_e8: u32 = 8u;
    let l_e3: u32 = 3u;
    var l_a0: f32 = 0.0f;
    var l_a1: f32 = 0.0f;
    var l_a2: f32 = 0.0f;
    var l_u0: f32 = 0.0f;
    var l_u1: f32 = 0.0f;
    var l_u2: f32 = 0.0f;
    if ((u.p_ke == 0u)) {
        l_u0 = b_x[(3u * l_n)];
        l_u1 = b_x[((3u * l_n) + 1u)];
        l_u2 = b_x[((3u * l_n) + 2u)];
    }
    if ((u.p_mode != 3u)) {
        { let l_a_end: u32 = l_e8; for (var l_a: u32 = 0u; l_a < l_a_end; l_a++) {
            let l_lx: u32 = h_lox(l_a);
            let l_ly: u32 = h_loy(l_a);
            let l_lz: u32 = h_loz(l_a);
            if ((((l_i < l_lx) || (l_j < l_ly)) || (l_k < l_lz))) {
                continue;
            }
            let l_ci: u32 = (l_i - l_lx);
            let l_cj: u32 = (l_j - l_ly);
            let l_ck: u32 = (l_k - l_lz);
            if ((((l_ci >= u.p_nx) || (l_cj >= u.p_ny)) || (l_ck >= u.p_nz))) {
                continue;
            }
            let l_q: i32 = b_cq[((((l_ck * u.p_ny) + l_cj) * u.p_nx) + l_ci)];
            if ((l_q < 0i)) {
                continue;
            }
            let l_qu: u32 = u32(l_q);
            let l_kb: u32 = select(0u, (l_qu * 576u), (u.p_ke == 1u));
            let l_s: f32 = select(b_sc[l_qu], 1.0f, (u.p_ke == 1u));
            let l_n0: u32 = ((((l_ck * u.p_NY) + l_cj) * u.p_NX) + l_ci);
            var l_t0: f32 = 0.0f;
            var l_t1: f32 = 0.0f;
            var l_t2: f32 = 0.0f;
            { let l_e_end: u32 = l_e8; for (var l_e: u32 = 0u; l_e < l_e_end; l_e++) {
                let l_nb: u32 = (3u * (((l_n0 + h_lox(l_e)) + (h_loy(l_e) * u.p_NX)) + ((h_loz(l_e) * u.p_NX) * u.p_NY)));
                let l_v0: f32 = (b_x[l_nb] - l_u0);
                let l_v1: f32 = (b_x[(l_nb + 1u)] - l_u1);
                let l_v2: f32 = (b_x[(l_nb + 2u)] - l_u2);
                let l_r: u32 = ((l_kb + (72u * l_a)) + (3u * l_e));
                l_t0 = (l_t0 + (((b_K[l_r] * l_v0) + (b_K[(l_r + 1u)] * l_v1)) + (b_K[(l_r + 2u)] * l_v2)));
                l_t1 = (l_t1 + (((b_K[(l_r + 24u)] * l_v0) + (b_K[(l_r + 25u)] * l_v1)) + (b_K[(l_r + 26u)] * l_v2)));
                l_t2 = (l_t2 + (((b_K[(l_r + 48u)] * l_v0) + (b_K[(l_r + 49u)] * l_v1)) + (b_K[(l_r + 50u)] * l_v2)));
            } }
            l_a0 = (l_a0 + (l_s * l_t0));
            l_a1 = (l_a1 + (l_s * l_t1));
            l_a2 = (l_a2 + (l_s * l_t2));
        } }
    }
    { let l_c_end: u32 = l_e3; for (var l_c: u32 = 0u; l_c < l_c_end; l_c++) {
        let l_id: u32 = ((3u * l_n) + l_c);
        let l_ac: f32 = select(select(l_a2, l_a1, (l_c == 1u)), l_a0, (l_c == 0u));
        let l_dd: f32 = b_d[l_id];
        let l_fx: bool = (l_dd < 0.0f);
        var l_o: f32 = 0.0f;
        if ((u.p_mode == 0u)) {
            l_o = select(l_ac, b_x[l_id], l_fx);
        } else if ((u.p_mode == 1u)) {
            l_o = select((b_b[l_id] - l_ac), 0.0f, l_fx);
        } else if ((u.p_mode == 2u)) {
            l_o = select((b_x[l_id] + ((u.p_om * (b_b[l_id] - l_ac)) / l_dd)), 0.0f, l_fx);
        } else {
            l_o = select(((u.p_om * b_b[l_id]) / l_dd), 0.0f, l_fx);
        }
        b_y[l_id] = l_o;
    } }
}
`};
export default {mv};
