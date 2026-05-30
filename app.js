// Constants
const categoryMeta = {
    food: { label: '食費', class: 'food', color: '#F59E0B' },
    dining: { label: '外食費', class: 'dining', color: '#EF4444' },
    luxuries: { label: '嗜好品', class: 'luxuries', color: '#EC4899' },
    shopping: { label: '日用品・買い物', class: 'shopping', color: '#10B981' },
    clothing: { label: '衣服', class: 'clothing', color: '#3B82F6' },
    furniture: { label: '家具・家電', class: 'furniture', color: '#8B5CF6' },
    utilities: { label: '水道光熱・通信', class: 'utilities', color: '#06B6D4' },
    mortgage: { label: '住宅ローン・家賃', class: 'mortgage', color: '#6366F1' },
    insurance: { label: '保険料', class: 'insurance', color: '#14B8A6' },
    medical: { label: '医療費', class: 'medical', color: '#F43F5E' },
    education: { label: '教育', class: 'education', color: '#A855F7' },
    transport: { label: '交通費', class: 'transport', color: '#3B82F6' },
    social: { label: '交際費', class: 'social', color: '#EC4899' },
    entertainment: { label: '娯楽・趣味', class: 'entertainment', color: '#8B5CF6' },
    special: { label: '特別費', class: 'special', color: '#D97706' },
    others: { label: 'その他', class: 'others', color: '#6B7280' }
};

const mockReceipts = [
    { storeName: 'セブンイレブン 渋谷店', date: '', total: 1280, items: [{name: 'おにぎり 鮭', price: 160, category: 'food'}, {name: 'サンドイッチ', price: 320, category: 'food'}, {name: '緑茶 500ml', price: 150, category: 'food'}, {name: '週刊誌', price: 450, category: 'entertainment'}, {name: '電池 単3', price: 200, category: 'shopping'}] },
    { storeName: 'イオンモール 幕張', date: '', total: 4580, items: [{name: 'Tシャツ', price: 1990, category: 'clothing'}, {name: 'トイレットペーパー', price: 398, category: 'shopping'}, {name: '洗剤', price: 298, category: 'shopping'}, {name: 'お菓子詰め合わせ', price: 598, category: 'food'}, {name: 'ノート 3冊セット', price: 296, category: 'shopping'}, {name: 'USB充電ケーブル', price: 1000, category: 'furniture'}] },
    { storeName: 'スターバックス 新宿', date: '', total: 1740, items: [{name: 'カフェラテ Grande', price: 490, category: 'dining'}, {name: 'キャラメルフラペチーノ', price: 590, category: 'dining'}, {name: 'チョコレートケーキ', price: 440, category: 'dining'}, {name: 'ドリップコーヒー', price: 220, category: 'dining'}] },
    { storeName: 'ドン・キホーテ 池袋', date: '', total: 3250, items: [{name: 'プロテイン 1kg', price: 2480, category: 'food'}, {name: 'エナジードリンク 6本', price: 770, category: 'luxuries'}] },
    { storeName: 'ユニクロ 銀座店', date: '', total: 5970, items: [{name: 'フリースジャケット', price: 2990, category: 'clothing'}, {name: 'ヒートテック 2枚組', price: 1990, category: 'clothing'}, {name: '靴下 3足セット', price: 990, category: 'clothing'}] }
];

// Global State
let transactions = [];
let budgets = [];
let recurringExpenses = [];
let categoryCharts = [];
let trendChartInstance = null;
let currentScannedData = null;
let editingTransactionId = null;
let editingBudgetPeriodId = null;
let editingRecurringId = null;
let currentMonth = new Date();
let activeFilterDate = null;
let analyticsPeriod = 'month';
let cameraStream = null;
let capturedImages = [];

let apiKey = '';

// Helper for DOM IDs
const el = (id) => document.getElementById(id);
const qsa = (sel) => document.querySelectorAll(sel);
const qs = (sel) => document.querySelector(sel);

// 1. App State & Initialization
document.addEventListener('DOMContentLoaded', () => {
    loadApiKey();
    loadTransactions();
    loadBudgets();
    loadRecurringExpenses();
    buildBudgetInputs();
    buildRecurringCategorySelect();
    initTabNavigation();
    initMonthSelector();
    initCharts();
    setupEventListeners();
    updateDashboard();

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
});

// 2. Toast Notifications
function showToast(message, type = 'info') {
    const container = el('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `p-4 rounded shadow-lg text-white font-bold transition-opacity duration-300 ${type === 'error' ? 'bg-red-500' : 'bg-green-500'}`;
    toast.innerText = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// 3. API Key Management
function loadApiKey() {
    apiKey = localStorage.getItem('gemini_api_key') || '';
    if (el('apiKeyInput')) el('apiKeyInput').value = apiKey;
    updateApiKeyStatus();
}
function saveApiKey() {
    const key = el('apiKeyInput').value.trim();
    localStorage.setItem('gemini_api_key', key);
    apiKey = key;
    updateApiKeyStatus();
    showToast('APIキーを保存しました', 'success');
}
function clearApiKey() {
    localStorage.removeItem('gemini_api_key');
    apiKey = '';
    if (el('apiKeyInput')) el('apiKeyInput').value = '';
    updateApiKeyStatus();
    showToast('APIキーを削除しました', 'info');
}
function updateApiKeyStatus() {
    const status = el('apiKeyStatus');
    if (!status) return;
    if (apiKey) {
        status.innerHTML = '<span class="text-green-600 bg-green-100 px-2 py-1 rounded text-sm font-bold">接続済み</span>';
    } else {
        status.innerHTML = '<span class="text-red-600 bg-red-100 px-2 py-1 rounded text-sm font-bold">未接続</span>';
    }
}
function openSettingsModal() { if(el('settingsModal')) el('settingsModal').classList.remove('hidden'); }
function closeSettingsModal() { if(el('settingsModal')) el('settingsModal').classList.add('hidden'); }

// 4. Budget Input Builder
function buildBudgetInputs() {
    const container = el('budgetInputsContainer');
    if (!container) return;
    container.innerHTML = '';
    Object.entries(categoryMeta).forEach(([key, meta]) => {
        const row = document.createElement('div');
        row.className = 'flex items-center justify-between mb-2';
        row.innerHTML = `
            <label class="text-sm text-gray-700 w-1/3">${meta.label}</label>
            <div class="w-2/3 flex items-center">
                <input type="number" data-category="${key}" class="budget-cat-input w-full p-2 border rounded" placeholder="0" min="0">
                <span class="ml-2 text-gray-500">円</span>
            </div>
        `;
        container.appendChild(row);
    });
}
function buildRecurringCategorySelect() {
    const select = el('recurringCategory');
    if (!select) return;
    select.innerHTML = '<option value="">カテゴリを選択</option>';
    Object.entries(categoryMeta).forEach(([key, meta]) => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = meta.label;
        select.appendChild(option);
    });
}

// 5. SPA Tab Navigation
function initTabNavigation() {
    const tabs = qsa('.nav-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            tabs.forEach(t => {
                t.classList.remove('active', 'text-blue-600', 'border-blue-600');
                t.classList.add('text-gray-500', 'border-transparent');
            });
            e.currentTarget.classList.add('active', 'text-blue-600', 'border-blue-600');
            e.currentTarget.classList.remove('text-gray-500', 'border-transparent');
            
            const targetId = e.currentTarget.getAttribute('data-target');
            qsa('.view-panel').forEach(panel => {
                panel.classList.remove('active');
                panel.classList.add('hidden');
            });
            const targetPanel = el(targetId);
            if (targetPanel) {
                targetPanel.classList.add('active');
                targetPanel.classList.remove('hidden');
            }
            
            if (targetId === 'analytics') {
                updateAnalyticsView();
            } else if (targetId === 'budgets') {
                renderBudgetsList();
                renderRecurringList();
            } else if (targetId === 'dashboard') {
                updateDashboard();
            }
        });
    });
}

// 6. Month Selector
function initMonthSelector() {
    qsa('.prevMonthBtn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentMonth.setMonth(currentMonth.getMonth() - 1);
            activeFilterDate = null;
            refreshCurrentView();
        });
    });
    qsa('.nextMonthBtn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentMonth.setMonth(currentMonth.getMonth() + 1);
            activeFilterDate = null;
            refreshCurrentView();
        });
    });
    updateMonthLabel();
}
function updateMonthLabel() {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth() + 1;
    const label = `${year}年${month}月`;
    qsa('.currentMonthYearLabel').forEach(labelEl => {
        labelEl.textContent = label;
    });
}
function refreshCurrentView() {
    updateMonthLabel();
    const activePanel = qs('.view-panel.active');
    if (activePanel) {
        if (activePanel.id === 'dashboard') updateDashboard();
        if (activePanel.id === 'analytics') updateAnalyticsView();
    }
}

// 7. Budget Period Management
function loadBudgets() {
    const stored = localStorage.getItem('receipt_budgets');
    if (stored) {
        budgets = JSON.parse(stored);
    } else {
        budgets = [];
    }
}
function saveBudgetsToStorage() {
    localStorage.setItem('receipt_budgets', JSON.stringify(budgets));
}
function saveBudgetPeriod() {
    const startInput = el('budgetStartDate').value;
    if (!startInput) {
        showToast('開始月を選択してください', 'error');
        return;
    }
    
    // Convert YYYY-MM to YYYY-MM-01 and YYYY-MM-[lastday]
    const [y, m] = startInput.split('-');
    const startDate = `${y}-${m}-01`;
    const endDay = new Date(y, m, 0).getDate();
    const endDate = `${y}-${m}-${endDay}`;
    
    const categories = {};
    qsa('.budget-cat-input').forEach(input => {
        const cat = input.getAttribute('data-category');
        const val = parseInt(input.value) || 0;
        if (val > 0) categories[cat] = val;
    });

    if (editingBudgetPeriodId) {
        const index = budgets.findIndex(b => b.id === editingBudgetPeriodId);
        if (index > -1) {
            budgets[index] = { ...budgets[index], startDate, endDate, categories };
            showToast('予算を更新しました', 'success');
        }
    } else {
        const newBudget = {
            id: 'b-' + Date.now().toString(),
            startDate,
            endDate,
            categories
        };
        budgets.push(newBudget);
        showToast('予算を作成しました', 'success');
    }
    
    saveBudgetsToStorage();
    resetBudgetForm();
    renderBudgetsList();
    if (qs('.view-panel.active')?.id === 'dashboard') updateDashboard();
}
function editBudgetPeriod(id) {
    const b = budgets.find(x => x.id === id);
    if (!b) return;
    editingBudgetPeriodId = id;
    if (el('budgetFormTitle')) el('budgetFormTitle').textContent = '予算を編集';
    
    if (el('budgetStartDate')) {
        el('budgetStartDate').value = b.startDate.substring(0, 7);
    }
    
    qsa('.budget-cat-input').forEach(input => {
        const cat = input.getAttribute('data-category');
        input.value = b.categories[cat] || '';
    });
}
function deleteBudgetPeriod(id) {
    if(!confirm('この予算を削除しますか？')) return;
    budgets = budgets.filter(b => b.id !== id);
    saveBudgetsToStorage();
    renderBudgetsList();
    if (qs('.view-panel.active')?.id === 'dashboard') updateDashboard();
    showToast('予算を削除しました', 'info');
}
function resetBudgetForm() {
    editingBudgetPeriodId = null;
    if (el('budgetFormTitle')) el('budgetFormTitle').textContent = '新しい予算期間を作成';
    if (el('budgetStartDate')) el('budgetStartDate').value = '';
    qsa('.budget-cat-input').forEach(i => i.value = '');
}
function renderBudgetsList() {
    const list = el('budgetPeriodsList');
    if (!list) return;
    list.innerHTML = '';
    
    const sorted = [...budgets].sort((a, b) => b.startDate.localeCompare(a.startDate));
    
    sorted.forEach(b => {
        const total = Object.values(b.categories).reduce((sum, val) => sum + val, 0);
        const startStr = b.startDate.substring(0, 7).replace('-', '年') + '月';
        
        const card = document.createElement('div');
        card.className = 'bg-white p-4 rounded shadow border border-gray-200 flex justify-between items-center mb-2';
        card.innerHTML = `
            <div>
                <h4 class="font-bold">${startStr}</h4>
                <p class="text-sm text-gray-600">合計: ${total.toLocaleString()}円 (${Object.keys(b.categories).length}カテゴリ)</p>
            </div>
            <div class="flex gap-2">
                <button class="edit-budget-btn p-2 text-blue-600 hover:bg-blue-50 rounded" data-id="${b.id}"><i data-lucide="edit-2"></i></button>
                <button class="delete-budget-btn p-2 text-red-600 hover:bg-red-50 rounded" data-id="${b.id}"><i data-lucide="trash-2"></i></button>
            </div>
        `;
        list.appendChild(card);
    });
    
    qsa('.edit-budget-btn').forEach(btn => btn.addEventListener('click', (e) => editBudgetPeriod(e.currentTarget.getAttribute('data-id'))));
    qsa('.delete-budget-btn').forEach(btn => btn.addEventListener('click', (e) => deleteBudgetPeriod(e.currentTarget.getAttribute('data-id'))));
    
    if (typeof lucide !== 'undefined') lucide.createIcons();
}
function getActiveBudgetForMonth(date) {
    const yyyymm = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const targetDateStr = `${yyyymm}-15`;
    const active = budgets.find(b => b.startDate <= targetDateStr && b.endDate >= targetDateStr);
    return active ? active.categories : {};
}

// 8. Recurring Expenses Management
function loadRecurringExpenses() {
    const stored = localStorage.getItem('receipt_recurring');
    if (stored) {
        recurringExpenses = JSON.parse(stored);
    } else {
        recurringExpenses = [];
    }
}
function saveRecurringToStorage() {
    localStorage.setItem('receipt_recurring', JSON.stringify(recurringExpenses));
}
function saveRecurringExpense() {
    const name = el('recurringName').value.trim();
    const amount = parseInt(el('recurringAmount').value) || 0;
    const category = el('recurringCategory').value;
    const startDate = el('recurringStartDate').value;
    const endDate = el('recurringEndDate') ? el('recurringEndDate').value : '';
    
    if (!name || amount <= 0 || !category || !startDate) {
        showToast('必須項目を入力してください', 'error');
        return;
    }
    
    if (editingRecurringId) {
        const index = recurringExpenses.findIndex(r => r.id === editingRecurringId);
        if (index > -1) {
            recurringExpenses[index] = { ...recurringExpenses[index], name, amount, category, startDate, endDate };
            showToast('定期支出を更新しました', 'success');
        }
    } else {
        recurringExpenses.push({
            id: 'r-' + Date.now().toString(),
            name, amount, category, startDate, endDate
        });
        showToast('定期支出を作成しました', 'success');
    }
    
    saveRecurringToStorage();
    resetRecurringForm();
    renderRecurringList();
    if (qs('.view-panel.active')?.id === 'dashboard') updateDashboard();
}
function editRecurring(id) {
    const r = recurringExpenses.find(x => x.id === id);
    if (!r) return;
    editingRecurringId = id;
    if (el('recurringFormTitle')) el('recurringFormTitle').textContent = '定期支出を編集';
    el('recurringName').value = r.name;
    el('recurringAmount').value = r.amount;
    el('recurringCategory').value = r.category;
    el('recurringStartDate').value = r.startDate;
    if (el('recurringEndDate')) el('recurringEndDate').value = r.endDate || '';
}
function deleteRecurring(id) {
    if(!confirm('この定期支出を削除しますか？')) return;
    recurringExpenses = recurringExpenses.filter(r => r.id !== id);
    saveRecurringToStorage();
    renderRecurringList();
    if (qs('.view-panel.active')?.id === 'dashboard') updateDashboard();
    showToast('定期支出を削除しました', 'info');
}
function resetRecurringForm() {
    editingRecurringId = null;
    if (el('recurringFormTitle')) el('recurringFormTitle').textContent = '新しい定期支出';
    el('recurringName').value = '';
    el('recurringAmount').value = '';
    el('recurringCategory').value = '';
    el('recurringStartDate').value = '';
    if (el('recurringEndDate')) el('recurringEndDate').value = '';
}
function renderRecurringList() {
    const list = el('recurringPeriodsList');
    if (!list) return;
    list.innerHTML = '';
    
    recurringExpenses.forEach(r => {
        const catLabel = categoryMeta[r.category] ? categoryMeta[r.category].label : '不明';
        const card = document.createElement('div');
        card.className = 'bg-white p-4 rounded shadow border border-gray-200 flex justify-between items-center mb-2';
        card.innerHTML = `
            <div>
                <h4 class="font-bold">${r.name} <span class="text-xs bg-gray-200 px-2 py-1 rounded ml-2">${catLabel}</span></h4>
                <p class="text-sm text-gray-600">${r.amount.toLocaleString()}円/月 (開始: ${r.startDate})</p>
            </div>
            <div class="flex gap-2">
                <button class="edit-recur-btn p-2 text-blue-600 hover:bg-blue-50 rounded" data-id="${r.id}"><i data-lucide="edit-2"></i></button>
                <button class="delete-recur-btn p-2 text-red-600 hover:bg-red-50 rounded" data-id="${r.id}"><i data-lucide="trash-2"></i></button>
            </div>
        `;
        list.appendChild(card);
    });
    
    qsa('.edit-recur-btn').forEach(btn => btn.addEventListener('click', (e) => editRecurring(e.currentTarget.getAttribute('data-id'))));
    qsa('.delete-recur-btn').forEach(btn => btn.addEventListener('click', (e) => deleteRecurring(e.currentTarget.getAttribute('data-id'))));
    
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// 9. Monthly Resolved Transactions
function getMonthlyResolvedTransactions(year, month) {
    const prefix = `${year}-${String(month).padStart(2, '0')}`;
    const normalTxns = transactions.filter(t => t.date.startsWith(prefix));
    
    const virtualTxns = [];
    recurringExpenses.forEach(r => {
        const targetMonthStr = `${year}-${String(month).padStart(2, '0')}`;
        const startMonthStr = r.startDate.substring(0, 7);
        const endMonthStr = r.endDate ? r.endDate.substring(0, 7) : '9999-99';
        
        if (targetMonthStr >= startMonthStr && targetMonthStr <= endMonthStr) {
            virtualTxns.push({
                id: `rec-${r.id}-${year}-${month}`,
                storeName: `[定期固定] ${r.name}`,
                date: `${prefix}-01`,
                total: r.amount,
                items: [{ name: r.name, price: r.amount, category: r.category }],
                isRecurring: true
            });
        }
    });
    return [...normalTxns, ...virtualTxns];
}

// 10. File Handling & Bulk Processing
function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    if (files.length === 1) processSingleFile(files[0]);
    else processBulkFiles(files);
    e.target.value = '';
}
async function processSingleFile(file) {
    try {
        const base64 = await readFileAsBase64(file);
        if (el('dropzone')) el('dropzone').style.display = 'none';
        if (el('scannerContainer')) el('scannerContainer').classList.remove('hidden');
        if (el('scannedImage')) el('scannedImage').src = base64;
        
        const res = await performScan(base64.split(',')[1], file.type);
        populateEditor(res);
    } catch (err) {
        showToast('読み取りエラー: ' + err.message, 'error');
        resetScannerState();
    }
}
async function processBulkFiles(files) {
    if (el('bulkProgressContainer')) el('bulkProgressContainer').classList.remove('hidden');
    let successCount = 0;
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (el('bulkProgressText')) el('bulkProgressText').textContent = `処理中: ${i+1} / ${files.length} (${file.name})`;
        if (el('bulkProgressBar')) el('bulkProgressBar').style.width = `${((i)/files.length)*100}%`;
        
        try {
            const base64 = await readFileAsBase64(file);
            const res = await performScan(base64.split(',')[1], file.type);
            
            const newTx = {
                id: 't-' + Date.now().toString() + '-' + i,
                storeName: res.storeName || '不明な店舗',
                date: res.date || new Date().toISOString().split('T')[0],
                total: res.total || 0,
                items: res.items || []
            };
            transactions.push(newTx);
            successCount++;
        } catch (err) {
            console.error('Bulk error', err);
        }
    }
    
    if (el('bulkProgressBar')) el('bulkProgressBar').style.width = '100%';
    setTimeout(() => {
        if (el('bulkProgressContainer')) el('bulkProgressContainer').classList.add('hidden');
        saveTransactionsToStorage();
        updateDashboard();
        showToast(`${successCount}件のレシートを取り込みました`, 'success');
    }, 1000);
}
function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// 11. Gemini API Integration
async function performScan(base64Data, mimeType) {
    if (!apiKey) return runMockScan();
    
    const schema = {
        type: "OBJECT",
        properties: {
            storeName: { type: "STRING" },
            date: { type: "STRING", description: "YYYY-MM-DD format" },
            total: { type: "INTEGER" },
            items: {
                type: "ARRAY",
                items: {
                    type: "OBJECT",
                    properties: {
                        name: { type: "STRING" },
                        price: { type: "INTEGER" },
                        category: { type: "STRING", description: "One of: food, dining, luxuries, shopping, clothing, furniture, utilities, mortgage, insurance, medical, education, transport, social, entertainment, special, others" }
                    }
                }
            }
        }
    };
    
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { inlineData: { mimeType: mimeType || 'image/jpeg', data: base64Data } },
                        { text: "Extract receipt information into the JSON schema." }
                    ]
                }],
                generationConfig: {
                    responseMimeType: 'application/json',
                    responseSchema: schema
                }
            })
        });
        
        const data = await response.json();
        if (data.error) throw new Error(data.error.message);
        
        const textRes = data.candidates[0].content.parts[0].text;
        return JSON.parse(textRes);
    } catch (e) {
        console.error('API Error:', e);
        showToast('API呼び出し失敗、モックを使用します', 'error');
        return runMockScan();
    }
}
function runMockScan() {
    return new Promise(resolve => {
        setTimeout(() => { resolve(getMockReceiptResult()); }, 2500);
    });
}
function getMockReceiptResult() {
    const mock = JSON.parse(JSON.stringify(mockReceipts[Math.floor(Math.random() * mockReceipts.length)]));
    const d = new Date();
    d.setDate(d.getDate() - Math.floor(Math.random() * 6));
    mock.date = d.toISOString().split('T')[0];
    return mock;
}

// 12. WebRTC Camera
async function startContinuousCamera() {
    try {
        cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (el('cameraVideo')) {
            el('cameraVideo').srcObject = cameraStream;
            el('cameraVideo').play();
        }
        if (el('cameraViewOverlay')) el('cameraViewOverlay').classList.remove('hidden');
        capturedImages = [];
        updateCameraThumbs();
    } catch (e) {
        showToast('カメラの起動に失敗しました', 'error');
    }
}
function stopContinuousCamera() {
    if (cameraStream) {
        cameraStream.getTracks().forEach(t => t.stop());
        cameraStream = null;
    }
    if (el('cameraViewOverlay')) el('cameraViewOverlay').classList.add('hidden');
}
function captureSnapshot() {
    const video = el('cameraVideo');
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg');
    capturedImages.push(dataUrl);
    
    const flash = el('cameraFlash');
    if (flash) {
        flash.classList.remove('hidden');
        flash.style.opacity = '1';
        setTimeout(() => {
            flash.style.opacity = '0';
            setTimeout(() => flash.classList.add('hidden'), 200);
        }, 50);
    }
    updateCameraThumbs();
}
function updateCameraThumbs() {
    const container = el('capturedThumbsContainer');
    if (!container) return;
    container.innerHTML = '';
    capturedImages.forEach((img, idx) => {
        const div = document.createElement('div');
        div.className = 'relative w-16 h-16 shrink-0';
        div.innerHTML = `
            <img src="${img}" class="w-full h-full object-cover rounded border border-white">
            <button class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs" onclick="removeCaptured(${idx})">×</button>
        `;
        container.appendChild(div);
    });
    
    const procBtn = el('processCapturedBtn');
    if (procBtn) {
        procBtn.disabled = capturedImages.length === 0;
        procBtn.textContent = `処理する (${capturedImages.length}枚)`;
    }
}
window.removeCaptured = function(idx) {
    capturedImages.splice(idx, 1);
    updateCameraThumbs();
}
async function submitCapturedImages() {
    const images = [...capturedImages];
    stopContinuousCamera();
    
    if (images.length === 1) {
        if (el('dropzone')) el('dropzone').style.display = 'none';
        if (el('scannerContainer')) el('scannerContainer').classList.remove('hidden');
        if (el('scannedImage')) el('scannedImage').src = images[0];
        
        try {
            const res = await performScan(images[0].split(',')[1], 'image/jpeg');
            populateEditor(res);
        } catch(e) {
            resetScannerState();
        }
    } else if (images.length > 1) {
        if (el('bulkProgressContainer')) el('bulkProgressContainer').classList.remove('hidden');
        let successCount = 0;
        
        for (let i = 0; i < images.length; i++) {
            if (el('bulkProgressText')) el('bulkProgressText').textContent = `処理中: ${i+1} / ${images.length}`;
            if (el('bulkProgressBar')) el('bulkProgressBar').style.width = `${((i)/images.length)*100}%`;
            
            try {
                const res = await performScan(images[i].split(',')[1], 'image/jpeg');
                const newTx = {
                    id: 't-' + Date.now().toString() + '-' + i,
                    storeName: res.storeName || '不明な店舗',
                    date: res.date || new Date().toISOString().split('T')[0],
                    total: res.total || 0,
                    items: res.items || []
                };
                transactions.push(newTx);
                successCount++;
            } catch (err) {}
        }
        
        if (el('bulkProgressBar')) el('bulkProgressBar').style.width = '100%';
        setTimeout(() => {
            if (el('bulkProgressContainer')) el('bulkProgressContainer').classList.add('hidden');
            saveTransactionsToStorage();
            updateDashboard();
            showToast(`${successCount}件のレシートを取り込みました`, 'success');
        }, 1000);
    }
}

// 13. Manual Input Mode
function startManualInput() {
    if (el('dropzone')) el('dropzone').style.display = 'none';
    if (el('scannerContainer')) el('scannerContainer').classList.add('hidden');
    
    populateEditor({
        storeName: '',
        date: new Date().toISOString().split('T')[0],
        total: 0,
        items: []
    });
    
    if (el('editorTitle')) el('editorTitle').textContent = '手動入力';
    setTimeout(() => {
        if (el('receiptStore')) {
            el('receiptStore').focus();
            el('receiptStore').scrollIntoView({behavior: 'smooth', block: 'center'});
        }
    }, 100);
}

// 14. Receipt Editor
function populateEditor(data) {
    if (el('editorPanel')) el('editorPanel').classList.remove('hidden');
    if (el('editorTitle')) el('editorTitle').textContent = 'レシート確認・編集';
    
    if (el('receiptStore')) el('receiptStore').value = data.storeName || '';
    if (el('receiptDate')) el('receiptDate').value = data.date || new Date().toISOString().split('T')[0];
    if (el('receiptTotal')) el('receiptTotal').value = data.total || 0;
    
    const list = el('itemsList');
    if (list) {
        list.innerHTML = '';
        if (data.items && data.items.length) {
            data.items.forEach(item => addReceiptItem(item.name, item.price, item.category));
        } else {
            addReceiptItem('', 0, 'others');
        }
    }
}
function addReceiptItem(name = '', price = 0, category = 'others') {
    const list = el('itemsList');
    if (!list) return;
    
    const row = document.createElement('div');
    row.className = 'flex gap-2 items-center mb-2 item-row';
    
    let options = '';
    Object.entries(categoryMeta).forEach(([k, v]) => {
        options += `<option value="${k}" ${k === category ? 'selected' : ''}>${v.label}</option>`;
    });
    
    row.innerHTML = `
        <input type="text" class="item-name flex-1 p-2 border rounded" placeholder="品名" value="${name}">
        <input type="number" class="item-price w-24 p-2 border rounded" placeholder="金額" value="${price}" onchange="calculateTotalFromItems()">
        <select class="item-category w-32 p-2 border rounded">${options}</select>
        <button class="text-red-500 p-2 hover:bg-red-50 rounded" onclick="this.parentElement.remove(); calculateTotalFromItems();"><i data-lucide="trash-2"></i></button>
    `;
    list.appendChild(row);
    if (typeof lucide !== 'undefined') lucide.createIcons();
    calculateTotalFromItems();
}
window.calculateTotalFromItems = function() {
    let sum = 0;
    qsa('.item-price').forEach(input => { sum += parseInt(input.value) || 0; });
    if (el('receiptTotal')) el('receiptTotal').value = sum;
}
function resetScannerState() {
    if (el('dropzone')) el('dropzone').style.display = 'block';
    if (el('scannerContainer')) el('scannerContainer').classList.add('hidden');
    if (el('editorPanel')) el('editorPanel').classList.add('hidden');
    if (el('scannedImage')) el('scannedImage').src = '';
    editingTransactionId = null;
    if (el('fileInput')) el('fileInput').value = '';
}

// 15. Transaction CRUD
function loadTransactions() {
    const stored = localStorage.getItem('receipt_transactions');
    if (stored) {
        transactions = JSON.parse(stored);
        transactions = transactions.map(t => {
            if (t.category && (!t.items || t.items.length === 0)) {
                t.items = [{ name: 'まとめ入力', price: t.total, category: t.category }];
                delete t.category;
            }
            if (t.items) {
                t.items = t.items.map(item => ({ ...item, category: item.category || 'others' }));
            }
            return t;
        });
    } else {
        transactions = [];
    }
}
function saveTransactionsToStorage() {
    localStorage.setItem('receipt_transactions', JSON.stringify(transactions));
}
function saveCurrentTransaction() {
    const storeName = el('receiptStore').value.trim();
    const date = el('receiptDate').value;
    const total = parseInt(el('receiptTotal').value) || 0;
    
    if (!date || total <= 0) {
        showToast('日付と有効な金額を入力してください', 'error');
        return;
    }
    
    const items = [];
    qsa('.item-row').forEach(row => {
        const name = row.querySelector('.item-name').value;
        const price = parseInt(row.querySelector('.item-price').value) || 0;
        const category = row.querySelector('.item-category').value;
        if (name || price > 0) items.push({ name: name || '名称未設定', price, category });
    });
    
    if (items.length === 0) items.push({ name: 'まとめ入力', price: total, category: 'others' });
    
    if (editingTransactionId) {
        const idx = transactions.findIndex(t => t.id === editingTransactionId);
        if (idx > -1) {
            transactions[idx] = { ...transactions[idx], storeName, date, total, items };
            showToast('更新しました', 'success');
        }
    } else {
        transactions.push({
            id: 't-' + Date.now().toString(),
            storeName: storeName || '不明な店舗',
            date, total, items
        });
        showToast('保存しました', 'success');
    }
    
    saveTransactionsToStorage();
    resetScannerState();
    updateDashboard();
}
function editTransaction(id) {
    if (id.startsWith('rec-')) {
        showToast('定期支出は「予算・定期」タブから編集してください', 'info');
        return;
    }
    const t = transactions.find(x => x.id === id);
    if (!t) return;
    editingTransactionId = id;
    
    if (el('dropzone')) el('dropzone').style.display = 'none';
    populateEditor(t);
    closeDayModal();
    
    setTimeout(() => {
        if (el('editorPanel')) el('editorPanel').scrollIntoView({behavior: 'smooth', block: 'start'});
    }, 100);
}
function deleteTransaction(id) {
    if (id.startsWith('rec-')) {
        showToast('定期支出は「予算・定期」タブから削除してください', 'info');
        return;
    }
    if(!confirm('削除しますか？')) return;
    transactions = transactions.filter(t => t.id !== id);
    saveTransactionsToStorage();
    updateDashboard();
    closeDayModal();
    showToast('削除しました', 'info');
}

// 16. Dashboard Update
function updateDashboard() {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth() + 1;
    
    const monthlyTxns = getMonthlyResolvedTransactions(year, month);
    const totalSpent = monthlyTxns.reduce((sum, t) => sum + t.total, 0);
    
    qsa('.totalExpensesVal').forEach(el => el.textContent = totalSpent.toLocaleString() + '円');
    qsa('.receiptCountVal').forEach(el => el.textContent = monthlyTxns.length + '件');
    
    const activeBudget = getActiveBudgetForMonth(currentMonth);
    const overallBudget = Object.values(activeBudget).reduce((sum, val) => sum + val, 0);
    
    updateOverallBudgetBars(totalSpent, overallBudget);
    renderDashboardCategoryBudgets(monthlyTxns, activeBudget);
    
    renderCalendarGrid(monthlyTxns);
    renderHistoryList(monthlyTxns);
    updateCategoryCharts(monthlyTxns);
}

// 17. Budget Progress Bars
function updateOverallBudgetBars(monthlyTotalSum, overallBudget) {
    let percent = 0;
    if (overallBudget > 0) percent = Math.min((monthlyTotalSum / overallBudget) * 100, 100);
    
    qsa('.budgetPercentLabel').forEach(el => el.textContent = overallBudget > 0 ? `${Math.round(percent)}%` : '- %');
    qsa('.budgetRemainingLabel').forEach(el => {
        if (overallBudget === 0) el.textContent = '予算未設定';
        else {
            const rem = overallBudget - monthlyTotalSum;
            if (rem >= 0) el.textContent = `残り: ${rem.toLocaleString()}円`;
            else el.textContent = `超過: ${Math.abs(rem).toLocaleString()}円`;
        }
    });
    
    qsa('.budgetProgressBar').forEach(bar => {
        bar.style.width = `${percent}%`;
        if (percent < 80) bar.className = 'budgetProgressBar h-full bg-blue-500 rounded-full';
        else if (percent <= 100) bar.className = 'budgetProgressBar h-full bg-yellow-500 rounded-full';
        else bar.className = 'budgetProgressBar h-full bg-red-500 rounded-full';
    });
}
function renderDashboardCategoryBudgets(monthlyTxns, activeBudget) {
    const container = el('dashboardCategoryBudgets');
    if (!container) return;
    container.innerHTML = '';
    
    const spends = {};
    Object.keys(categoryMeta).forEach(k => spends[k] = 0);
    
    monthlyTxns.forEach(t => {
        t.items.forEach(item => {
            if (spends[item.category] !== undefined) spends[item.category] += item.price;
            else spends['others'] += item.price;
        });
    });
    
    Object.entries(categoryMeta).forEach(([key, meta]) => {
        const budget = activeBudget[key] || 0;
        const spent = spends[key] || 0;
        
        if (budget > 0 || spent > 0) {
            let percent = 0;
            if (budget > 0) percent = Math.min((spent / budget) * 100, 100);
            else if (spent > 0) percent = 100;
            
            let barColor = 'bg-blue-500';
            if (spent > budget && budget > 0) barColor = 'bg-gradient-to-r from-red-500 to-red-600';
            else if (percent >= 80) barColor = 'bg-amber-500';
            else barColor = `bg-[${meta.color}]`;
            
            let remText = '';
            if (budget > 0) {
                const rem = budget - spent;
                if (rem >= 0) remText = `残り ${rem.toLocaleString()}円`;
                else remText = `<span class="text-red-500 font-bold">超過 ${Math.abs(rem).toLocaleString()}円</span>`;
            } else {
                remText = '予算なし';
            }
            
            const div = document.createElement('div');
            div.className = 'mb-3';
            div.innerHTML = `
                <div class="flex justify-between items-center text-sm mb-1">
                    <div class="flex items-center gap-1">
                        <span class="w-3 h-3 rounded-full" style="background-color: ${meta.color}"></span>
                        <span class="font-medium">${meta.label}</span>
                    </div>
                    <span>${spent.toLocaleString()} / ${budget.toLocaleString()}円</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                    <div class="${barColor} h-2 rounded-full transition-all" style="width: ${percent}%; background-color: ${barColor.includes('bg-[') ? meta.color : ''}"></div>
                </div>
                <div class="text-xs text-right mt-1 text-gray-500">${remText}</div>
            `;
            container.appendChild(div);
        }
    });
}

// 18. Calendar Grid
function renderCalendarGrid(monthlyTxns) {
    const grid = qs('.calendarGrid');
    if (!grid) return;
    grid.innerHTML = '';
    
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const days = ['日','月','火','水','木','金','土'];
    days.forEach(d => {
        const hEl = document.createElement('div');
        hEl.className = 'text-center text-xs font-bold text-gray-500 py-1';
        hEl.textContent = d;
        grid.appendChild(hEl);
    });
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOffset = firstDay.getDay();
    
    for(let i=0; i<startOffset; i++) {
        const empty = document.createElement('div');
        empty.className = 'p-1';
        grid.appendChild(empty);
    }
    
    const todayStr = new Date().toISOString().split('T')[0];
    
    for(let d=1; d<=lastDay.getDate(); d++) {
        const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        const dayTxns = monthlyTxns.filter(t => t.date === dateStr);
        const spent = dayTxns.reduce((s, t) => s + t.total, 0);
        
        const cell = document.createElement('div');
        cell.className = 'min-h-[60px] border border-gray-100 p-1 relative cursor-pointer hover:bg-gray-50 transition-colors rounded';
        
        if (dateStr === todayStr) cell.classList.add('bg-blue-50', 'border-blue-200', 'today');
        if (activeFilterDate === dateStr) cell.classList.add('ring-2', 'ring-blue-500', 'active-filter');
        if (spent > 0) cell.classList.add('has-spend');
        if (spent >= 10000) cell.classList.add('bg-red-50', 'has-high-spend');
        
        let spendHtml = spent > 0 ? `<div class="text-[10px] text-red-600 font-bold text-center mt-1">${spent.toLocaleString()}</div>` : '';
        let indicatorHtml = dayTxns.some(t => t.isRecurring) ? `<div class="absolute top-1 right-1 w-2 h-2 rounded-full bg-purple-500" title="定期支出あり"></div>` : '';
        
        cell.innerHTML = `<div class="text-xs ${dateStr === todayStr ? 'text-blue-600 font-bold' : 'text-gray-700'}">${d}</div>${indicatorHtml}${spendHtml}`;
        
        cell.addEventListener('click', () => {
            if (activeFilterDate === dateStr) {
                activeFilterDate = null;
                renderHistoryList(monthlyTxns);
                renderCalendarGrid(monthlyTxns);
            } else {
                activeFilterDate = dateStr;
                renderHistoryList(monthlyTxns);
                renderCalendarGrid(monthlyTxns);
                if (spent > 0) openDayModal(dateStr, spent, dayTxns);
            }
        });
        
        grid.appendChild(cell);
    }
}
function renderHistoryList(monthlyTxns) {
    const list = qs('.historyList');
    const emptyState = qs('.historyEmptyState');
    const badge = qs('.filterActiveBadge');
    if (!list) return;
    
    list.innerHTML = '';
    
    let filtered = monthlyTxns;
    if (activeFilterDate) {
        filtered = monthlyTxns.filter(t => t.date === activeFilterDate);
        if (badge) {
            badge.classList.remove('hidden');
            badge.textContent = `${activeFilterDate.split('-')[2]}日の記録`;
        }
    } else {
        if (badge) badge.classList.add('hidden');
    }
    
    filtered.sort((a,b) => b.date.localeCompare(a.date));
    
    if (filtered.length === 0) {
        if (emptyState) emptyState.classList.remove('hidden');
    } else {
        if (emptyState) emptyState.classList.add('hidden');
        filtered.forEach(t => {
            const card = document.createElement('div');
            card.className = 'bg-white p-3 rounded shadow-sm border border-gray-100 flex justify-between items-center';
            
            const itemsStr = t.items.map(i => i.name).join(', ');
            const recurBadge = t.isRecurring ? `<span class="bg-purple-100 text-purple-800 text-[10px] px-1 rounded ml-2">定期</span>` : '';
            
            card.innerHTML = `
                <div class="flex-1 min-w-0">
                    <div class="flex items-center"><div class="font-bold text-gray-800 truncate">${t.storeName}</div>${recurBadge}</div>
                    <div class="text-xs text-gray-500 truncate">${t.date} | ${itemsStr}</div>
                </div>
                <div class="text-right ml-4">
                    <div class="font-bold text-lg whitespace-nowrap">¥${t.total.toLocaleString()}</div>
                    <button class="text-blue-500 text-xs hover:underline mt-1" onclick="editTransaction('${t.id}')">編集</button>
                </div>
            `;
            list.appendChild(card);
        });
    }
}

// 19. Day Detail Modal
function openDayModal(dateStr, spent, dayTxns) {
    const modal = el('dayDetailModal');
    if (!modal) return;
    
    if (el('dayDetailTitle')) el('dayDetailTitle').textContent = `${dateStr} の支出`;
    if (el('dayDetailTotalSum')) el('dayDetailTotalSum').textContent = `合計: ${spent.toLocaleString()}円`;
    
    const list = el('dayDetailItemsList');
    if (list) {
        list.innerHTML = '';
        dayTxns.forEach(t => {
            const block = document.createElement('div');
            block.className = 'mb-4 border-b pb-4 last:border-b-0';
            
            let recurBadge = t.isRecurring ? `<span class="bg-purple-100 text-purple-800 text-[10px] px-1 rounded ml-2">定期</span>` : '';
            
            let itemsHtml = t.items.map(item => {
                const catMeta = categoryMeta[item.category] || categoryMeta.others;
                return `
                <div class="flex justify-between items-center text-sm mt-1 pl-2">
                    <div class="flex items-center gap-2">
                        <span class="w-2 h-2 rounded-full" style="background-color: ${catMeta.color}"></span>
                        <span class="text-gray-600">${item.name}</span>
                    </div>
                    <span>${item.price.toLocaleString()}円</span>
                </div>`;
            }).join('');
            
            block.innerHTML = `
                <div class="flex justify-between items-center mb-2">
                    <div class="font-bold flex items-center">${t.storeName} ${recurBadge}</div>
                    <div class="flex gap-2 items-center">
                        <span class="font-bold">${t.total.toLocaleString()}円</span>
                        <button class="p-1 text-blue-600 hover:bg-blue-50 rounded" onclick="editTransaction('${t.id}')"><i data-lucide="edit-2" class="w-4 h-4"></i></button>
                        <button class="p-1 text-red-600 hover:bg-red-50 rounded" onclick="deleteTransaction('${t.id}')"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                    </div>
                </div>
                ${itemsHtml}
            `;
            list.appendChild(block);
        });
    }
    
    modal.classList.remove('hidden');
    if (typeof lucide !== 'undefined') lucide.createIcons();
}
function closeDayModal() {
    if (el('dayDetailModal')) el('dayDetailModal').classList.add('hidden');
}

// 20. Analytics View
function updateAnalyticsView() {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth() + 1;
    
    if (el('analyticsMonthNav')) {
        if (analyticsPeriod === 'month') el('analyticsMonthNav').classList.remove('hidden');
        else el('analyticsMonthNav').classList.add('hidden');
    }
    
    let labels = [];
    let titleStr = '';
    let txns = [];
    
    if (analyticsPeriod === 'month') {
        titleStr = `${year}年${month}月 の分析`;
        const daysInMonth = new Date(year, month, 0).getDate();
        for(let i=1; i<=daysInMonth; i++) labels.push(`${i}日`);
        txns = getMonthlyResolvedTransactions(year, month);
    } else if (analyticsPeriod === 'quarter') {
        const q = Math.ceil(month/3);
        titleStr = `${year}年 Q${q} の分析`;
        labels = [`Q1 (1-3月)`,`Q2 (4-6月)`,`Q3 (7-9月)`,`Q4 (10-12月)`];
        for(let m=1; m<=12; m++) txns = txns.concat(getMonthlyResolvedTransactions(year, m));
    } else if (analyticsPeriod === 'year') {
        titleStr = `${year}年 の分析`;
        for(let i=1; i<=12; i++) labels.push(`${i}月`);
        for(let m=1; m<=12; m++) txns = txns.concat(getMonthlyResolvedTransactions(year, m));
    }
    
    if (el('trendChartTitle')) el('trendChartTitle').textContent = titleStr;
    
    const datasets = [];
    const catKeys = Object.keys(categoryMeta);
    catKeys.forEach(k => {
        datasets.push({
            label: categoryMeta[k].label,
            backgroundColor: categoryMeta[k].color,
            data: new Array(labels.length).fill(0),
            stack: 'Stack 0'
        });
    });
    
    txns.forEach(t => {
        let labelIndex = -1;
        const tDate = new Date(t.date);
        const tMonth = tDate.getMonth() + 1;
        
        if (analyticsPeriod === 'month') labelIndex = parseInt(t.date.split('-')[2]) - 1;
        else if (analyticsPeriod === 'quarter') labelIndex = Math.ceil(tMonth/3) - 1;
        else if (analyticsPeriod === 'year') labelIndex = tMonth - 1;
        
        if (labelIndex >= 0 && labelIndex < labels.length) {
            t.items.forEach(item => {
                const catIdx = catKeys.indexOf(item.category || 'others');
                if (catIdx > -1) datasets[catIdx].data[labelIndex] += item.price;
            });
        }
    });
    
    const canvas = el('trendChart');
    if (canvas) {
        if (trendChartInstance) trendChartInstance.destroy();
        const ctx = canvas.getContext('2d');
        trendChartInstance = new Chart(ctx, {
            type: 'bar',
            data: { labels: labels, datasets: datasets },
            options: {
                responsive: true, maintainAspectRatio: false,
                scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } },
                plugins: {
                    legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 10 } } },
                    tooltip: { callbacks: { label: function(ctx) { return ctx.raw === 0 ? null : `${ctx.dataset.label}: ${ctx.raw.toLocaleString()}円`; } } }
                }
            }
        });
    }
    
    const tableBody = el('categoryAnalysisTableBody');
    if (tableBody) {
        tableBody.innerHTML = '';
        const categorySpends = {};
        catKeys.forEach(k => categorySpends[k] = 0);
        txns.forEach(t => t.items.forEach(i => categorySpends[i.category || 'others'] += i.price));
        
        let activeBudget = analyticsPeriod === 'month' ? getActiveBudgetForMonth(currentMonth) : {};
        const sortedCats = catKeys.map(k => ({key: k, spent: categorySpends[k]})).sort((a,b) => b.spent - a.spent);
        
        sortedCats.forEach(sc => {
            if (sc.spent > 0 || (activeBudget[sc.key] && activeBudget[sc.key] > 0)) {
                const meta = categoryMeta[sc.key];
                const budget = activeBudget[sc.key] || 0;
                let pct = budget > 0 ? ((sc.spent/budget)*100).toFixed(1) + '%' : '-';
                
                const tr = document.createElement('tr');
                tr.className = 'border-b hover:bg-gray-50';
                tr.innerHTML = `
                    <td class="py-2 px-2 text-sm flex items-center gap-2"><span class="w-3 h-3 rounded-full" style="background-color: ${meta.color}"></span> ${meta.label}</td>
                    <td class="py-2 px-2 text-right text-sm">${sc.spent.toLocaleString()}円</td>
                    <td class="py-2 px-2 text-right text-sm text-gray-500">${budget > 0 ? budget.toLocaleString() + '円' : '-'}</td>
                    <td class="py-2 px-2 text-right text-sm ${sc.spent > budget && budget > 0 ? 'text-red-500 font-bold' : ''}">${pct}</td>
                `;
                tableBody.appendChild(tr);
            }
        });
    }
    
    const topItemsList = el('topExpensiveItemsList');
    const topStoresList = el('topStoresList');
    
    if (topItemsList) {
        topItemsList.innerHTML = '';
        let allItems = [];
        txns.forEach(t => t.items.forEach(i => allItems.push({name: i.name, price: i.price, date: t.date, store: t.storeName})));
        allItems.sort((a,b) => b.price - a.price);
        allItems.slice(0,10).forEach((item, idx) => {
            const li = document.createElement('li');
            li.className = 'flex justify-between items-center text-sm py-1 border-b border-gray-100 last:border-0';
            li.innerHTML = `<div class="flex items-center gap-2 overflow-hidden"><span class="font-bold text-gray-400 w-4">${idx+1}.</span><span class="truncate">${item.name} <span class="text-xs text-gray-400">(${item.store})</span></span></div><span class="font-bold">${item.price.toLocaleString()}円</span>`;
            topItemsList.appendChild(li);
        });
    }
    
    if (topStoresList) {
        topStoresList.innerHTML = '';
        const stores = {};
        txns.forEach(t => {
            if(!stores[t.storeName]) stores[t.storeName] = { total: 0, count: 0 };
            stores[t.storeName].total += t.total;
            stores[t.storeName].count += 1;
        });
        const storeArr = Object.keys(stores).map(k => ({name: k, ...stores[k]})).sort((a,b) => b.total - a.total);
        storeArr.slice(0,10).forEach((st, idx) => {
            const li = document.createElement('li');
            li.className = 'flex justify-between items-center text-sm py-1 border-b border-gray-100 last:border-0';
            li.innerHTML = `<div class="flex items-center gap-2 overflow-hidden"><span class="font-bold text-gray-400 w-4">${idx+1}.</span><span class="truncate">${st.name} <span class="text-xs text-gray-400">${st.count}回利用</span></span></div><span class="font-bold">${st.total.toLocaleString()}円</span>`;
            topStoresList.appendChild(li);
        });
    }
    
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// 21. Category Doughnut Charts
function initCharts() {
    qsa('.categoryChartCanvas').forEach(canvas => {
        const ctx = canvas.getContext('2d');
        const chart = new Chart(ctx, {
            type: 'doughnut',
            data: { labels: ['データなし'], datasets: [{ data: [1], backgroundColor: ['#e5e7eb'] }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { boxWidth: 10, font: { size: 10 } } } }, cutout: '60%' }
        });
        categoryCharts.push(chart);
    });
}
function updateCategoryCharts(monthlyTxns) {
    const spends = {};
    Object.keys(categoryMeta).forEach(k => spends[k] = 0);
    
    let total = 0;
    monthlyTxns.forEach(t => t.items.forEach(item => {
        spends[item.category || 'others'] += item.price;
        total += item.price;
    }));
    
    const labels = [];
    const data = [];
    const bg = [];
    
    if (total === 0) {
        labels.push('データなし');
        data.push(1);
        bg.push('#e5e7eb');
    } else {
        Object.entries(categoryMeta).forEach(([k, meta]) => {
            if (spends[k] > 0) {
                labels.push(meta.label);
                data.push(spends[k]);
                bg.push(meta.color);
            }
        });
    }
    
    categoryCharts.forEach(chart => {
        chart.data.labels = labels;
        chart.data.datasets[0].data = data;
        chart.data.datasets[0].backgroundColor = bg;
        chart.update();
    });
}

// 22. CSV Export
function exportToCsv() {
    if (transactions.length === 0) { showToast('エクスポートするデータがありません', 'error'); return; }
    
    let csvContent = '\uFEFF';
    csvContent += "ID,店舗名,日付,品目名,カテゴリ,価格\n";
    
    transactions.forEach(t => {
        if (t.items && t.items.length) {
            t.items.forEach(item => {
                const catLabel = categoryMeta[item.category] ? categoryMeta[item.category].label : 'その他';
                csvContent += `${t.id},"${t.storeName.replace(/"/g, '""')}",${t.date},"${item.name.replace(/"/g, '""')}",${catLabel},${item.price}\n`;
            });
        } else {
            csvContent += `${t.id},"${t.storeName.replace(/"/g, '""')}",${t.date},"まとめ入力",その他,${t.total}\n`;
        }
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `receipts_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// 23. CSV Import
function importFromCsv(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            parseCsvData(event.target.result);
            saveTransactionsToStorage();
            updateDashboard();
            showToast('CSVインポート完了', 'success');
        } catch(err) {
            showToast('CSVパースエラー', 'error');
        }
    };
    reader.readAsText(file);
    e.target.value = '';
}
function parseCsvData(csvText) {
    const lines = csvText.split('\n').filter(l => l.trim().length > 0);
    if (lines.length <= 1) return;
    
    const reverseCatMap = {};
    Object.entries(categoryMeta).forEach(([k, v]) => reverseCatMap[v.label] = k);
    
    const importedTxns = {};
    for (let i = 1; i < lines.length; i++) {
        let line = lines[i].trim();
        const row = [];
        let inQuotes = false;
        let val = '';
        for(let c=0; c<line.length; c++) {
            let char = line[c];
            if(char === '"') inQuotes = !inQuotes;
            else if(char === ',' && !inQuotes) { row.push(val); val = ''; }
            else val += char;
        }
        row.push(val);
        
        if (row.length < 6) continue;
        
        const id = row[0].replace(/"/g, '').trim();
        const storeName = row[1].replace(/"/g, '').trim();
        const date = row[2].replace(/"/g, '').trim();
        const itemName = row[3].replace(/"/g, '').trim();
        const catLabel = row[4].replace(/"/g, '').trim();
        const price = parseInt(row[5].replace(/"/g, '').trim()) || 0;
        
        if (!importedTxns[id]) importedTxns[id] = { id, storeName, date, total: 0, items: [] };
        
        const catKey = reverseCatMap[catLabel] || 'others';
        importedTxns[id].items.push({ name: itemName, price, category: catKey });
        importedTxns[id].total += price;
    }
    
    Object.values(importedTxns).forEach(impTx => {
        const existIdx = transactions.findIndex(t => t.id === impTx.id);
        if (existIdx > -1) transactions[existIdx] = impTx;
        else transactions.push(impTx);
    });
}

// 24. Event Listeners Setup
function setupEventListeners() {
    if (el('openSettingsBtn')) el('openSettingsBtn').addEventListener('click', openSettingsModal);
    if (el('closeSettingsBtn')) el('closeSettingsBtn').addEventListener('click', closeSettingsModal);
    if (el('saveApiKeyBtn')) el('saveApiKeyBtn').addEventListener('click', saveApiKey);
    if (el('clearApiKeyBtn')) el('clearApiKeyBtn').addEventListener('click', clearApiKey);
    
    const dropzone = el('dropzone');
    if (dropzone) {
        dropzone.addEventListener('dragover', e => { e.preventDefault(); dropzone.classList.add('border-blue-500', 'bg-blue-50'); });
        dropzone.addEventListener('dragleave', e => { e.preventDefault(); dropzone.classList.remove('border-blue-500', 'bg-blue-50'); });
        dropzone.addEventListener('drop', e => {
            e.preventDefault();
            dropzone.classList.remove('border-blue-500', 'bg-blue-50');
            if (e.dataTransfer.files.length) {
                const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
                if (files.length === 1) processSingleFile(files[0]);
                else if (files.length > 1) processBulkFiles(files);
            }
        });
        dropzone.addEventListener('click', () => { if(el('fileInput')) el('fileInput').click(); });
    }
    if (el('fileInput')) el('fileInput').addEventListener('change', handleFileSelect);
    
    if (el('manualInputBtn')) el('manualInputBtn').addEventListener('click', startManualInput);
    if (el('exportCsvBtn')) el('exportCsvBtn').addEventListener('click', exportToCsv);
    if (el('importCsvBtn')) el('importCsvBtn').addEventListener('click', () => { if(el('csvFileInput')) el('csvFileInput').click(); });
    if (el('csvFileInput')) el('csvFileInput').addEventListener('change', importFromCsv);
    
    if (el('addItemBtn')) el('addItemBtn').addEventListener('click', () => addReceiptItem());
    if (el('saveReceiptBtn')) el('saveReceiptBtn').addEventListener('click', saveCurrentTransaction);
    if (el('cancelEditBtn')) el('cancelEditBtn').addEventListener('click', resetScannerState);
    
    if (el('saveBudgetBtn')) el('saveBudgetBtn').addEventListener('click', saveBudgetPeriod);
    if (el('resetBudgetFormBtn')) el('resetBudgetFormBtn').addEventListener('click', resetBudgetForm);
    
    if (el('saveRecurringBtn')) el('saveRecurringBtn').addEventListener('click', saveRecurringExpense);
    if (el('resetRecurringFormBtn')) el('resetRecurringFormBtn').addEventListener('click', resetRecurringForm);
    
    if (el('startCameraBtn')) el('startCameraBtn').addEventListener('click', startContinuousCamera);
    if (el('closeCameraBtn')) el('closeCameraBtn').addEventListener('click', stopContinuousCamera);
    if (el('shutterBtn')) el('shutterBtn').addEventListener('click', captureSnapshot);
    if (el('processCapturedBtn')) el('processCapturedBtn').addEventListener('click', submitCapturedImages);
    
    if (el('closeDayDetailBtn')) el('closeDayDetailBtn').addEventListener('click', closeDayModal);
    if (el('closeDayDetailModalBtn')) el('closeDayDetailModalBtn').addEventListener('click', closeDayModal);
    
    qsa('.analyticsPeriodToggle').forEach(btn => {
        btn.addEventListener('click', (e) => {
            qsa('.analyticsPeriodToggle').forEach(b => {
                b.classList.remove('bg-blue-600', 'text-white');
                b.classList.add('bg-white', 'text-gray-700');
            });
            e.currentTarget.classList.add('bg-blue-600', 'text-white');
            e.currentTarget.classList.remove('bg-white', 'text-gray-700');
            
            analyticsPeriod = e.currentTarget.getAttribute('data-period');
            updateAnalyticsView();
        });
    });
}
