// Amni-Construct AI jobs. Model calls go through cad/ai.js.
// Server prompts use cad/ai_meter.js and POST /api/ai/prompt, the same gate as Amni-CAD.
import {meterClass} from '../cad/ai_meter.js';
import {quantify} from './takeoff.js';

export const BANNER = 'Suggestion. Verify this against the drawings, the local code, and a licensed professional before you build, bid, or schedule.';

export const TASKS = {
  layout: {
    title: 'Build a layout from this image',
    needImage: true,
    ask: 'Read the photo, sketch, or plan. Propose a Construct layout: trade, name, units in feet, footprint corners, slab thickness in inches when it is concrete, and notes. Then a material takeoff and a rough cost estimate.'
  },
  review: {
    title: 'Review for code and spec issues',
    needImage: false,
    ask: 'Review the plan or the notes for code and specification issues a building department or inspector would ask about. Each issue needs where, why, and a severity of info, check, or stop.'
  },
  takeoff: {
    title: 'Material takeoff',
    needImage: false,
    ask: 'Produce a material takeoff with item, quantity, unit, and a note. Do not invent a price.'
  },
  estimate: {
    title: 'Cost estimate',
    needImage: false,
    ask: 'Produce a rough cost estimate with item, quantity, unit, unit cost in US dollars, and a note. Every price is a suggestion to check against a supplier.'
  },
  schedule: {
    title: 'Schedule',
    needImage: false,
    ask: 'Propose a construction schedule with phase, days, and a note. Include inspection holds and cure time where they matter.'
  },
  safety: {
    title: 'Safety checklist',
    needImage: false,
    ask: 'Write a job-site safety checklist. Cover calling 811 before digging, fall protection, electrical lockout, and PPE that fit this work.'
  }
};

export function systemPrompt(task) {
  const job = TASKS[task] || TASKS.layout;
  return `You are the assistant inside Amni-Construct, a browser tool for construction companies. You suggest layouts, takeoffs, estimates, schedules, code reviews, and safety checks. You do not stamp drawings and you do not approve work. ${BANNER}
Reply with ONE JSON object and nothing else:
{"say":"one or two sentences","layout":{"trade":"deck","name":"","units":"ft","footprint":[{"x":0,"y":0}],"thickness_in":0,"waste":"deck","notes":""},"takeoff":[{"item":"","qty":0,"unit":"","note":""}],"estimate":[{"item":"","qty":0,"unit":"","unit_cost":0,"note":""}],"schedule":[{"phase":"","days":0,"note":""}],"review":[{"issue":"","where":"","why":"","severity":"check"}],"safety":[{"item":""}]}
Use feet for lengths. Omit arrays you were not asked for. trade is one of deck, patio, pool, floor, roof, frame, plumb, elec, hvac, plan, garden.
This request: ${job.ask}`;
}

export function userTurn(task, notes, imageName) {
  const job = TASKS[task] || TASKS.layout;
  const bits = [job.ask];
  if (notes) bits.push('Notes from the user: ' + notes);
  if (imageName) bits.push('An image is attached: ' + imageName);
  bits.push('Reply with the JSON object only.');
  return bits.join('\n\n');
}

function extractJson(txt) {
  const s = String(txt || '').trim().replace(/<think>[\s\S]*?<\/think>/g, '');
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fence ? fence[1] : s;
  const a = body.indexOf('{'), b = body.lastIndexOf('}');
  if (a < 0 || b <= a) return null;
  try { return JSON.parse(body.slice(a, b + 1)); }
  catch { return null; }
}

const num = v => { const n = +v; return Number.isFinite(n) ? n : 0; };
const str = v => String(v == null ? '' : v).slice(0, 500);
const rows = (a, map) => Array.isArray(a) ? a.slice(0, 40).map(map).filter(Boolean) : [];

/** Turn a model reply into a report. Quantities on the footprint are recomputed here, not trusted from the model. */
export function parseReport(txt) {
  const o = extractJson(txt);
  if (!o || typeof o !== 'object') return {ok: false, say: String(txt || '').trim().slice(0, 800), banner: BANNER};
  const layout = o.layout && typeof o.layout === 'object' ? {
    trade: str(o.layout.trade || 'plan'),
    name: str(o.layout.name),
    units: 'ft',
    footprint: Array.isArray(o.layout.footprint) ? o.layout.footprint.slice(0, 80).map(p => ({x: num(p && p.x), y: num(p && p.y)})) : [],
    thickness_in: num(o.layout.thickness_in),
    waste: str(o.layout.waste),
    notes: str(o.layout.notes)
  } : null;
  return {
    ok: true,
    say: str(o.say || o.message),
    banner: BANNER,
    layout,
    qty: layout && layout.footprint.length >= 3 ? quantify(layout) : null,
    takeoff: rows(o.takeoff, r => r && ({item: str(r.item), qty: num(r.qty), unit: str(r.unit), note: str(r.note)})),
    estimate: rows(o.estimate, r => r && ({item: str(r.item), qty: num(r.qty), unit: str(r.unit), unit_cost: num(r.unit_cost), note: str(r.note)})),
    schedule: rows(o.schedule, r => r && ({phase: str(r.phase), days: num(r.days), note: str(r.note)})),
    review: rows(o.review, r => r && ({issue: str(r.issue), where: str(r.where), why: str(r.why), severity: ['info', 'check', 'stop'].includes(r.severity) ? r.severity : 'check'})),
    safety: rows(o.safety, r => r && ({item: str(r.item || r)}))
  };
}

/** Same split as Amni-CAD: on-device and a person's own key are not a server prompt. */
export function needsServerHold(kind, offlineHtml = false) {
  return meterClass(kind, {offlineHtml}) === 'server';
}

/**
 * What to do with the begin response from POST /api/ai/prompt.
 * Mirrors the Amni-CAD assistant: unlimited plans get no hold, a refusal stops, a hold must be committed or aborted.
 */
export function serverTurnPlan(begin) {
  if (!begin || begin.allow === false) return {call: 'refuse', reason: begin && begin.need === 'signin' ? 'signin' : 'limit'};
  if (!begin.hold) return {call: 'direct'};
  return {call: 'hold', hold: begin.hold};
}
