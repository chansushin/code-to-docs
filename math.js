/**
 * Math → Docs  —  LaTeX formula rendering and copying for Google Docs
 */

// ===== DOM Elements =====
const mathEls = {
    mathInput:        () => document.getElementById('math-input'),
    mathPreviewArea:  () => document.getElementById('math-preview-area'),
    btnCopyMathBlock: () => document.getElementById('btn-copy-math-block'),
    btnCopyMathInline: () => document.getElementById('btn-copy-math-inline'),
    btnClearMath:     () => document.getElementById('btn-clear-math'),
    toast:            () => document.getElementById('toast'),
};

// ===== Initialization =====
document.addEventListener('DOMContentLoaded', () => {
    mathEls.mathInput().addEventListener('input', updateMathPreview);
    mathEls.btnCopyMathBlock().addEventListener('click', copyMathBlock);
    mathEls.btnCopyMathInline().addEventListener('click', copyMathInline);
    mathEls.btnClearMath().addEventListener('click', clearMath);
});

// ===== Math Preview Rendering =====
function updateMathPreview() {
    const formula = mathEls.mathInput().value;
    const previewArea = mathEls.mathPreviewArea();

    if (!formula.trim()) {
        previewArea.innerHTML = '<div class="empty-state">수식을 입력하면 여기에 미리보기가 표시됩니다</div>';
        return;
    }

    try {
        // Render with KaTeX to HTML (better Google Docs compatibility)
        const html = katex.renderToString(formula, {
            displayMode: true,
            throwOnError: false,
            output: 'html',
        });
        previewArea.innerHTML = html;
    } catch (error) {
        previewArea.innerHTML = `<div class="empty-state" style="color: #d73a49;">수식 오류: ${error.message}</div>`;
    }
}

// ===== Copy Block Math =====
async function copyMathBlock() {
    const formula = mathEls.mathInput().value;
    if (!formula.trim()) {
        showToast('수식을 입력해주세요');
        return;
    }

    try {
        // Render to HTML (better Google Docs compatibility than MathML)
        const html = katex.renderToString(formula, {
            displayMode: true,
            output: 'html',
        });

        // Wrap in container for Google Docs
        const fullHtml = `<div style="text-align: center; padding: 16px;">${html}</div>`;

        const blob = new Blob([fullHtml], { type: 'text/html' });
        const item = new ClipboardItem({
            'text/html': blob,
            'text/plain': new Blob([formula], { type: 'text/plain' }),
        });
        await navigator.clipboard.write([item]);
        showToast('수식이 복사되었습니다!');
    } catch (err) {
        try {
            await navigator.clipboard.writeText(formula);
            showToast('수식이 텍스트로 복사되었습니다');
        } catch (e) {
            showToast('복사 실패. 수동으로 복사해주세요.');
        }
    }
}

// ===== Copy Inline Math =====
async function copyMathInline() {
    const formula = mathEls.mathInput().value;
    if (!formula.trim()) {
        showToast('수식을 입력해주세요');
        return;
    }

    try {
        // Render to inline HTML (better Google Docs compatibility)
        const html = katex.renderToString(formula, {
            displayMode: false,
            output: 'html',
        });

        const fullHtml = `<span style="padding: 0 2px;">${html}</span>`;

        const blob = new Blob([fullHtml], { type: 'text/html' });
        const item = new ClipboardItem({
            'text/html': blob,
            'text/plain': new Blob([formula], { type: 'text/plain' }),
        });
        await navigator.clipboard.write([item]);
        showToast('인라인 수식이 복사되었습니다!');
    } catch (err) {
        try {
            await navigator.clipboard.writeText(formula);
            showToast('수식이 텍스트로 복사되었습니다');
        } catch (e) {
            showToast('복사 실패. 수동으로 복사해주세요.');
        }
    }
}

// ===== Utility Functions =====
function clearMath() {
    mathEls.mathInput().value = '';
    updateMathPreview();
}

function showToast(message) {
    const toast = mathEls.toast();
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2500);
}
