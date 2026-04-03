/**
 * Code → Docs  —  Main application logic
 */

// ===== DOM Elements =====
const els = {
    language:       () => document.getElementById('language'),
    theme:          () => document.getElementById('theme'),
    fontSize:       () => document.getElementById('font-size'),
    fontFamily:     () => document.getElementById('font-family'),
    caption:        () => document.getElementById('caption'),
    codeInput:      () => document.getElementById('code-input'),
    autoIndent:     () => document.getElementById('auto-indent'),
    showLineNums:   () => document.getElementById('show-line-numbers'),
    indentSize:     () => document.getElementById('indent-size'),
    highlightLines: () => document.getElementById('highlight-lines'),
    previewArea:    () => document.getElementById('preview-area'),
    btnCopyBlock:   () => document.getElementById('btn-copy-block'),
    btnCopyInline:  () => document.getElementById('btn-copy-inline'),
    btnClear:       () => document.getElementById('btn-clear'),
    btnReindent:    () => document.getElementById('btn-reindent'),
    hljsThemeLink:  () => document.getElementById('hljs-theme'),
    toast:          () => document.getElementById('toast'),
};

// ===== Initialization =====
document.addEventListener('DOMContentLoaded', () => {
    // Bind events
    els.codeInput().addEventListener('input', updatePreview);
    els.codeInput().addEventListener('paste', handlePaste);
    els.codeInput().addEventListener('keydown', handleTab);
    els.language().addEventListener('change', updatePreview);
    els.theme().addEventListener('change', onThemeChange);
    els.fontSize().addEventListener('change', updatePreview);
    els.fontFamily().addEventListener('change', updatePreview);
    els.caption().addEventListener('input', updatePreview);
    els.showLineNums().addEventListener('change', updatePreview);
    els.highlightLines().addEventListener('input', updatePreview);
    els.btnCopyBlock().addEventListener('click', copyBlock);
    els.btnCopyInline().addEventListener('click', copyInline);
    els.btnClear().addEventListener('click', clearCode);
    els.btnReindent().addEventListener('click', reindentCode);

    // Initial state
    onThemeChange();
    updatePreview();
});

// ===== Theme switching =====
function onThemeChange() {
    const themeKey = els.theme().value;
    const theme = THEMES[themeKey];
    if (theme) {
        els.hljsThemeLink().href = theme.hljsCss;
    }
    updatePreview();
}

// ===== Preview rendering =====
function updatePreview() {
    const code = els.codeInput().value;
    const previewArea = els.previewArea();

    if (!code.trim()) {
        previewArea.innerHTML = '<div class="empty-state">코드를 입력하면 미리보기가 여기에 표시됩니다</div>';
        return;
    }

    const html = buildCodeBlockHTML(code);
    previewArea.innerHTML = html;
}

/**
 * Build the full HTML for a code block (used for both preview and clipboard copy).
 * Returns a self-contained HTML string with inline styles for Google Docs compatibility.
 */
function buildCodeBlockHTML(code) {
    const themeKey = els.theme().value;
    const theme = THEMES[themeKey] || THEMES['github-light'];
    const language = els.language().value;
    const fontSize = els.fontSize().value + 'pt';
    const fontFamily = els.fontFamily().value;
    const captionText = els.caption().value.trim();
    const showLineNums = els.showLineNums().checked;
    const highlightSet = parseHighlightLines(els.highlightLines().value);

    // Syntax highlight
    const highlighted = highlightCode(code, language);
    const lines = highlighted.split('\n');

    // Remove trailing empty line if present
    if (lines.length > 0 && lines[lines.length - 1] === '') {
        lines.pop();
    }

    // Common font style for all code spans
    const fontStyle = `font-family: ${fontFamily}, monospace; font-size: ${fontSize};`;

    // Build HTML using <p> tags (Google Docs friendly — no tables)
    let html = '';

    // Caption
    if (captionText) {
        html += `<p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 600; font-size: ${fontSize}; color: ${theme.captionColor}; margin: 0 0 4px 0; padding: 0;">${escapeHtml(captionText)}</p>`;
    }

    // Code block: each line is a <p> with background color
    const lineNumWidth = String(lines.length).length;

    lines.forEach((line, idx) => {
        const lineNum = idx + 1;
        const isHighlighted = highlightSet.has(lineNum);
        const bg = isHighlighted ? theme.highlightLineColor : theme.background;

        let lineHtml = `<p style="margin: 0; padding: 2px 12px; background: ${bg}; ${fontStyle} line-height: 1.5; color: ${theme.textColor}; white-space: pre;">`;

        // Line number as styled span
        if (showLineNums) {
            const numStr = String(lineNum).padStart(lineNumWidth, '\u00a0');
            lineHtml += `<span style="${fontStyle} color: ${theme.lineNumberColor};">${numStr}\u00a0\u00a0</span>`;
        }

        // Code content — spans already have inline color styles
        lineHtml += (line || '\u00a0');

        lineHtml += `</p>`;
        html += lineHtml;
    });

    return html;
}

/**
 * Highlight code using highlight.js, returning HTML with <span> tags.
 * Converts CSS class-based spans to inline styles for Google Docs compatibility.
 */
function highlightCode(code, language) {
    if (language === 'plaintext') {
        return escapeHtml(code);
    }
    try {
        const result = hljs.highlight(code, { language: language });
        return inlineHighlightStyles(result.value);
    } catch (e) {
        return escapeHtml(code);
    }
}

/**
 * Convert highlight.js class-based <span> tags to inline style attributes.
 * e.g. <span class="hljs-keyword">def</span>
 *   → <span style="color: #d73a49;">def</span>
 */
function inlineHighlightStyles(html) {
    const themeKey = els.theme().value;
    const theme = THEMES[themeKey] || THEMES['github-light'];
    const tokens = theme.tokens || {};

    return html.replace(/<span class="([^"]+)">/g, (match, classes) => {
        // classes may be "hljs-title function_" → try compound first, then individual
        const classList = classes.split(/\s+/);

        // Try compound key like "hljs-title.function_"
        let style = null;
        if (classList.length > 1) {
            const compoundKey = classList.join('.');
            style = tokens[compoundKey];
        }

        // Fallback: try the first class
        if (!style) {
            for (const cls of classList) {
                if (tokens[cls]) {
                    style = tokens[cls];
                    break;
                }
            }
        }

        if (style) {
            let styleStr = '';
            if (style.color) styleStr += `color: ${style.color};`;
            if (style.fontStyle) styleStr += ` font-style: ${style.fontStyle};`;
            if (style.fontWeight) styleStr += ` font-weight: ${style.fontWeight};`;
            if (style.backgroundColor) styleStr += ` background-color: ${style.backgroundColor};`;
            return `<span style="${styleStr}">`;
        }

        // No matching token — remove class, keep as plain span
        return '<span>';
    });
}

/**
 * Parse highlight lines input like "3, 5-7, 10" into a Set of line numbers.
 */
function parseHighlightLines(input) {
    const set = new Set();
    if (!input.trim()) return set;

    const parts = input.split(',');
    for (const part of parts) {
        const trimmed = part.trim();
        if (trimmed.includes('-')) {
            const [startStr, endStr] = trimmed.split('-');
            const start = parseInt(startStr, 10);
            const end = parseInt(endStr, 10);
            if (!isNaN(start) && !isNaN(end)) {
                for (let i = start; i <= end; i++) {
                    set.add(i);
                }
            }
        } else {
            const num = parseInt(trimmed, 10);
            if (!isNaN(num)) set.add(num);
        }
    }
    return set;
}

// ===== Indentation handling =====

/**
 * Handle paste event: auto-fix indentation if enabled.
 */
function handlePaste(e) {
    if (!els.autoIndent().checked) return;

    const text = e.clipboardData.getData('text/plain');
    if (!text) return;

    e.preventDefault();

    const fixed = fixIndentation(text, parseInt(els.indentSize().value, 10));
    insertAtCursor(els.codeInput(), fixed);
    updatePreview();
}

/**
 * Fix indentation: convert tabs to spaces, dedent, and normalize.
 */
function fixIndentation(code, targetIndent) {
    const language = els.language().value;
    let lines = code.split('\n');

    // Step 1: Convert tabs to spaces
    lines = lines.map(line => line.replace(/\t/g, ' '.repeat(targetIndent)));

    // Step 2: Remove common leading whitespace (dedent)
    const nonEmptyLines = lines.filter(l => l.trim().length > 0);
    if (nonEmptyLines.length === 0) return code;

    const minIndent = Math.min(...nonEmptyLines.map(l => l.match(/^(\s*)/)[1].length));
    if (minIndent > 0) {
        lines = lines.map(l => {
            if (l.trim().length === 0) return '';
            return l.substring(minIndent);
        });
    }

    // Step 3: Smart re-indent for Python
    if (language === 'python') {
        lines = smartIndentPython(lines, targetIndent);
    } else {
        // For other languages: normalize to target indent unit
        lines = normalizeIndent(lines, targetIndent);
    }

    return lines.join('\n');
}

/**
 * Smart Python indentation: infer block structure from keywords.
 */
function smartIndentPython(lines, targetIndent) {
    const blockOpeners = /^\s*(def |class |if |elif |else:|for |while |with |try:|except |finally:|async def |async for |async with )/;
    const dedentKeywords = /^\s*(return|break|continue|pass|raise)\b/;
    const sameLevel = /^\s*(elif |else:|except |finally:)/;

    // First pass: detect current indent levels
    const indentLevels = lines.map(l => {
        if (l.trim().length === 0) return -1;  // blank line
        return l.match(/^(\s*)/)[1].length;
    });

    // Find the actual indent unit used in the code
    let detectedUnit = 0;
    for (let i = 1; i < lines.length; i++) {
        if (indentLevels[i] > 0 && indentLevels[i] !== -1) {
            const prev = findPrevNonEmpty(indentLevels, i);
            if (prev !== -1 && indentLevels[prev] !== -1) {
                const diff = indentLevels[i] - indentLevels[prev];
                if (diff > 0 && (detectedUnit === 0 || diff < detectedUnit)) {
                    detectedUnit = diff;
                }
            }
        }
    }

    if (detectedUnit === 0 || detectedUnit === targetIndent) {
        return lines; // Already correct or can't detect
    }

    // Re-map indent levels
    return lines.map((line, idx) => {
        if (line.trim().length === 0) return '';
        const currentIndent = indentLevels[idx];
        const level = Math.round(currentIndent / detectedUnit);
        return ' '.repeat(level * targetIndent) + line.trimStart();
    });
}

/**
 * Normalize indentation for non-Python languages.
 */
function normalizeIndent(lines, targetIndent) {
    // Detect the smallest non-zero indent
    let detectedUnit = 0;
    for (const line of lines) {
        if (line.trim().length === 0) continue;
        const indent = line.match(/^(\s*)/)[1].length;
        if (indent > 0 && (detectedUnit === 0 || indent < detectedUnit)) {
            detectedUnit = indent;
        }
    }

    if (detectedUnit === 0 || detectedUnit === targetIndent) {
        return lines;
    }

    return lines.map(line => {
        if (line.trim().length === 0) return '';
        const indent = line.match(/^(\s*)/)[1].length;
        const level = Math.round(indent / detectedUnit);
        return ' '.repeat(level * targetIndent) + line.trimStart();
    });
}

/**
 * Find previous non-empty line index.
 */
function findPrevNonEmpty(levels, fromIdx) {
    for (let i = fromIdx - 1; i >= 0; i--) {
        if (levels[i] !== -1) return i;
    }
    return -1;
}

/**
 * Reindent the entire code in the textarea.
 */
function reindentCode() {
    const code = els.codeInput().value;
    if (!code.trim()) return;
    const fixed = fixIndentation(code, parseInt(els.indentSize().value, 10));
    els.codeInput().value = fixed;
    updatePreview();
    showToast('Indentation fixed');
}

// ===== Tab key support in textarea =====
function handleTab(e) {
    if (e.key === 'Tab') {
        e.preventDefault();
        const textarea = els.codeInput();
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const indent = ' '.repeat(parseInt(els.indentSize().value, 10));

        if (start === end) {
            // No selection: insert indent
            const before = textarea.value.substring(0, start);
            const after = textarea.value.substring(end);
            textarea.value = before + indent + after;
            textarea.selectionStart = textarea.selectionEnd = start + indent.length;
        } else {
            // Selection: indent/dedent selected lines
            const value = textarea.value;
            const lineStart = value.lastIndexOf('\n', start - 1) + 1;
            const lineEnd = value.indexOf('\n', end);
            const actualEnd = lineEnd === -1 ? value.length : lineEnd;
            const selectedText = value.substring(lineStart, actualEnd);

            let newText;
            if (e.shiftKey) {
                // Dedent
                newText = selectedText.split('\n').map(l => {
                    if (l.startsWith(indent)) return l.substring(indent.length);
                    return l.replace(/^\s+/, '');
                }).join('\n');
            } else {
                // Indent
                newText = selectedText.split('\n').map(l => indent + l).join('\n');
            }

            textarea.value = value.substring(0, lineStart) + newText + value.substring(actualEnd);
            textarea.selectionStart = lineStart;
            textarea.selectionEnd = lineStart + newText.length;
        }
        updatePreview();
    }
}

// ===== Clipboard copy =====

/**
 * Copy the formatted code block as Rich Text (HTML) to clipboard.
 */
async function copyBlock() {
    const code = els.codeInput().value;
    if (!code.trim()) {
        showToast('No code to copy');
        return;
    }

    const html = buildCodeBlockHTML(code);

    try {
        const blob = new Blob([html], { type: 'text/html' });
        const item = new ClipboardItem({
            'text/html': blob,
            'text/plain': new Blob([code], { type: 'text/plain' }),
        });
        await navigator.clipboard.write([item]);
        showToast('Code block copied! Paste into Google Docs with Ctrl+V');
    } catch (err) {
        // Fallback: copy as plain text
        try {
            await navigator.clipboard.writeText(code);
            showToast('Copied as plain text (Rich Text not supported in this browser)');
        } catch (e) {
            showToast('Copy failed. Please use Ctrl+C manually.');
        }
    }
}

/**
 * Copy as inline code: single line with background + monospace.
 */
async function copyInline() {
    const code = els.codeInput().value.trim();
    if (!code) {
        showToast('No code to copy');
        return;
    }

    const themeKey = els.theme().value;
    const theme = THEMES[themeKey] || THEMES['github-light'];
    const fontSize = els.fontSize().value + 'pt';
    const fontFamily = els.fontFamily().value;

    // Take first line only for inline
    const firstLine = code.split('\n')[0];
    const highlighted = highlightCode(firstLine, els.language().value);

    const html = `<span style="background: ${theme.background}; border: 1px solid ${theme.borderColor}; border-radius: 3px; padding: 2px 6px; font-family: ${fontFamily}, monospace; font-size: ${fontSize}; color: ${theme.textColor};">${highlighted}</span>`;

    try {
        const blob = new Blob([html], { type: 'text/html' });
        const item = new ClipboardItem({
            'text/html': blob,
            'text/plain': new Blob([firstLine], { type: 'text/plain' }),
        });
        await navigator.clipboard.write([item]);
        showToast('Inline code copied!');
    } catch (err) {
        try {
            await navigator.clipboard.writeText(firstLine);
            showToast('Copied as plain text');
        } catch (e) {
            showToast('Copy failed');
        }
    }
}

// ===== Utility functions =====

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function insertAtCursor(textarea, text) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = textarea.value.substring(0, start);
    const after = textarea.value.substring(end);
    textarea.value = before + text + after;
    textarea.selectionStart = textarea.selectionEnd = start + text.length;
}

function clearCode() {
    els.codeInput().value = '';
    els.caption().value = '';
    els.highlightLines().value = '';
    updatePreview();
}

function showToast(message) {
    const toast = els.toast();
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2500);
}
