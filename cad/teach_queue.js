// Help Adam learn uploads that could not leave the device.
// Turning sharing off drops the queue. It does not delete anything already stored.
const KEY = 'amnicad.ai.teachq';

export function createTeachQueue(storage, {max = 40} = {}) {
  const read = () => {
    try { const a = JSON.parse(storage.getItem(KEY) || '[]'); return Array.isArray(a) ? a : []; }
    catch { return []; }
  };
  const write = a => { try { storage.setItem(KEY, JSON.stringify(a)); } catch { /* private mode */ } };
  return {
    key: KEY,
    push(row) { const a = read(); a.push(row); write(a.slice(-max)); },
    all: read,
    clear() { write([]); },
    async flush(post) {
      const a = read(), left = [];
      for (const row of a) {
        try { await post(row); }
        catch { left.push(row); }
      }
      write(left);
      return {sent: a.length - left.length, left: left.length};
    }
  };
}
