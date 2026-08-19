const fs = require('fs');

global.window = { crypto: { getRandomValues: (arr) => {
    for (let i=0; i<arr.length; i++) arr[i] = Math.floor(Math.random() * 4294967296);
    return arr;
} } };
global.Uint32Array = Uint32Array;

const html = fs.readFileSync('./index.html', 'utf8');
const match = html.match(/function shuffle\(arr\) \{[\s\S]*?return a;\n\s*\}/);
if (!match) throw new Error("Could not find shuffle function in index.html");
const shuffle = new Function('return ' + match[0])();

describe('shuffle utility function', () => {

  it('returns a new array instance', () => {
    const orig = [1, 2, 3];
    const result = shuffle(orig);
    expect(result).not.toBe(orig);
  });

  it('does not mutate the original array', () => {
    const orig = [1, 2, 3];
    const origCopy = [...orig];
    shuffle(orig);
    expect(orig).toEqual(origCopy);
  });

  it('preserves length and elements', () => {
    const arr = [10, 20, 30, 40, 50];
    const res = shuffle(arr);
    expect(res.length).toBe(arr.length);
    expect([...res].sort()).toEqual([...arr].sort());
  });

  it('handles empty array', () => {
    const res = shuffle([]);
    expect(res).toEqual([]);
  });

  it('handles single element array', () => {
    const res = shuffle([42]);
    expect(res).toEqual([42]);
  });

  it('provides statistical randomness', () => {
    const counts = { 'a': 0, 'b': 0, 'c': 0 };
    const totalIterations = 3000;
    for (let i = 0; i < totalIterations; i++) {
        const s = shuffle(['a', 'b', 'c']);
        counts[s[0]]++;
    }
    expect(counts['a']).toBeGreaterThan(800);
    expect(counts['a']).toBeLessThan(1200);
    expect(counts['b']).toBeGreaterThan(800);
    expect(counts['b']).toBeLessThan(1200);
    expect(counts['c']).toBeGreaterThan(800);
    expect(counts['c']).toBeLessThan(1200);
  });
});
