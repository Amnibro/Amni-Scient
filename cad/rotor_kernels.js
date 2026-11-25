export const rg_step = {wg: 64, uniform: [["NX","u32"],["NY","u32"],["NZ","u32"],["OX","u32"],["acc","u32"],["tau","f32"],["cs","f32"]], buffers: [["sol","u32","read"],["tb","i32","read"],["fq","f32","read"],["fa","f32","read"],["fb","f32","read_write"],["frc","f32","read"],["wv","f32","read"],["avg","f32","read_write"]], wgsl: `struct U { p_NX: u32,p_NY: u32,p_NZ: u32,p_OX: u32,p_acc: u32,p_tau: f32,p_cs: f32 };
@group(0) @binding(0) var<uniform> u: U;
@group(0) @binding(1) var<storage, read> b_sol: array<u32>;
@group(0) @binding(2) var<storage, read> b_tb: array<i32>;
@group(0) @binding(3) var<storage, read> b_fq: array<f32>;
@group(0) @binding(4) var<storage, read> b_fa: array<f32>;
@group(0) @binding(5) var<storage, read_write> b_fb: array<f32>;
@group(0) @binding(6) var<storage, read> b_frc: array<f32>;
@group(0) @binding(7) var<storage, read> b_wv: array<f32>;
@group(0) @binding(8) var<storage, read_write> b_avg: array<f32>;
fn h_feq( l_ex: i32,  l_ey: i32,  l_ez: i32,  l_w: f32,  l_r: f32,  l_ux: f32,  l_uy: f32,  l_uz: f32) -> f32 {
    let l_eu: f32 = (((f32(l_ex) * l_ux) + (f32(l_ey) * l_uy)) + (f32(l_ez) * l_uz));
    return ((l_w * l_r) * (((1.0f + (3.0f * l_eu)) + ((4.5f * l_eu) * l_eu)) - (1.5f * (((l_ux * l_ux) + (l_uy * l_uy)) + (l_uz * l_uz)))));
    return 0.0f;
}
@compute @workgroup_size(64) fn main(@builtin(global_invocation_id) gw_g: vec3u, @builtin(num_workgroups) gw_n: vec3u) {
    let l_n: u32 = (gw_g.x + gw_g.y * gw_n.x * 64u);
    let l_cells: u32 = ((u.p_NX * u.p_NY) * u.p_NZ);
    if ((l_n >= l_cells)) {
        return;
    }
    let l_ln: u32 = ((b_sol[(l_n / 4u)] >> (8u * (l_n % 4u))) & 255u);
    if ((l_ln != 0u)) {
        return;
    }
    let l_wx: i32 = i32(u.p_NX);
    let l_wy: i32 = i32(u.p_NY);
    let l_wz: i32 = i32(u.p_NZ);
    let l_x: i32 = i32((l_n % u.p_NX));
    let l_y: i32 = i32(((l_n / u.p_NX) % u.p_NY));
    let l_z: i32 = i32((l_n / (u.p_NX * u.p_NY)));
    var l_f: array<f32, 19>;
    var l_nw: bool = false;
    var l_bx: f32 = 0.0f;
    var l_by: f32 = 0.0f;
    var l_bz: f32 = 0.0f;
    if ((l_z == 0i)) {
        var l_br: f32 = 0.0f;
        { let l_j_end: u32 = 19u; for (var l_j: u32 = 0u; l_j < l_j_end; l_j++) {
            let l_fj: f32 = b_fa[((l_j * l_cells) + l_n)];
            l_br = (l_br + l_fj);
            l_bx = (l_bx + (l_fj * f32(b_tb[l_j])));
            l_by = (l_by + (l_fj * f32(b_tb[(19u + l_j)])));
            l_bz = (l_bz + (l_fj * f32(b_tb[(38u + l_j)])));
        } }
        l_bx = (l_bx / l_br);
        l_by = (l_by / l_br);
        l_bz = (l_bz / l_br);
        let l_bl: f32 = sqrt((((l_bx * l_bx) + (l_by * l_by)) + (l_bz * l_bz)));
        if ((l_bl > 0.3f)) {
            let l_bk: f32 = (0.3f / l_bl);
            l_bx = (l_bx * l_bk);
            l_by = (l_by * l_bk);
            l_bz = (l_bz * l_bk);
        }
    }
    { let l_i_end: u32 = 19u; for (var l_i: u32 = 0u; l_i < l_i_end; l_i++) {
        let l_ex: i32 = b_tb[l_i];
        let l_ey: i32 = b_tb[(19u + l_i)];
        let l_ez: i32 = b_tb[(38u + l_i)];
        let l_sx: i32 = (l_x - l_ex);
        let l_sy: i32 = (l_y - l_ey);
        let l_sz: i32 = (l_z - l_ez);
        if (((((l_sx < 0i) || (l_sy < 0i)) || (l_sy >= l_wy)) || (l_sz >= l_wz))) {
            l_f[l_i] = b_fq[(19u + l_i)];
        } else if ((l_sx >= l_wx)) {
            if ((u.p_OX == 1u)) {
                l_f[l_i] = b_fa[((l_i * l_cells) + l_n)];
            } else {
                l_f[l_i] = b_fq[(19u + l_i)];
            }
        } else if ((l_sz < 0i)) {
            l_f[l_i] = h_feq(l_ex, l_ey, l_ez, b_fq[l_i], 1.0f, l_bx, l_by, l_bz);
        } else {
            let l_s: u32 = u32((l_sx + (l_wx * (l_sy + (l_wy * l_sz)))));
            let l_ls: u32 = ((b_sol[(l_s / 4u)] >> (8u * (l_s % 4u))) & 255u);
            if ((l_ls == 0u)) {
                l_f[l_i] = b_fa[((l_i * l_cells) + l_s)];
            } else {
                let l_o: u32 = u32(b_tb[(57u + l_i)]);
                let l_fo: f32 = b_fa[((l_o * l_cells) + l_n)];
                l_f[l_i] = (l_fo + ((6.0f * b_fq[l_i]) * (((f32(l_ex) * b_wv[(3u * l_s)]) + (f32(l_ey) * b_wv[((3u * l_s) + 1u)])) + (f32(l_ez) * b_wv[((3u * l_s) + 2u)]))));
                l_nw = true;
            }
        }
    } }
    var l_r: f32 = 0.0f;
    var l_mx: f32 = 0.0f;
    var l_my: f32 = 0.0f;
    var l_mz: f32 = 0.0f;
    { let l_i_end: u32 = 19u; for (var l_i: u32 = 0u; l_i < l_i_end; l_i++) {
        l_r = (l_r + l_f[l_i]);
        l_mx = (l_mx + (l_f[l_i] * f32(b_tb[l_i])));
        l_my = (l_my + (l_f[l_i] * f32(b_tb[(19u + l_i)])));
        l_mz = (l_mz + (l_f[l_i] * f32(b_tb[(38u + l_i)])));
    } }
    let l_Fx: f32 = b_frc[(3u * l_n)];
    let l_Fy: f32 = b_frc[((3u * l_n) + 1u)];
    let l_Fz: f32 = b_frc[((3u * l_n) + 2u)];
    var l_ux: f32 = ((l_mx + (0.5f * l_Fx)) / l_r);
    var l_uy: f32 = ((l_my + (0.5f * l_Fy)) / l_r);
    var l_uz: f32 = ((l_mz + (0.5f * l_Fz)) / l_r);
    let l_speed: f32 = sqrt((((l_ux * l_ux) + (l_uy * l_uy)) + (l_uz * l_uz)));
    if ((l_speed > 0.3f)) {
        let l_k: f32 = (0.3f / l_speed);
        l_ux = (l_ux * l_k);
        l_uy = (l_uy * l_k);
        l_uz = (l_uz * l_k);
    }
    var l_qxx: f32 = 0.0f;
    var l_qyy: f32 = 0.0f;
    var l_qzz: f32 = 0.0f;
    var l_qxy: f32 = 0.0f;
    var l_qxz: f32 = 0.0f;
    var l_qyz: f32 = 0.0f;
    { let l_i_end: u32 = 19u; for (var l_i: u32 = 0u; l_i < l_i_end; l_i++) {
        let l_ex: i32 = b_tb[l_i];
        let l_ey: i32 = b_tb[(19u + l_i)];
        let l_ez: i32 = b_tb[(38u + l_i)];
        let l_d: f32 = (l_f[l_i] - h_feq(l_ex, l_ey, l_ez, b_fq[l_i], l_r, l_ux, l_uy, l_uz));
        let l_cx: f32 = f32(l_ex);
        let l_cy: f32 = f32(l_ey);
        let l_cz: f32 = f32(l_ez);
        l_qxx = (l_qxx + ((l_d * l_cx) * l_cx));
        l_qyy = (l_qyy + ((l_d * l_cy) * l_cy));
        l_qzz = (l_qzz + ((l_d * l_cz) * l_cz));
        l_qxy = (l_qxy + ((l_d * l_cx) * l_cy));
        l_qxz = (l_qxz + ((l_d * l_cx) * l_cz));
        l_qyz = (l_qyz + ((l_d * l_cy) * l_cz));
    } }
    let l_qm: f32 = sqrt(((((l_qxx * l_qxx) + (l_qyy * l_qyy)) + (l_qzz * l_qzz)) + (2.0f * (((l_qxy * l_qxy) + (l_qxz * l_qxz)) + (l_qyz * l_qyz)))));
    var l_w2: f32 = 1.0f;
    if (l_nw) {
        l_w2 = 0.5f;
    }
    let l_te: f32 = (0.5f * (u.p_tau + sqrt(((u.p_tau * u.p_tau) + (((((f32((18.0 * 1.4142135)) * u.p_cs) * u.p_cs) * l_w2) * l_qm) / l_r)))));
    let l_vx: f32 = (l_ux + ((0.5f * l_Fx) / l_r));
    let l_vy: f32 = (l_uy + ((0.5f * l_Fy) / l_r));
    let l_vz: f32 = (l_uz + ((0.5f * l_Fz) / l_r));
    let l_om: f32 = (1.0f - (1.0f / l_te));
    let l_t3: f32 = f32((1.0 / 3.0));
    { let l_i_end: u32 = 19u; for (var l_i: u32 = 0u; l_i < l_i_end; l_i++) {
        let l_ex: i32 = b_tb[l_i];
        let l_ey: i32 = b_tb[(19u + l_i)];
        let l_ez: i32 = b_tb[(38u + l_i)];
        let l_cx: f32 = f32(l_ex);
        let l_cy: f32 = f32(l_ey);
        let l_cz: f32 = f32(l_ez);
        b_fb[((l_i * l_cells) + l_n)] = (h_feq(l_ex, l_ey, l_ez, b_fq[l_i], l_r, l_vx, l_vy, l_vz) + (((l_om * b_fq[l_i]) * 4.5f) * ((((((l_cx * l_cx) - l_t3) * l_qxx) + (((l_cy * l_cy) - l_t3) * l_qyy)) + (((l_cz * l_cz) - l_t3) * l_qzz)) + (2.0f * ((((l_cx * l_cy) * l_qxy) + ((l_cx * l_cz) * l_qxz)) + ((l_cy * l_cz) * l_qyz))))));
    } }
    if ((u.p_acc == 1u)) {
        b_avg[(4u * l_n)] = (b_avg[(4u * l_n)] + l_r);
        b_avg[((4u * l_n) + 1u)] = (b_avg[((4u * l_n) + 1u)] + l_ux);
        b_avg[((4u * l_n) + 2u)] = (b_avg[((4u * l_n) + 2u)] + l_uy);
        b_avg[((4u * l_n) + 3u)] = (b_avg[((4u * l_n) + 3u)] + l_uz);
    }
}
`};
export const rg_wall = {wg: 64, uniform: [["NX","u32"],["NY","u32"],["NZ","u32"]], buffers: [["sol","u32","read"],["tb","i32","read"],["fq","f32","read"],["fa","f32","read"],["wv","f32","read"],["wf","f32","read_write"]], wgsl: `struct U { p_NX: u32,p_NY: u32,p_NZ: u32 };
@group(0) @binding(0) var<uniform> u: U;
@group(0) @binding(1) var<storage, read> b_sol: array<u32>;
@group(0) @binding(2) var<storage, read> b_tb: array<i32>;
@group(0) @binding(3) var<storage, read> b_fq: array<f32>;
@group(0) @binding(4) var<storage, read> b_fa: array<f32>;
@group(0) @binding(5) var<storage, read> b_wv: array<f32>;
@group(0) @binding(6) var<storage, read_write> b_wf: array<f32>;
@compute @workgroup_size(64) fn main(@builtin(global_invocation_id) gw_g: vec3u, @builtin(num_workgroups) gw_n: vec3u) {
    let l_n: u32 = (gw_g.x + gw_g.y * gw_n.x * 64u);
    let l_cells: u32 = ((u.p_NX * u.p_NY) * u.p_NZ);
    if ((l_n >= l_cells)) {
        return;
    }
    let l_ln: u32 = ((b_sol[(l_n / 4u)] >> (8u * (l_n % 4u))) & 255u);
    if ((l_ln == 0u)) {
        return;
    }
    let l_wx: i32 = i32(u.p_NX);
    let l_wy: i32 = i32(u.p_NY);
    let l_wz: i32 = i32(u.p_NZ);
    let l_x: i32 = i32((l_n % u.p_NX));
    let l_y: i32 = i32(((l_n / u.p_NX) % u.p_NY));
    let l_z: i32 = i32((l_n / (u.p_NX * u.p_NY)));
    var l_gx: f32 = 0.0f;
    var l_gy: f32 = 0.0f;
    var l_gz: f32 = 0.0f;
    { let l_k_end: u32 = 18u; for (var l_k: u32 = 0u; l_k < l_k_end; l_k++) {
        let l_i: u32 = (l_k + 1u);
        let l_ex: i32 = b_tb[l_i];
        let l_ey: i32 = b_tb[(19u + l_i)];
        let l_ez: i32 = b_tb[(38u + l_i)];
        let l_px: i32 = (l_x + l_ex);
        let l_py: i32 = (l_y + l_ey);
        let l_pz: i32 = (l_z + l_ez);
        if (((((((l_px < 0i) || (l_px >= l_wx)) || (l_py < 0i)) || (l_py >= l_wy)) || (l_pz < 0i)) || (l_pz >= l_wz))) {
            continue;
        }
        let l_c: u32 = u32((l_px + (l_wx * (l_py + (l_wy * l_pz)))));
        let l_lc: u32 = ((b_sol[(l_c / 4u)] >> (8u * (l_c % 4u))) & 255u);
        if ((l_lc != 0u)) {
            continue;
        }
        let l_o: u32 = u32(b_tb[(57u + l_i)]);
        let l_fo: f32 = b_fa[((l_o * l_cells) + l_c)];
        let l_fw: f32 = (l_fo + ((6.0f * b_fq[l_i]) * (((f32(l_ex) * b_wv[(3u * l_n)]) + (f32(l_ey) * b_wv[((3u * l_n) + 1u)])) + (f32(l_ez) * b_wv[((3u * l_n) + 2u)]))));
        let l_p: f32 = ((l_fo + l_fw) - (2.0f * b_fq[l_i]));
        l_gx = (l_gx + (l_p * f32(b_tb[l_o])));
        l_gy = (l_gy + (l_p * f32(b_tb[(19u + l_o)])));
        l_gz = (l_gz + (l_p * f32(b_tb[(38u + l_o)])));
    } }
    b_wf[(3u * l_n)] = (b_wf[(3u * l_n)] + l_gx);
    b_wf[((3u * l_n) + 1u)] = (b_wf[((3u * l_n) + 1u)] + l_gy);
    b_wf[((3u * l_n) + 2u)] = (b_wf[((3u * l_n) + 2u)] + l_gz);
}
`};
export default {rg_step, rg_wall};
