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

async function renderFormulaBlob(formula, displayMode) {
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '0';
    tempContainer.style.top = '0';
    tempContainer.style.transform = 'translateX(-9999px)';
    tempContainer.style.padding = '0';
    tempContainer.style.margin = '0';
    tempContainer.style.background = '#fff';
    tempContainer.style.color = '#000';
    tempContainer.style.opacity = '1';
    tempContainer.style.visibility = 'visible';
    tempContainer.style.zIndex = '-9999';
    tempContainer.style.pointerEvents = 'none';
    tempContainer.style.width = 'auto';
    tempContainer.style.height = 'auto';
    tempContainer.style.overflow = 'visible';
    tempContainer.style.display = 'inline-block';

    const wrapper = document.createElement('div');
    wrapper.style.display = 'inline-block';
    wrapper.style.padding = '0';
    wrapper.style.margin = '0';
    wrapper.style.background = '#fff';
    wrapper.style.color = '#000';
    wrapper.style.overflow = 'visible';
    wrapper.style.lineHeight = '1';
    wrapper.innerHTML = `
        <style>
            .katex, .katex-display { margin: 0 !important; padding: 0 !important; }
            .katex-display { display: inline-block !important; }
            .katex * { margin: 0 !important; padding: 0 !important; }
        </style>
    `;

    tempContainer.appendChild(wrapper);
    document.body.appendChild(tempContainer);

    try {
        katex.render(formula, wrapper, {
            displayMode,
            throwOnError: false,
            output: 'html',
        });

        // Remove KaTeX display margins after rendering
        const katexElements = wrapper.querySelectorAll('.katex, .katex-display');
        katexElements.forEach(el => {
            el.style.margin = '0';
            el.style.padding = '0';
        });

        await new Promise(requestAnimationFrame);

        const canvas = await html2canvas(wrapper, {
            backgroundColor: '#ffffff',
            scale: 2,
            useCORS: true,
            removeContainer: true,
        });

        const blob = await new Promise((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (blob) resolve(blob);
                else reject(new Error('Blob 생성 실패'));
            }, 'image/png');
        });

        return blob;
    } finally {
        tempContainer.remove();
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
        const blob = await renderFormulaBlob(formula, true);
        const item = new ClipboardItem({
            'image/png': blob,
            'text/plain': new Blob([formula], { type: 'text/plain' }),
        });
        await navigator.clipboard.write([item]);
        showToast('수식이 이미지로 복사되었습니다!');
    } catch (err) {
        console.error(err);
        try {
            const html = katex.renderToString(formula, { displayMode: true, output: 'html' });
            const fullHtml = `<div style="text-align: center; padding: 16px;">${html}</div>`;
            const blob = new Blob([fullHtml], { type: 'text/html' });
            const item = new ClipboardItem({
                'text/html': blob,
                'text/plain': new Blob([formula], { type: 'text/plain' }),
            });
            await navigator.clipboard.write([item]);
            showToast('수식을 HTML로 복사했습니다. Google Docs에서 이미지 복사가 지원되지 않습니다.');
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
        const blob = await renderFormulaBlob(formula, false);
        const item = new ClipboardItem({
            'image/png': blob,
            'text/plain': new Blob([formula], { type: 'text/plain' }),
        });
        await navigator.clipboard.write([item]);
        showToast('인라인 수식이 이미지로 복사되었습니다!');
    } catch (err) {
        console.error(err);
        try {
            const html = katex.renderToString(formula, { displayMode: false, output: 'html' });
            const fullHtml = `<span style="padding: 0 2px;">${html}</span>`;
            const blob = new Blob([fullHtml], { type: 'text/html' });
            const item = new ClipboardItem({
                'text/html': blob,
                'text/plain': new Blob([formula], { type: 'text/plain' }),
            });
            await navigator.clipboard.write([item]);
            showToast('수식을 HTML로 복사했습니다. Google Docs에서 이미지 복사가 지원되지 않습니다.');
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
