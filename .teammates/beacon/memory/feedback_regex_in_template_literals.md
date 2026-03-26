---
name: Regex escaping in template literal code
description: Regex character classes (\s, \d, \w, \b) must be double-escaped when JS code is embedded in a TypeScript template literal string
type: feedback
---

Regex character classes like `\s`, `\d`, `\w`, `\b` lose their backslash when written inside a template literal (backtick string). The template literal treats `\s` as an unrecognized escape and produces just `s`. The browser then receives `/s+/` instead of `/\s+/`.

**Why:** The `html.ts` approach embeds all client-side JavaScript inside `getAppJs()` which returns a template literal string. Any regex in that string has its backslash-escapes processed by the template engine before reaching the browser. This caused the RLE decoder to silently produce empty strings — no error, just invisible failure.

**How to apply:** When writing regex patterns inside template literal strings (common in the pixel-explorer's `html.ts`), always double-escape: `\\s` not `\s`, `\\d` not `\d`, `\\w` not `\w`, `\\b` not `\b`. The double backslash survives template evaluation and arrives as the correct single backslash in the browser.
