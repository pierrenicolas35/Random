const fs = require('fs');

const html = fs.readFileSync('./index.html', 'utf-8');
const match = html.match(/function escapeHTML\(v\) \{[\s\S]*?\}/);

if (!match) {
    throw new Error('escapeHTML function not found in index.html');
}

// Evaluate the function in the local scope
const escapeHTML = new Function('v', `
    return (${match[0]})(v);
`);

describe('escapeHTML', () => {
    it('should escape &', () => {
        expect(escapeHTML('AT&T')).toBe('AT&amp;T');
    });
    it('should escape < and >', () => {
        expect(escapeHTML('<b>bold</b>')).toBe('&lt;b&gt;bold&lt;/b&gt;');
    });
    it('should escape double quotes', () => {
        expect(escapeHTML('say "hello"')).toBe('say &quot;hello&quot;');
    });
    it('should escape single quotes', () => {
        expect(escapeHTML("O'Reilly")).toBe('O&#39;Reilly');
    });
    it('should handle all together', () => {
        expect(escapeHTML('<script>alert("XSS & \'O Rly\'")</script>')).toBe('&lt;script&gt;alert(&quot;XSS &amp; &#39;O Rly&#39;&quot;)&lt;/script&gt;');
    });
    it('should handle string with no escaping needed', () => {
        expect(escapeHTML('hello world')).toBe('hello world');
    });
    it('should handle empty string', () => {
        expect(escapeHTML('')).toBe('');
    });
    // Let's add test for type coercion or if non-string is passed (although it might throw if replaceAll is called on non-string, but let's test a non-string object if the function expects string)
    it('should throw if non-string is passed since replaceAll is a string method', () => {
        expect(() => escapeHTML(null)).toThrow();
        expect(() => escapeHTML(undefined)).toThrow();
        expect(() => escapeHTML(123)).toThrow();
    });
});
