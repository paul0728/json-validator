/**
 * JSON Editor - Complete JavaScript
 * Features: Edit, Format, Repair, Validate, Compare, Query, CSV Conversion
 */

// ========================================
// State Management
// ========================================
const state = {
    leftMode: 'text',
    rightMode: 'text',
    compareMode: false,
    leftData: null,
    rightData: null
};

// ========================================
// DOM Elements
// ========================================
const elements = {
    // Inputs
    leftInput: document.getElementById('json-input-left'),
    rightInput: document.getElementById('json-input-right'),
    leftLineNumbers: document.getElementById('line-numbers-left'),
    rightLineNumbers: document.getElementById('line-numbers-right'),

    // Tree containers
    leftTreeContainer: document.getElementById('tree-container-left'),
    rightTreeContainer: document.getElementById('tree-container-right'),

    // Table containers
    leftTableContainer: document.getElementById('table-container-left'),
    rightTableContainer: document.getElementById('table-container-right'),

    // Panels
    leftPanel: document.getElementById('left-panel'),
    rightPanel: document.getElementById('right-panel'),

    // Status
    statusValidity: document.getElementById('status-validity'),
    statusInfo: document.getElementById('status-info'),
    statusSize: document.getElementById('status-size'),

    // Modals
    queryModal: document.getElementById('query-modal'),
    validationModal: document.getElementById('validation-modal'),
    validationModalTitle: document.getElementById('validation-modal-title'),
    validationModalBody: document.getElementById('validation-modal-body'),
    queryInput: document.getElementById('query-input'),
    queryResult: document.getElementById('query-result'),

    // File input
    fileInput: document.getElementById('file-input')
};

// ========================================
// Line Numbers
// ========================================
function updateLineNumbers(textarea, lineNumbersEl) {
    const lines = textarea.value.split('\n').length;
    const numbers = Array.from({ length: lines }, (_, i) => i + 1).join('\n');
    lineNumbersEl.textContent = numbers;
}

function syncScroll(textarea, lineNumbersEl) {
    lineNumbersEl.scrollTop = textarea.scrollTop;
}

elements.leftInput.addEventListener('input', () => {
    updateLineNumbers(elements.leftInput, elements.leftLineNumbers);
    updateStatus();
});

elements.leftInput.addEventListener('scroll', () => {
    syncScroll(elements.leftInput, elements.leftLineNumbers);
});

elements.rightInput.addEventListener('input', () => {
    updateLineNumbers(elements.rightInput, elements.rightLineNumbers);
});

elements.rightInput.addEventListener('scroll', () => {
    syncScroll(elements.rightInput, elements.rightLineNumbers);
});

// ========================================
// Mode Switching
// ========================================
document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;
        const panel = btn.dataset.panel;

        // Update button state
        btn.parentElement.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Update view
        const panelEl = panel === 'left' ? elements.leftPanel : elements.rightPanel;
        panelEl.querySelectorAll('.editor-view').forEach(v => v.classList.remove('active'));
        panelEl.querySelector(`.editor-view[data-mode="${mode}"]`).classList.add('active');

        // Store state and render
        if (panel === 'left') {
            state.leftMode = mode;
            if (mode !== 'text') renderView('left');
        } else {
            state.rightMode = mode;
            if (mode !== 'text') renderView('right');
        }
    });
});

function renderView(side) {
    const input = side === 'left' ? elements.leftInput : elements.rightInput;
    const mode = side === 'left' ? state.leftMode : state.rightMode;
    const treeContainer = side === 'left' ? elements.leftTreeContainer : elements.rightTreeContainer;
    const tableContainer = side === 'left' ? elements.leftTableContainer : elements.rightTableContainer;

    try {
        const data = JSON.parse(input.value);

        if (mode === 'tree') {
            treeContainer.innerHTML = '';
            const tree = createTreeView(data, '', true);
            treeContainer.appendChild(tree);
        } else if (mode === 'table') {
            tableContainer.innerHTML = '';
            if (Array.isArray(data)) {
                const table = createTableView(data);
                tableContainer.appendChild(table);
            } else {
                tableContainer.innerHTML = '<div class="table-placeholder">表格模式僅適用於 JSON 陣列資料</div>';
            }
        }
    } catch (e) {
        if (mode === 'tree') {
            treeContainer.innerHTML = `<div class="table-placeholder">無效的 JSON: ${escapeHtml(e.message)}</div>`;
        } else if (mode === 'table') {
            tableContainer.innerHTML = `<div class="table-placeholder">無效的 JSON: ${escapeHtml(e.message)}</div>`;
        }
    }
}

// ========================================
// Tree View
// ========================================
function createTreeView(data, key = '', isRoot = false) {
    const node = document.createElement('div');
    node.className = 'tree-node' + (isRoot ? ' root' : '');

    const item = document.createElement('div');
    item.className = 'tree-item';

    const toggle = document.createElement('span');
    toggle.className = 'tree-toggle';

    const isExpandable = (typeof data === 'object' && data !== null);

    if (isExpandable) {
        toggle.textContent = '▼';
        toggle.addEventListener('click', () => {
            toggle.classList.toggle('collapsed');
            children.classList.toggle('collapsed');
        });
    } else {
        toggle.className = 'tree-toggle empty';
    }

    item.appendChild(toggle);

    // Key
    if (key !== '') {
        const keySpan = document.createElement('span');
        keySpan.className = 'tree-key';
        keySpan.textContent = `"${key}"`;
        item.appendChild(keySpan);

        const sep = document.createElement('span');
        sep.className = 'tree-separator';
        sep.textContent = ': ';
        item.appendChild(sep);
    }

    // Value
    if (data === null) {
        const val = document.createElement('span');
        val.className = 'tree-value null';
        val.textContent = 'null';
        item.appendChild(val);
    } else if (Array.isArray(data)) {
        const bracket = document.createElement('span');
        bracket.className = 'tree-bracket';
        bracket.textContent = '[';
        item.appendChild(bracket);

        const count = document.createElement('span');
        count.className = 'tree-count';
        count.textContent = `${data.length} items`;
        item.appendChild(count);
    } else if (typeof data === 'object') {
        const bracket = document.createElement('span');
        bracket.className = 'tree-bracket';
        bracket.textContent = '{';
        item.appendChild(bracket);

        const count = document.createElement('span');
        count.className = 'tree-count';
        count.textContent = `${Object.keys(data).length} keys`;
        item.appendChild(count);
    } else {
        const val = document.createElement('span');
        val.className = 'tree-value ' + typeof data;
        if (typeof data === 'string') {
            val.textContent = `"${data}"`;
        } else {
            val.textContent = String(data);
        }
        item.appendChild(val);
    }

    node.appendChild(item);

    // Children
    const children = document.createElement('div');
    children.className = 'tree-children';

    if (Array.isArray(data)) {
        data.forEach((v, i) => {
            children.appendChild(createTreeView(v, String(i)));
        });

        const closeBracket = document.createElement('div');
        closeBracket.className = 'tree-item';
        closeBracket.innerHTML = '<span class="tree-toggle empty"></span><span class="tree-bracket">]</span>';
        children.appendChild(closeBracket);
    } else if (typeof data === 'object' && data !== null) {
        Object.entries(data).forEach(([k, v]) => {
            children.appendChild(createTreeView(v, k));
        });

        const closeBracket = document.createElement('div');
        closeBracket.className = 'tree-item';
        closeBracket.innerHTML = '<span class="tree-toggle empty"></span><span class="tree-bracket">}</span>';
        children.appendChild(closeBracket);
    }

    node.appendChild(children);

    return node;
}

// ========================================
// Table View
// ========================================
function createTableView(data) {
    if (!Array.isArray(data) || data.length === 0) {
        const div = document.createElement('div');
        div.className = 'table-placeholder';
        div.textContent = '沒有資料可顯示';
        return div;
    }

    // Get all unique keys
    const keys = new Set();
    data.forEach(item => {
        if (typeof item === 'object' && item !== null) {
            Object.keys(item).forEach(k => keys.add(k));
        }
    });

    if (keys.size === 0) {
        const div = document.createElement('div');
        div.className = 'table-placeholder';
        div.textContent = '陣列元素不是物件，無法顯示為表格';
        return div;
    }

    const table = document.createElement('table');
    table.className = 'json-table';

    // Header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const indexTh = document.createElement('th');
    indexTh.textContent = '#';
    headerRow.appendChild(indexTh);

    keys.forEach(key => {
        const th = document.createElement('th');
        th.textContent = key;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Body
    const tbody = document.createElement('tbody');
    data.forEach((item, index) => {
        const row = document.createElement('tr');

        const indexTd = document.createElement('td');
        indexTd.textContent = index;
        row.appendChild(indexTd);

        keys.forEach(key => {
            const td = document.createElement('td');
            const value = item && item[key];
            if (value === null) {
                td.textContent = 'null';
                td.style.color = '#8b949e';
            } else if (value === undefined) {
                td.textContent = '';
            } else if (typeof value === 'object') {
                td.textContent = JSON.stringify(value);
            } else {
                td.textContent = String(value);
            }
            row.appendChild(td);
        });

        tbody.appendChild(row);
    });
    table.appendChild(tbody);

    return table;
}

// ========================================
// Status Updates
// ========================================
function updateStatus() {
    const value = elements.leftInput.value;
    const size = value.length;

    elements.statusSize.textContent = `${size.toLocaleString()} 字元`;

    if (!value.trim()) {
        elements.statusValidity.className = 'status-item';
        elements.statusValidity.innerHTML = '<span class="status-icon">⏳</span><span class="status-text">等待輸入</span>';
        elements.statusInfo.textContent = '';
        return;
    }

    try {
        const data = JSON.parse(value);
        elements.statusValidity.className = 'status-item valid';
        elements.statusValidity.innerHTML = '<span class="status-icon">✓</span><span class="status-text">JSON 有效</span>';

        if (Array.isArray(data)) {
            elements.statusInfo.textContent = `陣列，${data.length} 個元素`;
        } else if (typeof data === 'object') {
            elements.statusInfo.textContent = `物件，${Object.keys(data).length} 個屬性`;
        } else {
            elements.statusInfo.textContent = typeof data;
        }
    } catch (e) {
        elements.statusValidity.className = 'status-item invalid';
        elements.statusValidity.innerHTML = '<span class="status-icon">✗</span><span class="status-text">JSON 無效</span>';
        elements.statusInfo.textContent = '';
    }
}

// ========================================
// Toolbar Actions
// ========================================

// Open File
document.getElementById('btn-open').addEventListener('click', () => {
    elements.fileInput.click();
});

elements.fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const content = event.target.result;

        if (file.name.endsWith('.csv')) {
            // CSV to JSON
            const json = csvToJson(content);
            elements.leftInput.value = JSON.stringify(json, null, 2);
        } else {
            elements.leftInput.value = content;
        }

        updateLineNumbers(elements.leftInput, elements.leftLineNumbers);
        updateStatus();
        if (state.leftMode !== 'text') renderView('left');
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset
});

// Save/Download
document.getElementById('btn-save').addEventListener('click', () => {
    const content = elements.leftInput.value;
    if (!content.trim()) return;

    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});

// Format
document.getElementById('btn-format').addEventListener('click', () => {
    try {
        const data = JSON.parse(elements.leftInput.value);
        elements.leftInput.value = JSON.stringify(data, null, 2);
        updateLineNumbers(elements.leftInput, elements.leftLineNumbers);
        updateStatus();
        showToast('已格式化');
    } catch (e) {
        showValidationResult(false, e.message, elements.leftInput.value);
    }
});

// Minify
document.getElementById('btn-minify').addEventListener('click', () => {
    try {
        const data = JSON.parse(elements.leftInput.value);
        elements.leftInput.value = JSON.stringify(data);
        updateLineNumbers(elements.leftInput, elements.leftLineNumbers);
        updateStatus();
        showToast('已壓縮');
    } catch (e) {
        showValidationResult(false, e.message, elements.leftInput.value);
    }
});

// Repair
document.getElementById('btn-repair').addEventListener('click', () => {
    const content = elements.leftInput.value;
    const repaired = repairJson(content);

    if (repaired !== content) {
        elements.leftInput.value = repaired;
        updateLineNumbers(elements.leftInput, elements.leftLineNumbers);
        updateStatus();
        showToast('已嘗試修復 JSON');
    } else {
        showToast('無法自動修復，請手動檢查');
    }
});

// Validate
document.getElementById('btn-validate').addEventListener('click', () => {
    const content = elements.leftInput.value;
    const result = validateJson(content);
    showValidationResult(result.isValid, result.error, content, result.suggestions);
});

// Validate Serialized
document.getElementById('btn-validate-serialized').addEventListener('click', () => {
    const content = elements.leftInput.value;
    const deserialized = deserializeJson(content);
    const result = validateJson(deserialized);
    showValidationResultSerialized(result.isValid, result.error, deserialized, result.suggestions);
});

// Compare
document.getElementById('btn-compare').addEventListener('click', () => {
    try {
        const left = JSON.parse(elements.leftInput.value);
        const right = JSON.parse(elements.rightInput.value);
        const diff = compareJson(left, right);
        showCompareResult(diff);
    } catch (e) {
        showToast('請確保兩邊都是有效的 JSON');
    }
});

// Query
document.getElementById('btn-query').addEventListener('click', () => {
    elements.queryModal.classList.add('active');
    elements.queryInput.focus();
});

document.getElementById('close-query-modal').addEventListener('click', () => {
    elements.queryModal.classList.remove('active');
});

document.getElementById('btn-execute-query').addEventListener('click', () => {
    executeQuery();
});

elements.queryInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') executeQuery();
});

// JSON to CSV
document.getElementById('btn-to-csv').addEventListener('click', () => {
    try {
        const data = JSON.parse(elements.leftInput.value);
        const csv = jsonToCsv(data);
        elements.rightInput.value = csv;
        updateLineNumbers(elements.rightInput, elements.rightLineNumbers);
        showToast('已轉換為 CSV');
    } catch (e) {
        showToast('無法轉換：' + e.message);
    }
});

// CSV to JSON
document.getElementById('btn-from-csv').addEventListener('click', () => {
    const csv = elements.leftInput.value;
    try {
        const json = csvToJson(csv);
        elements.rightInput.value = JSON.stringify(json, null, 2);
        updateLineNumbers(elements.rightInput, elements.rightLineNumbers);
        showToast('已從 CSV 轉換為 JSON');
    } catch (e) {
        showToast('無法轉換：' + e.message);
    }
});

// ========================================
// Center Controls
// ========================================
document.getElementById('btn-copy-to-right').addEventListener('click', () => {
    elements.rightInput.value = elements.leftInput.value;
    updateLineNumbers(elements.rightInput, elements.rightLineNumbers);
    if (state.rightMode !== 'text') renderView('right');
});

document.getElementById('btn-copy-to-left').addEventListener('click', () => {
    elements.leftInput.value = elements.rightInput.value;
    updateLineNumbers(elements.leftInput, elements.leftLineNumbers);
    updateStatus();
    if (state.leftMode !== 'text') renderView('left');
});

document.getElementById('btn-swap').addEventListener('click', () => {
    const temp = elements.leftInput.value;
    elements.leftInput.value = elements.rightInput.value;
    elements.rightInput.value = temp;
    updateLineNumbers(elements.leftInput, elements.leftLineNumbers);
    updateLineNumbers(elements.rightInput, elements.rightLineNumbers);
    updateStatus();
    if (state.leftMode !== 'text') renderView('left');
    if (state.rightMode !== 'text') renderView('right');
});

document.getElementById('btn-show-diff').addEventListener('click', () => {
    document.getElementById('btn-compare').click();
});

// Panel Actions
document.getElementById('btn-copy-left').addEventListener('click', () => {
    navigator.clipboard.writeText(elements.leftInput.value);
    showToast('已複製到剪貼簿');
});

document.getElementById('btn-copy-right').addEventListener('click', () => {
    navigator.clipboard.writeText(elements.rightInput.value);
    showToast('已複製到剪貼簿');
});

document.getElementById('btn-clear-left').addEventListener('click', () => {
    elements.leftInput.value = '';
    updateLineNumbers(elements.leftInput, elements.leftLineNumbers);
    updateStatus();
    if (state.leftMode !== 'text') renderView('left');
});

document.getElementById('btn-clear-right').addEventListener('click', () => {
    elements.rightInput.value = '';
    updateLineNumbers(elements.rightInput, elements.rightLineNumbers);
    if (state.rightMode !== 'text') renderView('right');
});

// Expand/Collapse All
document.getElementById('btn-expand-all-left').addEventListener('click', () => {
    elements.leftTreeContainer.querySelectorAll('.tree-toggle.collapsed').forEach(t => t.click());
});

document.getElementById('btn-collapse-all-left').addEventListener('click', () => {
    elements.leftTreeContainer.querySelectorAll('.tree-toggle:not(.collapsed):not(.empty)').forEach(t => t.click());
});

document.getElementById('btn-expand-all-right').addEventListener('click', () => {
    elements.rightTreeContainer.querySelectorAll('.tree-toggle.collapsed').forEach(t => t.click());
});

document.getElementById('btn-collapse-all-right').addEventListener('click', () => {
    elements.rightTreeContainer.querySelectorAll('.tree-toggle:not(.collapsed):not(.empty)').forEach(t => t.click());
});

// ========================================
// JSON Repair
// ========================================
function repairJson(str) {
    let result = str.trim();

    // Remove trailing commas before } or ]
    result = result.replace(/,(\s*[}\]])/g, '$1');

    // Replace single quotes with double quotes
    result = result.replace(/'/g, '"');

    // Add quotes to unquoted keys
    result = result.replace(/(\{|\,)\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');

    // Fix undefined to null
    result = result.replace(/:\s*undefined\b/g, ': null');

    // Fix NaN to null
    result = result.replace(/:\s*NaN\b/g, ': null');

    // Remove control characters except newlines and tabs
    result = result.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');

    return result;
}

// ========================================
// JSON Validation
// ========================================
function validateJson(str) {
    const result = {
        isValid: false,
        error: null,
        errorPosition: null,
        suggestions: []
    };

    if (!str.trim()) {
        result.error = '請輸入 JSON 內容';
        return result;
    }

    try {
        JSON.parse(str);
        result.isValid = true;
    } catch (e) {
        result.error = e.message;
        result.errorPosition = parseErrorPosition(e.message, str);
        result.suggestions = generateSuggestions(str, e.message, result.errorPosition);
    }

    return result;
}

function parseErrorPosition(errorMessage, jsonString) {
    const position = { line: null, column: null, charIndex: null };

    const positionMatch = errorMessage.match(/position\s+(\d+)/i);
    const lineColMatch = errorMessage.match(/line\s+(\d+)\s+column\s+(\d+)/i);

    if (lineColMatch) {
        position.line = parseInt(lineColMatch[1]);
        position.column = parseInt(lineColMatch[2]);
    } else if (positionMatch) {
        position.charIndex = parseInt(positionMatch[1]);
        const lines = jsonString.substring(0, position.charIndex).split('\n');
        position.line = lines.length;
        position.column = lines[lines.length - 1].length + 1;
    }

    return position;
}

function generateSuggestions(str, errorMessage, errorPosition) {
    const suggestions = [];
    const lowerError = errorMessage.toLowerCase();

    if (str.match(/,\s*[}\]]/)) {
        suggestions.push({ message: '移除多餘的尾部逗號', fix: '找到 `,}` 或 `,]` 並移除逗號' });
    }

    if (str.match(/{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/)) {
        suggestions.push({ message: '為 key 加上雙引號', fix: '將 key: 改為 "key":' });
    }

    if (str.includes("'")) {
        suggestions.push({ message: '使用雙引號取代單引號', fix: "將所有 ' 替換為 \"" });
    }

    if (lowerError.includes('unexpected end')) {
        suggestions.push({ message: 'JSON 結構不完整', fix: '確認所有 { } 和 [ ] 都有正確配對' });
    }

    if (suggestions.length === 0) {
        suggestions.push({ message: '檢查 JSON 語法', fix: '確認格式正確，可嘗試使用「修復」功能' });
    }

    return suggestions;
}

function deserializeJson(str) {
    let result = str.trim();

    // Remove outer quotes
    if ((result.startsWith('"') && result.endsWith('"')) ||
        (result.startsWith("'") && result.endsWith("'"))) {
        result = result.slice(1, -1);
    }

    // Unescape
    try {
        result = JSON.parse(`"${result.replace(/"/g, '\\"')}"`);
    } catch {
        result = result
            .replace(/\\n/g, '\n')
            .replace(/\\r/g, '\r')
            .replace(/\\t/g, '\t')
            .replace(/\\"/g, '"')
            .replace(/\\\\/g, '\\');
    }

    return result;
}

// ========================================
// Show Validation Result
// ========================================
function showValidationResult(isValid, error, content, suggestions = []) {
    elements.validationModalTitle.textContent = '✓ 驗證結果';

    if (isValid) {
        elements.validationModalBody.innerHTML = `
            <div class="result-valid">
                <div class="success-icon">✅</div>
                <h3>JSON 格式正確！</h3>
                <p>您的 JSON 語法完全正確，可以安全使用。</p>
            </div>
        `;
    } else {
        const position = parseErrorPosition(error, content);
        let positionHtml = '';
        if (position.line) {
            positionHtml = `<div class="error-location">📍 第 <span>${position.line}</span> 行${position.column ? `，第 <span>${position.column}</span> 列` : ''}</div>`;
        }

        const suggestionsHtml = suggestions.length > 0 ? `
            <div class="suggestion-box">
                <h3>💡 修正建議</h3>
                <ul class="suggestion-list">
                    ${suggestions.map(s => `<li><strong>${s.message}</strong><br><span style="color: var(--text-secondary)">${s.fix}</span></li>`).join('')}
                </ul>
            </div>
        ` : '';

        elements.validationModalBody.innerHTML = `
            <div class="result-error">
                <div class="error-box">
                    <h3>❌ 錯誤訊息</h3>
                    <div class="error-message">${escapeHtml(error)}</div>
                    ${positionHtml}
                </div>
                ${suggestionsHtml}
            </div>
        `;
    }

    elements.validationModal.classList.add('active');
}

function showValidationResultSerialized(isValid, error, deserialized, suggestions = []) {
    elements.validationModalTitle.textContent = '🔗 序列化 JSON 驗證';

    const previewHtml = `
        <div class="deserialized-preview">
            <h3>🔄 反序列化結果</h3>
            <pre>${escapeHtml(deserialized)}</pre>
        </div>
    `;

    if (isValid) {
        elements.validationModalBody.innerHTML = `
            ${previewHtml}
            <div class="result-valid">
                <div class="success-icon">✅</div>
                <h3>JSON 格式正確！</h3>
                <p>反序列化後的 JSON 語法正確。</p>
            </div>
        `;
    } else {
        const suggestionsHtml = suggestions.length > 0 ? `
            <div class="suggestion-box">
                <h3>💡 修正建議</h3>
                <ul class="suggestion-list">
                    ${suggestions.map(s => `<li><strong>${s.message}</strong><br><span style="color: var(--text-secondary)">${s.fix}</span></li>`).join('')}
                </ul>
            </div>
        ` : '';

        elements.validationModalBody.innerHTML = `
            ${previewHtml}
            <div class="result-error">
                <div class="error-box">
                    <h3>❌ 錯誤訊息</h3>
                    <div class="error-message">${escapeHtml(error)}</div>
                </div>
                ${suggestionsHtml}
            </div>
        `;
    }

    elements.validationModal.classList.add('active');
}

document.getElementById('close-validation-modal').addEventListener('click', () => {
    elements.validationModal.classList.remove('active');
});

// ========================================
// JSON Compare
// ========================================
function compareJson(obj1, obj2, path = '') {
    const diffs = [];

    const type1 = Array.isArray(obj1) ? 'array' : typeof obj1;
    const type2 = Array.isArray(obj2) ? 'array' : typeof obj2;

    if (type1 !== type2) {
        diffs.push({ type: 'modified', path: path || 'root', old: obj1, new: obj2 });
        return diffs;
    }

    if (type1 !== 'object' || obj1 === null) {
        if (obj1 !== obj2) {
            diffs.push({ type: 'modified', path: path || 'root', old: obj1, new: obj2 });
        }
        return diffs;
    }

    if (Array.isArray(obj1)) {
        const maxLen = Math.max(obj1.length, obj2.length);
        for (let i = 0; i < maxLen; i++) {
            const newPath = path ? `${path}[${i}]` : `[${i}]`;
            if (i >= obj1.length) {
                diffs.push({ type: 'added', path: newPath, value: obj2[i] });
            } else if (i >= obj2.length) {
                diffs.push({ type: 'removed', path: newPath, value: obj1[i] });
            } else {
                diffs.push(...compareJson(obj1[i], obj2[i], newPath));
            }
        }
    } else {
        const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);
        for (const key of allKeys) {
            const newPath = path ? `${path}.${key}` : key;
            if (!(key in obj1)) {
                diffs.push({ type: 'added', path: newPath, value: obj2[key] });
            } else if (!(key in obj2)) {
                diffs.push({ type: 'removed', path: newPath, value: obj1[key] });
            } else {
                diffs.push(...compareJson(obj1[key], obj2[key], newPath));
            }
        }
    }

    return diffs;
}

function showCompareResult(diffs) {
    elements.validationModalTitle.textContent = '⚖️ 比較結果';

    if (diffs.length === 0) {
        elements.validationModalBody.innerHTML = `
            <div class="result-valid">
                <div class="success-icon">✅</div>
                <h3>兩個 JSON 完全相同！</h3>
            </div>
        `;
    } else {
        const diffHtml = diffs.map(d => {
            let icon, color, label;
            if (d.type === 'added') {
                icon = '+'; color = 'var(--success)'; label = '新增';
            } else if (d.type === 'removed') {
                icon = '-'; color = 'var(--error)'; label = '移除';
            } else {
                icon = '~'; color = 'var(--warning)'; label = '修改';
            }

            let valueHtml = '';
            if (d.type === 'modified') {
                valueHtml = `<br><span style="color: var(--error)">- ${JSON.stringify(d.old)}</span><br><span style="color: var(--success)">+ ${JSON.stringify(d.new)}</span>`;
            } else {
                valueHtml = `<br><span style="color: ${color}">${icon} ${JSON.stringify(d.value)}</span>`;
            }

            return `<div style="padding: 8px; margin: 4px 0; background: var(--bg-tertiary); border-radius: 4px; border-left: 3px solid ${color};">
                <strong style="color: ${color}">[${label}]</strong> <code>${d.path}</code>
                ${valueHtml}
            </div>`;
        }).join('');

        elements.validationModalBody.innerHTML = `
            <p style="margin-bottom: 16px;">發現 ${diffs.length} 處差異：</p>
            ${diffHtml}
        `;
    }

    elements.validationModal.classList.add('active');
}

// ========================================
// JSON Query (JSONPath-like)
// ========================================
function executeQuery() {
    const query = elements.queryInput.value.trim();
    if (!query) return;

    try {
        const data = JSON.parse(elements.leftInput.value);
        const result = jsonPathQuery(data, query);
        elements.queryResult.textContent = JSON.stringify(result, null, 2);
    } catch (e) {
        elements.queryResult.textContent = '錯誤: ' + e.message;
    }
}

function jsonPathQuery(data, path) {
    // Simple JSONPath implementation
    if (path === '$' || path === '') return data;

    // Remove leading $
    let p = path.replace(/^\$\.?/, '');

    // Handle recursive descent ..
    if (p.startsWith('..')) {
        const key = p.slice(2).split(/[.\[]/)[0];
        return findAllByKey(data, key);
    }

    // Split path
    const parts = [];
    let current = '';
    let inBracket = false;

    for (const char of p) {
        if (char === '[') {
            if (current) parts.push(current);
            current = '';
            inBracket = true;
        } else if (char === ']') {
            parts.push(current);
            current = '';
            inBracket = false;
        } else if (char === '.' && !inBracket) {
            if (current) parts.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    if (current) parts.push(current);

    // Navigate
    let result = data;
    for (const part of parts) {
        if (result === null || result === undefined) return undefined;

        if (part === '*') {
            if (Array.isArray(result)) {
                return result;
            } else if (typeof result === 'object') {
                return Object.values(result);
            }
        }

        // Array index or key
        const index = parseInt(part);
        if (!isNaN(index)) {
            result = result[index];
        } else {
            // Remove quotes
            const key = part.replace(/^["']|["']$/g, '');
            result = result[key];
        }
    }

    return result;
}

function findAllByKey(obj, key) {
    const results = [];

    function search(o) {
        if (Array.isArray(o)) {
            o.forEach(search);
        } else if (typeof o === 'object' && o !== null) {
            for (const [k, v] of Object.entries(o)) {
                if (k === key) results.push(v);
                search(v);
            }
        }
    }

    search(obj);
    return results;
}

// ========================================
// CSV Conversion
// ========================================
function jsonToCsv(data) {
    if (!Array.isArray(data)) {
        throw new Error('JSON 必須是陣列才能轉換為 CSV');
    }

    if (data.length === 0) return '';

    // Get headers
    const headers = new Set();
    data.forEach(item => {
        if (typeof item === 'object' && item !== null) {
            Object.keys(item).forEach(k => headers.add(k));
        }
    });

    const headerArr = Array.from(headers);

    // Build CSV
    const rows = [headerArr.map(h => `"${h}"`).join(',')];

    data.forEach(item => {
        const row = headerArr.map(h => {
            const val = item && item[h];
            if (val === null || val === undefined) return '';
            if (typeof val === 'object') return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
            if (typeof val === 'string') return `"${val.replace(/"/g, '""')}"`;
            return String(val);
        });
        rows.push(row.join(','));
    });

    return rows.join('\n');
}

function csvToJson(csv) {
    const lines = csv.trim().split('\n');
    if (lines.length < 2) return [];

    // Parse header
    const headers = parseCsvLine(lines[0]);

    // Parse data
    const result = [];
    for (let i = 1; i < lines.length; i++) {
        const values = parseCsvLine(lines[i]);
        const obj = {};
        headers.forEach((h, idx) => {
            let val = values[idx] || '';
            // Try to parse as number or boolean
            if (val === 'true') val = true;
            else if (val === 'false') val = false;
            else if (val === 'null') val = null;
            else if (!isNaN(val) && val !== '') val = Number(val);
            obj[h] = val;
        });
        result.push(obj);
    }

    return result;
}

function parseCsvLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);

    return result;
}

// ========================================
// Drag and Drop
// ========================================
[elements.leftPanel, elements.rightPanel].forEach((panel, idx) => {
    panel.addEventListener('dragover', (e) => {
        e.preventDefault();
        panel.classList.add('drag-over');
    });

    panel.addEventListener('dragleave', () => {
        panel.classList.remove('drag-over');
    });

    panel.addEventListener('drop', (e) => {
        e.preventDefault();
        panel.classList.remove('drag-over');

        const file = e.dataTransfer.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target.result;
            const input = idx === 0 ? elements.leftInput : elements.rightInput;
            const lineNumbers = idx === 0 ? elements.leftLineNumbers : elements.rightLineNumbers;

            if (file.name.endsWith('.csv')) {
                const json = csvToJson(content);
                input.value = JSON.stringify(json, null, 2);
            } else {
                input.value = content;
            }

            updateLineNumbers(input, lineNumbers);
            if (idx === 0) updateStatus();
        };
        reader.readAsText(file);
    });
});

// ========================================
// Toast Notification
// ========================================
function showToast(message) {
    // Remove existing toast
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 60px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--bg-tertiary);
        color: var(--text-primary);
        padding: 12px 24px;
        border-radius: 8px;
        border: 1px solid var(--border-color);
        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        z-index: 2000;
        animation: toastIn 0.3s ease;
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'toastOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

// Add toast animations
const style = document.createElement('style');
style.textContent = `
    @keyframes toastIn {
        from { opacity: 0; transform: translateX(-50%) translateY(20px); }
        to { opacity: 1; transform: translateX(-50%) translateY(0); }
    }
    @keyframes toastOut {
        from { opacity: 1; transform: translateX(-50%) translateY(0); }
        to { opacity: 0; transform: translateX(-50%) translateY(20px); }
    }
`;
document.head.appendChild(style);

// ========================================
// Utilities
// ========================================
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ========================================
// Keyboard Shortcuts
// ========================================
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Enter to validate
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        document.getElementById('btn-validate').click();
    }

    // Ctrl/Cmd + Shift + F to format
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        document.getElementById('btn-format').click();
    }

    // Escape to close modals
    if (e.key === 'Escape') {
        elements.queryModal.classList.remove('active');
        elements.validationModal.classList.remove('active');
    }
});

// ========================================
// Initialize
// ========================================
updateLineNumbers(elements.leftInput, elements.leftLineNumbers);
updateLineNumbers(elements.rightInput, elements.rightLineNumbers);
updateStatus();
