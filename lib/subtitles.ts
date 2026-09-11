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

export type AnswerComparison = {
  correct: boolean;
  score: number;
  missing: string[];
  extra: string[];
};

export function compareAnswer(input: string, target: string): AnswerComparison {
  const inputWords = normalize(input).split(' ').filter(Boolean);
  const targetWords = normalize(target).split(' ').filter(Boolean);
  const rows = targetWords.length + 1;
  const columns = inputWords.length + 1;
  const lcs = Array.from({ length: rows }, () => Array<number>(columns).fill(0));

  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < columns; j++) {
      lcs[i][j] = targetWords[i - 1] === inputWords[j - 1]
        ? lcs[i - 1][j - 1] + 1
        : Math.max(lcs[i - 1][j], lcs[i][j - 1]);
    }
  }

  const matchedTarget = new Set<number>();
  const matchedInput = new Set<number>();
  let i = targetWords.length;
  let j = inputWords.length;
  while (i > 0 && j > 0) {
    if (targetWords[i - 1] === inputWords[j - 1]) {
      matchedTarget.add(i - 1);
      matchedInput.add(j - 1);
      i--;
      j--;
    } else if (lcs[i - 1][j] >= lcs[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  const matches = lcs[targetWords.length][inputWords.length];
  const total = Math.max(targetWords.length, inputWords.length, 1);
  return {
    correct: normalize(input) === normalize(target),
    score: Math.round(matches / total * 100),
    missing: targetWords.filter((_, wordIndex) => !matchedTarget.has(wordIndex)),
    extra: inputWords.filter((_, wordIndex) => !matchedInput.has(wordIndex)),
  };
}
