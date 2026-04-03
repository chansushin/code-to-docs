/**
 * Theme definitions for Code → Docs
 * Each theme defines colors for the code block background, text, and
 * a corresponding highlight.js stylesheet URL.
 */
const THEMES = {
    'github-light': {
        name: 'GitHub Light',
        hljsCss: 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css',
        background: '#f6f8fa',
        textColor: '#24292e',
        borderColor: '#e1e4e8',
        lineNumberColor: '#6e7781',
        highlightLineColor: '#fff8c5',
        captionColor: '#24292e',
    },
    'github-dark': {
        name: 'GitHub Dark',
        hljsCss: 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css',
        background: '#0d1117',
        textColor: '#c9d1d9',
        borderColor: '#30363d',
        lineNumberColor: '#6e7681',
        highlightLineColor: '#3b2e00',
        captionColor: '#c9d1d9',
    },
    'vs-light': {
        name: 'VS Code Light',
        hljsCss: 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/vs.min.css',
        background: '#ffffff',
        textColor: '#000000',
        borderColor: '#e0e0e0',
        lineNumberColor: '#237893',
        highlightLineColor: '#ffffcc',
        captionColor: '#000000',
    },
    'vs-dark': {
        name: 'VS Code Dark',
        hljsCss: 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/vs2015.min.css',
        background: '#1e1e1e',
        textColor: '#d4d4d4',
        borderColor: '#3c3c3c',
        lineNumberColor: '#858585',
        highlightLineColor: '#2a2d2e',
        captionColor: '#d4d4d4',
    },
    'monokai': {
        name: 'Monokai',
        hljsCss: 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/monokai.min.css',
        background: '#272822',
        textColor: '#f8f8f2',
        borderColor: '#49483e',
        lineNumberColor: '#8f908a',
        highlightLineColor: '#3e3d32',
        captionColor: '#f8f8f2',
    },
};
