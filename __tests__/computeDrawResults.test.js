/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');

beforeEach(() => {
  const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
  document.body.innerHTML = html;

  // Extract the function from the script content
  const scripts = Array.from(document.querySelectorAll('script'));
  let functionCode = null;
  for (const script of scripts) {
    if (script.textContent.includes('function computeDrawResults')) {
      const match = script.textContent.match(/function computeDrawResults\s*\([^)]*\)\s*\{[\s\S]*?(?=function \w+\s*\(|$)/);
      if (match) {
        functionCode = match[0];

        // We also need the shuffle function
        const shuffleMatch = script.textContent.match(/function shuffle\s*\([^)]*\)\s*\{[\s\S]*?(?=function \w+\s*\(|$)/);
        if (shuffleMatch) {
            functionCode = shuffleMatch[0] + '\n\n' + functionCode;
        }
        break;
      }
    }
  }

  // Evaluate the function in the window scope so it has access to document
  // In jest jsdom, we can execute script element instead
  const testScript = document.createElement('script');
  testScript.textContent = functionCode + '\nwindow.testComputeDrawResults = computeDrawResults;';
  document.body.appendChild(testScript);
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
