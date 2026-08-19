const fs = require('fs');
const test = require('node:test');
const assert = require('node:assert');

// Extract the shuffle function from index.html
const html = fs.readFileSync('./index.html', 'utf8');
const match = html.match(/function shuffle\(arr\) \{[\s\S]*?return a;\n\s*\}/);
if (!match) throw new Error("Could not find shuffle function in index.html");
const shuffle = new Function('return ' + match[0])();

test('shuffle utility function', async (t) => {

  await t.test('returns a new array instance', () => {
    const orig = [1, 2, 3];
    const result = shuffle(orig);
    assert.notStrictEqual(result, orig);
  });

  await t.test('does not mutate the original array', () => {
    const orig = [1, 2, 3];
    const origCopy = [...orig];
    shuffle(orig);
    assert.deepStrictEqual(orig, origCopy);
  });

  await t.test('preserves length and elements', () => {
    const arr = [10, 20, 30, 40, 50];
    const res = shuffle(arr);
    assert.strictEqual(res.length, arr.length);
    // Sort before deep strict equal is a more rigorous check for element content
    assert.deepStrictEqual([...res].sort(), [...arr].sort());
  });

  await t.test('handles empty array', () => {
    const res = shuffle([]);
    assert.deepStrictEqual(res, []);
  });

  await t.test('handles single element array', () => {
    const res = shuffle([42]);
    assert.deepStrictEqual(res, [42]);
  });

  await t.test('provides statistical randomness', () => {
    const counts = { 'a': 0, 'b': 0, 'c': 0 };
    const totalIterations = 3000;
    for (let i = 0; i < totalIterations; i++) {
        const s = shuffle(['a', 'b', 'c']);
        counts[s[0]]++;
    }
    // With 3000 iterations, each element should appear roughly 1000 times at the first position.
    // Setting a safe threshold.
    assert.ok(counts['a'] > 800 && counts['a'] < 1200, `a count out of bounds: ${counts['a']}`);
    assert.ok(counts['b'] > 800 && counts['b'] < 1200, `b count out of bounds: ${counts['b']}`);
    assert.ok(counts['c'] > 800 && counts['c'] < 1200, `c count out of bounds: ${counts['c']}`);
  });
});