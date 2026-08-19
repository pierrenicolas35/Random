/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');

// Extract shuffle and computeDrawResults once from the raw HTML source,
// avoiding running the full page scripts (which use const declarations that
// cannot be re-declared across beforeEach calls in the same JSDOM environment).
const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');

// Grab the raw text of every <script>...</script> block via regex
const scriptTexts = [];
const scriptTagRe = /<script(?:[^>]*)>([\s\S]*?)<\/script>/gi;
let scriptTagMatch;
while ((scriptTagMatch = scriptTagRe.exec(html)) !== null) {
  scriptTexts.push(scriptTagMatch[1]);
}

let shuffleCode = null;
let functionCode = null;
for (const text of scriptTexts) {
  if (text.includes('function computeDrawResults')) {
    const shuffleMatch = text.match(/function shuffle\s*\([^)]*\)\s*\{[\s\S]*?(?=\n\s*function \w+\s*\()/);
    const fnMatch = text.match(/function computeDrawResults\s*\([^)]*\)\s*\{[\s\S]*?(?=\n\s*function \w+\s*\()/);
    if (shuffleMatch) shuffleCode = shuffleMatch[0];
    if (fnMatch) functionCode = fnMatch[0];
    break;
  }
}

if (!functionCode) {
  throw new Error('computeDrawResults not found in index.html');
}
if (!shuffleCode) {
  throw new Error('shuffle not found in index.html');
}

// Make both functions available on the window/global scope for all tests
// eslint-disable-next-line no-eval
eval(shuffleCode + '\n\n' + functionCode + '\nwindow.testComputeDrawResults = computeDrawResults;');

beforeEach(() => {
  // Set up only the minimal DOM elements that computeDrawResults reads
  document.body.innerHTML = `
    <input id="count" type="number" value="" />
    <input id="team-count" type="number" value="" />
  `;
});

describe('computeDrawResults', () => {
  describe('mode: single', () => {
    test('returns 1 winner by default when count is missing or invalid', () => {
      document.getElementById('count').value = '';
      const results = window.testComputeDrawResults(['A', 'B', 'C'], [], 'single');
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Gagnant #1');
      expect(['A', 'B', 'C']).toContain(results[0].value);
    });

    test('returns N winners based on count input', () => {
      document.getElementById('count').value = '2';
      const results = window.testComputeDrawResults(['A', 'B', 'C'], [], 'single');
      expect(results).toHaveLength(2);
      expect(results[0].title).toBe('Gagnant #1');
      expect(results[1].title).toBe('Gagnant #2');
      expect(results[0].value).not.toBe(results[1].value);
    });

    test('returns up to list length when count exceeds list length', () => {
      document.getElementById('count').value = '5';
      const results = window.testComputeDrawResults(['A', 'B'], [], 'single');
      expect(results).toHaveLength(2);
    });

    test('returns empty array for an empty list', () => {
      document.getElementById('count').value = '2';
      const results = window.testComputeDrawResults([], [], 'single');
      expect(results).toHaveLength(0);
    });

    test('returns 1 winner when count is non-positive', () => {
      document.getElementById('count').value = '0';
      const results = window.testComputeDrawResults(['A', 'B', 'C'], [], 'single');
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Gagnant #1');
    });
  });

  describe('mode: order', () => {
    test('returns all elements in random order with rank titles', () => {
      const results = window.testComputeDrawResults(['A', 'B', 'C'], [], 'order');
      expect(results).toHaveLength(3);
      expect(results[0].title).toBe('Rang #1');
      expect(results[1].title).toBe('Rang #2');
      expect(results[2].title).toBe('Rang #3');

      const values = results.map(r => r.value);
      expect(values.sort()).toEqual(['A', 'B', 'C']);
    });
  });

  describe('mode: pairs', () => {
    test('returns pairs when list length is even', () => {
      const results = window.testComputeDrawResults(['A', 'B', 'C', 'D'], [], 'pairs');
      expect(results).toHaveLength(2);
      expect(results[0].title).toBe('Binôme #1');
      expect(results[1].title).toBe('Binôme #2');
      expect(results[0].value).toContain(' & ');
      expect(results[1].value).toContain(' & ');
    });

    test('returns pairs and one single when list length is odd', () => {
      const results = window.testComputeDrawResults(['A', 'B', 'C'], [], 'pairs');
      expect(results).toHaveLength(2);

      const pair = results.find(r => r.title.startsWith('Binôme'));
      const single = results.find(r => r.title === 'Seul');

      expect(pair).toBeDefined();
      expect(single).toBeDefined();
      expect(pair.value).toContain(' & ');
      expect(single.value).not.toContain(' & ');
    });
  });

  describe('mode: teams', () => {
    test('returns 2 teams by default when team-count is missing', () => {
      document.getElementById('team-count').value = '';
      const results = window.testComputeDrawResults(['A', 'B', 'C', 'D'], [], 'teams');
      expect(results).toHaveLength(2);
      expect(results[0].title).toBe('Équipe 1');
      expect(results[1].title).toBe('Équipe 2');
    });

    test('returns N teams based on team-count input', () => {
      document.getElementById('team-count').value = '3';
      const results = window.testComputeDrawResults(['A', 'B', 'C', 'D', 'E'], [], 'teams');
      expect(results).toHaveLength(3);
      expect(results[0].title).toBe('Équipe 1');
      expect(results[1].title).toBe('Équipe 2');
      expect(results[2].title).toBe('Équipe 3');

      // All items should be distributed
      const allValues = results.flatMap(r => r.value.split(', '));
      expect(allValues.sort()).toEqual(['A', 'B', 'C', 'D', 'E']);
    });

    test('handles empty teams nicely', () => {
      document.getElementById('team-count').value = '5';
      const results = window.testComputeDrawResults(['A', 'B'], [], 'teams');
      expect(results).toHaveLength(5);

      const emptyTeams = results.filter(r => r.value === '—');
      expect(emptyTeams).toHaveLength(3);
    });
  });

  describe('mode: match', () => {
    test('matches items from list1 to list2', () => {
      const results = window.testComputeDrawResults(['A', 'B'], ['X', 'Y'], 'match');
      expect(results).toHaveLength(2);

      const titles = results.map(r => r.title);
      expect(titles.sort()).toEqual(['A', 'B']);

      const values = results.map(r => r.value.replace('➡️ ', ''));
      expect(values.sort()).toEqual(['X', 'Y']);
    });

    test('handles unequal list lengths', () => {
      const results = window.testComputeDrawResults(['A', 'B', 'C'], ['X'], 'match');
      expect(results).toHaveLength(3);

      const emptyMatches = results.filter(r => r.value === '➡️ —');
      expect(emptyMatches).toHaveLength(2);
    });
  });
});
