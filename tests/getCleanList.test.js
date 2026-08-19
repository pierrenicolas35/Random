const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

describe('getCleanList', () => {
  let dom;
  let document;
  let window;
  let getCleanList;

  beforeEach(() => {
    const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
    dom = new JSDOM(html, { runScripts: 'dangerously' });
    document = dom.window.document;
    window = dom.window;
    getCleanList = window.getCleanList;
  });

  const setupTextarea = (id, value) => {
    // If the element already exists in the HTML, we should update it
    let textarea = document.getElementById(id);
    if (!textarea) {
      textarea = document.createElement('textarea');
      textarea.id = id;
      document.body.appendChild(textarea);
    }
    textarea.value = value;
    return textarea;
  };

  it('should split by newline, trim, and filter empty strings', () => {
    setupTextarea('list1', "  item1  \n\nitem2\n  \nitem3  ");
    const result = getCleanList('list1');
    expect(result).toEqual(['item1', 'item2', 'item3']);
  });

  it('should handle an empty textarea', () => {
    setupTextarea('list1', "");
    const result = getCleanList('list1');
    expect(result).toEqual([]);
  });

  it('should handle a textarea with only spaces and newlines', () => {
    setupTextarea('list1', "   \n  \n\n ");
    const result = getCleanList('list1');
    expect(result).toEqual([]);
  });

  it('should handle a single item', () => {
    setupTextarea('list1', "single item");
    const result = getCleanList('list1');
    expect(result).toEqual(['single item']);
  });

  it('should handle items with internal spaces', () => {
    setupTextarea('list1', "item 1\nitem 2");
    const result = getCleanList('list1');
    expect(result).toEqual(['item 1', 'item 2']);
  });

  it('should throw error if element does not exist', () => {
    expect(() => {
        getCleanList('non-existent-id');
    }).toThrow(window.TypeError);
  });
});
