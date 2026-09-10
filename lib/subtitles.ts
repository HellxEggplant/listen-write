export type Sentence = { start: number; end: number; text: string };
const seconds = (s: string) => s.replace(',', '.').split(':').reduce((n, p) => n * 60 + Number(p), 0);
export function parseSubtitles(input: string): Sentence[] {
  const cues: Sentence[] = [];
  for (const block of input.replace(/\r/g, '').split(/\n\s*\n/)) {
    const lines = block.split('\n');
    const i = lines.findIndex(l => l.includes('-->'));
    if (i < 0) continue;
    const m = lines[i].match(/((?:\d{2}:)?\d{2}:\d{2}[.,]\d{3})\s*-->\s*((?:\d{2}:)?\d{2}:\d{2}[.,]\d{3})/);
    if (!m) continue;
    const text = lines.slice(i + 1).join(' ').replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
    const start = seconds(m[1]), end = seconds(m[2]);
    if (text && Number.isFinite(start) && end > start) cues.push({ start, end, text });
  }
  cues.sort((a,b) => a.start-b.start);
  const result: Sentence[] = [];
  let current: Sentence | undefined;
  for (const cue of cues) {
    if (current && cue.start-current.end > 1.5) { result.push(current); current=undefined; }
    current = current ? { start: current.start, end: Math.max(current.end,cue.end), text: current.text+' '+cue.text } : {...cue};
    if (/[.!?]["”')\]]*$/.test(current.text)) {result.push(current);current=undefined;}
  }
  if(current) result.push(current);
  return result;
}
export function normalize(s: string) { return s.toLowerCase().replace(/[’]/g,"'").replace(/[^a-z0-9'\s]/g,'').trim().replace(/\s+/g,' '); }
