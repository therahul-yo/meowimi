export function validZone(value) {
  if (typeof value !== 'string') return 'UTC';
  try { new Intl.DateTimeFormat('en', {timeZone:value}).format(); return value; } catch { return 'UTC'; }
}
export function buildInput(history, message, created, zone) {
  const stamp = date => `${date} (${new Intl.DateTimeFormat('en-GB',{timeZone:zone,dateStyle:'full',timeStyle:'short'}).format(new Date(date))}, ${zone})`;
  return [...history.map(m => ({role:m.role, content:`[Sent ${stamp(m.created_at)}]\n${m.content}`})), {role:'user',content:`[Sent ${stamp(created)}]\n${message}`}];
}
export function citationsFrom(parts) {
  const seen = new Set();
  return parts.flatMap(part => (part.annotations || []).filter(a => a.type === 'url_citation').map(a => ({url:a.url, title:a.title || a.url}))).filter(c => {
    try { const u = new URL(c.url); if (!['https:','http:'].includes(u.protocol) || seen.has(c.url)) return false; seen.add(c.url); return true; } catch { return false; }
  });
}

// The API supplies citation ranges in each output-text part. Add links at the
// range ends without replacing the model's wording; process backwards so offsets stay valid.
export function annotate(parts, citations) {
  return parts.map(part => {
    const inserts = new Map();
    for (const a of part.annotations || []) {
      if (a.type !== 'url_citation' || !Number.isInteger(a.end_index) || a.end_index < 0 || a.end_index > part.text.length) continue;
      const index = citations.findIndex(c => c.url === a.url);
      if (index < 0) continue;
      const label = ` [${index + 1}](${a.url.replaceAll('(', '%28').replaceAll(')', '%29')})`;
      inserts.set(a.end_index, (inserts.get(a.end_index) || '') + label);
    }
    let text = part.text;
    for (const [position, label] of [...inserts].sort((a,b) => b[0]-a[0])) text = text.slice(0,position) + label + text.slice(position);
    return text;
  }).join('\n');
}
