/**
 * JSON Validator - Main JavaScript
 * Handles JSON validation, error detection, and suggestion generation
 */

// ========================================
// DOM Elements
// ========================================
const elements = {
    // Tabs
    tabBtns: document.querySelectorAll('.tab-btn'),
    tabPanels: document.querySelectorAll('.tab-panel'),
    
    // Raw JSON
    rawInput: document.getElementById('raw-input'),
    rawLineNumbers: document.getElementById('raw-line-numbers'),
    rawValidateBtn: document.getElementById('raw-validate-btn'),
    rawFormatBtn: document.getElementById('raw-format-btn'),
    rawClearBtn: document.getElementById('raw-clear-btn'),
    
    // Serialized JSON
    serializedInput: document.getElementById('serialized-input'),
    serializedLineNumbers: document.getElementById('serialized-line-numbers'),
    serializedValidateBtn: document.getElementById('serialized-validate-btn'),
    serializedDeserializeBtn: document.getElementById('serialized-deserialize-btn'),
    serializedClearBtn: document.getElementById('serialized-clear-btn'),
    
    // Results
    resultSection: document.getElementById('result-section'),
    resultStatus: document.getElementById('result-status'),
    resultContent: document.getElementById('result-content')
};

// ========================================
// Tab Switching
// ========================================
elements.tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const targetTab = btn.dataset.tab;
        
        // Update active tab button
        elements.tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Update active panel
        elements.tabPanels.forEach(panel => {
            panel.classList.remove('active');
            if (panel.id === `${targetTab}-panel`) {
                panel.classList.add('active');
            }
        });
        
        // Reset result
        resetResult();
    });
});

// ========================================
// Line Number Updates
// ========================================
function updateLineNumbers(textarea, lineNumbersEl) {
    const lines = textarea.value.split('\n').length;
    const lineNumbers = Array.from({ length: lines }, (_, i) => i + 1).join('\n');
    lineNumbersEl.textContent = lineNumbers;
}

// Sync scroll between textarea and line numbers
function syncScroll(textarea, lineNumbersEl) {
    lineNumbersEl.scrollTop = textarea.scrollTop;
}

// Raw JSON line numbers
elements.rawInput.addEventListener('input', () => {
    updateLineNumbers(elements.rawInput, elements.rawLineNumbers);
});

elements.rawInput.addEventListener('scroll', () => {
    syncScroll(elements.rawInput, elements.rawLineNumbers);
});

// Serialized JSON line numbers
elements.serializedInput.addEventListener('input', () => {
    updateLineNumbers(elements.serializedInput, elements.serializedLineNumbers);
});

elements.serializedInput.addEventListener('scroll', () => {
    syncScroll(elements.serializedInput, elements.serializedLineNumbers);
});

// ========================================
// JSON Validation
// ========================================
function validateJSON(jsonString) {
    const result = {
        isValid: false,
        error: null,
        errorPosition: null,
        suggestions: []
    };
    
    if (!jsonString.trim()) {
        result.error = '請輸入 JSON 內容';
        return result;
    }
    
    try {
        JSON.parse(jsonString);
        result.isValid = true;
    } catch (e) {
        result.error = e.message;
        result.errorPosition = parseErrorPosition(e.message, jsonString);
        result.suggestions = generateSuggestions(jsonString, e.message, result.errorPosition);
    }
    
    return result;
}

// ========================================
// Error Position Parsing
// ========================================
function parseErrorPosition(errorMessage, jsonString) {
    const position = {
        line: null,
        column: null,
        charIndex: null
    };
    
    // Try to extract position from error message
    // Format varies: "at position X" or "at line X column Y"
    const positionMatch = errorMessage.match(/position\s+(\d+)/i);
    const lineColMatch = errorMessage.match(/line\s+(\d+)\s+column\s+(\d+)/i);
    
    if (lineColMatch) {
        position.line = parseInt(lineColMatch[1]);
        position.column = parseInt(lineColMatch[2]);
    } else if (positionMatch) {
        position.charIndex = parseInt(positionMatch[1]);
        // Convert character index to line and column
        const lines = jsonString.substring(0, position.charIndex).split('\n');
        position.line = lines.length;
        position.column = lines[lines.length - 1].length + 1;
    }
    
    return position;
}

// ========================================
// Suggestion Generation
// ========================================
function generateSuggestions(jsonString, errorMessage, errorPosition) {
    const suggestions = [];
    const lowerError = errorMessage.toLowerCase();
    
    // Check for common issues
    
    // 1. Trailing comma
    if (jsonString.match(/,\s*[}\]]/)) {
        suggestions.push({
            type: 'trailing-comma',
            message: '移除最後一個元素後的多餘逗號',
            fix: '找到 `,}` 或 `,]` 並移除逗號'
        });
    }
    
    // 2. Missing quotes around keys
    const unquotedKeyMatch = jsonString.match(/{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/);
    if (unquotedKeyMatch) {
        suggestions.push({
            type: 'unquoted-key',
            message: `為 key 加上雙引號`,
            fix: `將 ${unquotedKeyMatch[1]}: 改為 "${unquotedKeyMatch[1]}":`
        });
    }
    
    // 3. Single quotes instead of double quotes
    if (jsonString.includes("'")) {
        suggestions.push({
            type: 'single-quotes',
            message: '使用雙引號取代單引號',
            fix: "將所有 ' 替換為 \""
        });
    }
    
    // 4. Missing comma between elements
    if (lowerError.includes('expected') && (lowerError.includes(',') || lowerError.includes('comma'))) {
        suggestions.push({
            type: 'missing-comma',
            message: '在元素之間加上逗號',
            fix: '檢查物件或陣列中的元素是否有用逗號分隔'
        });
    }
    
    // 5. Unexpected token
    if (lowerError.includes('unexpected token')) {
        suggestions.push({
            type: 'unexpected-token',
            message: '檢查 JSON 語法',
            fix: '確認所有 key 使用雙引號，字串值使用雙引號，沒有多餘的逗號'
        });
    }
    
    // 6. Unexpected end of JSON
    if (lowerError.includes('end of json') || lowerError.includes('unexpected end')) {
        suggestions.push({
            type: 'incomplete-json',
            message: 'JSON 結構不完整',
            fix: '確認所有的 { } 和 [ ] 都有正確配對關閉'
        });
    }
    
    // 7. Control characters
    if (lowerError.includes('control character') || lowerError.includes('invalid character')) {
        suggestions.push({
            type: 'control-chars',
            message: '字串中包含無效的控制字元',
            fix: '確認換行使用 \\n，Tab 使用 \\t，或移除不可見字元'
        });
    }
    
    // 8. Check for common mistakes at error position
    if (errorPosition && errorPosition.charIndex !== null) {
        const nearbyText = jsonString.substring(
            Math.max(0, errorPosition.charIndex - 10),
            Math.min(jsonString.length, errorPosition.charIndex + 10)
        );
        
        // Check for undefined/null without quotes
        if (nearbyText.match(/:\s*(undefined|NaN)/i)) {
            suggestions.push({
                type: 'invalid-value',
                message: 'JSON 不支援 undefined 或 NaN',
                fix: '使用 null 取代 undefined，或使用字串 "NaN"'
            });
        }
    }
    
    // General suggestion if no specific ones found
    if (suggestions.length === 0) {
        suggestions.push({
            type: 'general',
            message: '檢查 JSON 格式',
            fix: '使用線上 JSON 格式化工具檢查，或逐行檢查語法錯誤'
        });
    }
    
    return suggestions;
}

// ========================================
// Serialized JSON Handling
// ========================================
function deserializeJSON(serializedString) {
    let result = serializedString.trim();
    
    // Remove outer quotes if present
    if ((result.startsWith('"') && result.endsWith('"')) || 
        (result.startsWith("'") && result.endsWith("'"))) {
        result = result.slice(1, -1);
    }
    
    // Handle common escape sequences
    try {
        // Try using JSON.parse to unescape
        result = JSON.parse(`"${result.replace(/"/g, '\\"')}"`);
    } catch {
        // Manual unescape
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
// Result Display
// ========================================
function resetResult() {
    elements.resultStatus.className = 'result-status';
    elements.resultStatus.innerHTML = `
        <span class="status-icon">⏳</span>
        <span class="status-text">等待輸入...</span>
    `;
    elements.resultContent.innerHTML = `
        <div class="empty-state">
            <div class="empty-icon">🔍</div>
            <p>輸入 JSON 後點擊「驗證」按鈕</p>
        </div>
    `;
}

function showValidResult(extraInfo = '') {
    elements.resultStatus.className = 'result-status success';
    elements.resultStatus.innerHTML = `
        <span class="status-icon">✓</span>
        <span class="status-text">JSON 格式正確</span>
    `;
    
    elements.resultContent.innerHTML = `
        <div class="result-valid">
            <div class="success-icon">✅</div>
            <h3>JSON 格式正確！</h3>
            <p>您的 JSON 語法完全正確，可以安全使用。</p>
        </div>
        ${extraInfo}
    `;
}

function showErrorResult(error, position, suggestions, extraInfo = '') {
    elements.resultStatus.className = 'result-status error';
    elements.resultStatus.innerHTML = `
        <span class="status-icon">✗</span>
        <span class="status-text">JSON 格式錯誤</span>
    `;
    
    let positionHtml = '';
    if (position && (position.line || position.charIndex !== null)) {
        if (position.line) {
            positionHtml = `
                <div class="error-location">
                    📍 錯誤位置：第 <span>${position.line}</span> 行${position.column ? `，第 <span>${position.column}</span> 列` : ''}
                </div>
            `;
        } else if (position.charIndex !== null) {
            positionHtml = `
                <div class="error-location">
                    📍 錯誤位置：字元位置 <span>${position.charIndex}</span>
                </div>
            `;
        }
    }
    
    const suggestionsHtml = suggestions.length > 0 ? `
        <div class="suggestion-box">
            <h3>💡 修正建議</h3>
            <ul class="suggestion-list">
                ${suggestions.map(s => `
                    <li>
                        <div>
                            <strong>${s.message}</strong><br>
                            <span style="color: var(--text-secondary);">${s.fix}</span>
                        </div>
                    </li>
                `).join('')}
            </ul>
        </div>
    ` : '';
    
    elements.resultContent.innerHTML = `
        ${extraInfo}
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

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ========================================
// Event Handlers
// ========================================

// Raw JSON - Validate
elements.rawValidateBtn.addEventListener('click', () => {
    const jsonString = elements.rawInput.value;
    const result = validateJSON(jsonString);
    
    if (result.isValid) {
        showValidResult();
    } else {
        showErrorResult(result.error, result.errorPosition, result.suggestions);
    }
});

// Raw JSON - Format
elements.rawFormatBtn.addEventListener('click', () => {
    const jsonString = elements.rawInput.value;
    
    try {
        const parsed = JSON.parse(jsonString);
        const formatted = JSON.stringify(parsed, null, 2);
        elements.rawInput.value = formatted;
        updateLineNumbers(elements.rawInput, elements.rawLineNumbers);
        
        // Show success message
        elements.resultStatus.className = 'result-status success';
        elements.resultStatus.innerHTML = `
            <span class="status-icon">✨</span>
            <span class="status-text">已格式化</span>
        `;
    } catch (e) {
        // Show error - can't format invalid JSON
        const result = validateJSON(jsonString);
        showErrorResult(
            '無法格式化：' + e.message,
            result.errorPosition,
            result.suggestions
        );
    }
});

// Raw JSON - Clear
elements.rawClearBtn.addEventListener('click', () => {
    elements.rawInput.value = '';
    updateLineNumbers(elements.rawInput, elements.rawLineNumbers);
    resetResult();
});

// Serialized JSON - Validate
elements.serializedValidateBtn.addEventListener('click', () => {
    const serializedString = elements.serializedInput.value;
    
    if (!serializedString.trim()) {
        showErrorResult('請輸入序列化的 JSON 內容', null, []);
        return;
    }
    
    const deserialized = deserializeJSON(serializedString);
    const result = validateJSON(deserialized);
    
    const previewHtml = `
        <div class="deserialized-preview">
            <h3>🔄 反序列化結果</h3>
            <pre>${escapeHtml(deserialized)}</pre>
        </div>
    `;
    
    if (result.isValid) {
        showValidResult(previewHtml);
    } else {
        showErrorResult(result.error, result.errorPosition, result.suggestions, previewHtml);
    }
});

// Serialized JSON - Deserialize Only
elements.serializedDeserializeBtn.addEventListener('click', () => {
    const serializedString = elements.serializedInput.value;
    
    if (!serializedString.trim()) {
        return;
    }
    
    const deserialized = deserializeJSON(serializedString);
    
    elements.resultStatus.className = 'result-status';
    elements.resultStatus.innerHTML = `
        <span class="status-icon">🔄</span>
        <span class="status-text">反序列化完成</span>
    `;
    
    elements.resultContent.innerHTML = `
        <div class="deserialized-preview">
            <h3>🔄 反序列化結果</h3>
            <pre>${escapeHtml(deserialized)}</pre>
        </div>
    `;
});

// Serialized JSON - Clear
elements.serializedClearBtn.addEventListener('click', () => {
    elements.serializedInput.value = '';
    updateLineNumbers(elements.serializedInput, elements.serializedLineNumbers);
    resetResult();
});

// ========================================
// Keyboard Shortcuts
// ========================================
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Enter to validate
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        const activePanel = document.querySelector('.tab-panel.active');
        if (activePanel.id === 'raw-panel') {
            elements.rawValidateBtn.click();
        } else {
            elements.serializedValidateBtn.click();
        }
    }
});

// ========================================
// Initial Setup
// ========================================
updateLineNumbers(elements.rawInput, elements.rawLineNumbers);
updateLineNumbers(elements.serializedInput, elements.serializedLineNumbers);
