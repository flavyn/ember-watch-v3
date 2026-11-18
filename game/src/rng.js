// A simulation-owned stream; rendering never consumes it.
export function seeded(value = '1') {
  let state = 2166136261;
  for (const c of String(value)) state = Math.imul(state ^ c.charCodeAt(0), 16777619);
  return () => {
    state += 0x6D2B79F5;
    let n = state;
    n = Math.imul(n ^ n >>> 15, n | 1);
    n ^= n + Math.imul(n ^ n >>> 7, n | 61);
    return ((n ^ n >>> 14) >>> 0) / 4294967296;
  };
}
