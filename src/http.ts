export function pickQuery(req: any, allowed: string[]) {
  const out: Record<string, string> = {};
  for (const k of allowed) {
    const v = req.query?.[k];
    if (v === undefined || v === null || v === "") continue;
    out[k] = String(v);
  }
  return out;
}

export function toQueryString(params: Record<string, string>) {
  const usp = new URLSearchParams(params);
  const s = usp.toString();
  return s ? `?${s}` : "";
}
