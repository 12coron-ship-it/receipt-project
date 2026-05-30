// App State Management
let transactions = [];
let budgets = [];
let recurringExpenses = []; // Holds subscription/fixed cost items

let categoryCharts = []; // Holds category doughnut charts (dashboard and analytics)
let dailyTrendChartInstance = null; // Holds daily spending trend (Line or Bar chart on Analytics)

let currentScannedData = null;
let editingTransactionId = null; // ID of transaction being edited
let editingBudgetPeriodId = null; // ID of budget period being edited
let editingRecurringId = null; // ID of recurring expense being edited

let currentMonth = new Date(); // Active viewing month
let activeFilterDate = null; // Calendar filter date string "YYYY-MM-DD"
let analyticsPeriod = "month"; // "month", "quarter", "year"

// 16 Categories (Grouped logically by concept, food & dining close together)
const categoryMeta = {
    // 1. Food group
    food: { label: "食費", class: "food", color: "#F59E0B" },
    dining: { label: "外食費", class: "dining", color: "#EF4444" },
    luxuries: { label: "嗜好品", class: "luxuries", color: "#EC4899" },
    // 2. Daily items group
    shopping: { label: "日用品・買い物", class: "shopping", color: "#10B981" },
    clothing: { label: "衣服", class: "clothing", color: "#3B82F6" },
    furniture: { label: "家具・家電", class: "furniture", color: "#8B5CF6" },
    // 3. Fixed / Housing costs group
    utilities: { label: "水道光熱・通信", class: "utilities", color: "#06B6D4" },
    mortgage: { label: "住宅ローン・家賃", class: "mortgage", color: "#6366F1" },
    insurance: { label: "保険料", class: "insurance", color: "#14B8A6" },
    // 4. Life & Care group
    medical: { label: "医療費", class: "medical", color: "#F43F5E" },
    education: { label: "教育", class: "education", color: "#A855F7" },
    transport: { label: "交通費", class: "transport", color: "#3B82F6" },
    social: { label: "交際費", class: "social", color: "#EC4899" },
    entertainment: { label: "娯楽・趣味", class: "entertainment", color: "#8B5CF6" },
    // 5. Special and others
    special: { label: "特別費", class: "special", color: "#D97706" }, // Occasional big spends
    others: { label: "その他", class: "others", color: "#6B7280" }
};

// WebRTC Camera State
let cameraStream = null;
let capturedImages = [];

// DOM Elements
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
const bulkProgressContainer = document.getElementById('bulkProgressContainer');
const bulkProgressBar = document.getElementById('bulkProgressBar');
const bulkProgressText = document.getElementById('bulkProgressText');

const scannerContainer = document.getElementById('scannerContainer');
const scannedImage = document.getElementById('scannedImage');
const editorPanel = document.getElementById('editorPanel');
const editorTitle = document.getElementById('editorTitle');
const itemsList = document.getElementById('itemsList');
const addItemBtn = document.getElementById('addItemBtn');

const receiptStore = document.getElementById('receiptStore');
const receiptDate = document.getElementById('receiptDate');
const receiptTotal = document.getElementById('receiptTotal');

const saveReceiptBtn = document.getElementById('saveReceiptBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');

// Dashboard elements
const currentMonthYearLabels = document.querySelectorAll('.currentMonthYearLabel');
const prevMonthBtns = document.querySelectorAll('.prevMonthBtn');
const nextMonthBtns = document.querySelectorAll('.nextMonthBtn');
const budgetPercentLabels = document.querySelectorAll('.budgetPercentLabel');
const budgetRemainingLabels = document.querySelectorAll('.budgetRemainingLabel');
const budgetProgressBars = document.querySelectorAll('.budgetProgressBar');

const totalExpensesVals = document.querySelectorAll('.totalExpensesVal');
const receiptCountVals = document.querySelectorAll('.receiptCountVal');
const calendarGrid = document.querySelector('.calendarGrid');
const historyList = document.querySelector('.historyList');
const historyEmptyState = document.querySelector('.historyEmptyState');
const filterActiveBadge = document.querySelector('.filterActiveBadge');

const openSettingsBtn = document.getElementById('openSettingsBtn');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const settingsModal = document.getElementById('settingsModal');
const apiKeyInput = document.getElementById('apiKeyInput');
const saveApiKeyBtn = document.getElementById('saveApiKeyBtn');
const clearApiKeyBtn = document.getElementById('clearApiKeyBtn');
const apiKeyStatus = document.getElementById('apiKeyStatus');
const toastContainer = document.getElementById('toastContainer');

// Day Detail Modal Elements
const dayDetailModal = document.getElementById('dayDetailModal');
const closeDayDetailBtn = document.getElementById('closeDayDetailBtn');
const closeDayDetailModalBtn = document.getElementById('closeDayDetailModalBtn');
const dayDetailTitle = document.getElementById('dayDetailTitle');
const dayDetailTotalSum = document.getElementById('dayDetailTotalSum');
const dayDetailItemsList = document.getElementById('dayDetailItemsList');

// Budget View Elements
const budgetStartDate = document.getElementById('budgetStartDate');
const budgetEndDate = document.getElementById('budgetEndDate');
const saveBudgetBtn = document.getElementById('saveBudgetBtn');
const resetBudgetFormBtn = document.getElementById('resetBudgetFormBtn');
const budgetPeriodsList = document.getElementById('budgetPeriodsList');
const budgetFormTitle = document.getElementById('budgetFormTitle');
const budgetInputsContainer = document.getElementById('budgetInputsContainer');

// Recurring Expenses Elements
const recurringName = document.getElementById('recurringName');
const recurringAmount = document.getElementById('recurringAmount');
const recurringCategory = document.getElementById('recurringCategory');
const recurringStartDate = document.getElementById('recurringStartDate');
const recurringEndDate = document.getElementById('recurringEndDate');
const saveRecurringBtn = document.getElementById('saveRecurringBtn');
const resetRecurringFormBtn = document.getElementById('resetRecurringFormBtn');
const recurringPeriodsList = document.getElementById('recurringPeriodsList');
const recurringFormTitle = document.getElementById('recurringFormTitle');

// In-App WebRTC Camera Elements
const startCameraBtn = document.getElementById('startCameraBtn');
const cameraViewOverlay = document.getElementById('cameraViewOverlay');
const cameraVideo = document.getElementById('cameraVideo');
const closeCameraBtn = document.getElementById('closeCameraBtn');
const shutterBtn = document.getElementById('shutterBtn');
const cameraFlash = document.getElementById('cameraFlash');
const capturedThumbsContainer = document.getElementById('capturedThumbsContainer');
const processCapturedBtn = document.getElementById('processCapturedBtn');

// Manual Input Button
const manualInputBtn = document.getElementById('manualInputBtn');

// CSV Import Elements
const importCsvBtn = document.getElementById('importCsvBtn');
const csvFileInput = document.getElementById('csvFileInput');

// Initialize the Application
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
    updateDashboard(); // Redraws Dashboard and updates Active view
    setupEventListeners();
});

// Toast helper
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = message;
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) reverse forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Load API Key
function loadApiKey() {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) {
        apiKeyInput.value = savedKey;
        apiKeyStatus.className = 'api-key-badge connected';
        apiKeyStatus.innerHTML = '<i data-lucide="check-circle-2"></i> AI連携中';
    } else {
        apiKeyStatus.className = 'api-key-badge disconnected';
        apiKeyStatus.innerHTML = '<i data-lucide="info"></i> デモモード';
    }
    lucide.createIcons();
}

function saveApiKey() {
    const key = apiKeyInput.value.trim();
    if (key) {
        localStorage.setItem('gemini_api_key', key);
        showToast('APIキーを保存しました。実機レシートスキャンが有効です。', 'success');
    } else {
        localStorage.removeItem('gemini_api_key');
        showToast('APIキーが空欄のためデモモードに移行しました。', 'info');
    }
    loadApiKey();
    closeModal();
}

function clearApiKey() {
    localStorage.removeItem('gemini_api_key');
    apiKeyInput.value = '';
    loadApiKey();
    showToast('APIキーを消去しました。デモモードに戻ります。', 'info');
    closeModal();
}

// Modal handling
function openModal() {
    settingsModal.classList.add('active');
}

function closeModal() {
    settingsModal.classList.remove('active');
}

// Build 16 Category Inputs for Budgets View dynamically
function buildBudgetInputs() {
    budgetInputsContainer.innerHTML = '';
    Object.keys(categoryMeta).forEach(key => {
        const meta = categoryMeta[key];
        const row = document.createElement('div');
        row.className = 'form-group';
        row.style.display = 'grid';
        row.style.gridTemplateColumns = '1fr 1.5fr';
        row.style.alignItems = 'center';
        row.style.gap = '15px';
        row.innerHTML = `
            <span class="badge ${meta.class}" style="font-size: 11px; padding: 6px 12px; text-align: center;">${meta.label}</span>
            <input type="number" class="budget-cat-input" data-category="${key}" placeholder="0" value="0">
        `;
        budgetInputsContainer.appendChild(row);
    });
}

// Build Category Dropdown list for Recurring panel dynamically
function buildRecurringCategorySelect() {
    recurringCategory.innerHTML = '';
    Object.keys(categoryMeta).forEach(key => {
        const meta = categoryMeta[key];
        const option = document.createElement('option');
        option.value = key;
        option.innerText = meta.label;
        recurringCategory.appendChild(option);
    });
}

// SPA Tab Navigation Init
function initTabNavigation() {
    const tabs = document.querySelectorAll('.nav-tab');
    const panels = document.querySelectorAll('.view-panel');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.getAttribute('data-tab');
            
            tabs.forEach(t => t.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));
            
            tab.classList.add('active');
            document.getElementById(`${targetTab}View`).classList.add('active');
            
            if (targetTab === 'analytics') {
                updateAnalyticsView();
            } else if (targetTab === 'budgets') {
                renderBudgetsList();
                renderRecurringList();
            } else if (targetTab === 'dashboard') {
                updateDashboard();
            }
            
            lucide.createIcons();
        });
    });
}

// Month Selector Initialization
function initMonthSelector() {
    updateMonthLabel();
    
    prevMonthBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            currentMonth.setMonth(currentMonth.getMonth() - 1);
            activeFilterDate = null;
            updateMonthLabel();
            
            const activeTab = document.querySelector('.nav-tab.active').getAttribute('data-tab');
            if (activeTab === 'analytics') {
                updateAnalyticsView();
            } else {
                updateDashboard();
            }
        });
    });
    
    nextMonthBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            currentMonth.setMonth(currentMonth.getMonth() + 1);
            activeFilterDate = null;
            updateMonthLabel();
            
            const activeTab = document.querySelector('.nav-tab.active').getAttribute('data-tab');
            if (activeTab === 'analytics') {
                updateAnalyticsView();
            } else {
                updateDashboard();
            }
        });
    });
}

function updateMonthLabel() {
    const year = currentMonth.getFullYear();
    const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
    currentMonthYearLabels.forEach(label => {
        label.innerText = `${year}年${month}月`;
    });
}

// Load Budgets list from Storage
function loadBudgets() {
    const saved = localStorage.getItem('receipt_budgets');
    if (saved) {
        try {
            budgets = JSON.parse(saved);
        } catch (e) {
            budgets = [];
        }
    } else {
        const today = new Date();
        const start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        const end = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
        budgets = [{
            id: 'default-budget-id',
            startDate: start,
            endDate: end,
            categories: { food: 30000, utilities: 15000, shopping: 10000, entertainment: 5000, others: 5000 }
        }];
        localStorage.setItem('receipt_budgets', JSON.stringify(budgets));
    }
}

// Save Budget Period Config
function saveBudgetPeriod() {
    const startMonthVal = budgetStartDate.value;
    const endMonthVal = budgetEndDate.value;
    
    if (!startMonthVal || !endMonthVal) {
        showToast('開始月と終了月を選択してください。', 'error');
        return;
    }
    
    if (startMonthVal > endMonthVal) {
        showToast('開始月は終了月以前の月を入力してください。', 'error');
        return;
    }

    // Convert start month to YYYY-MM-01
    const start = `${startMonthVal}-01`;
    
    // Convert end month to YYYY-MM-[last day]
    const parts = endMonthVal.split('-');
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]);
    const lastDay = new Date(year, month, 0).getDate();
    const end = `${endMonthVal}-${String(lastDay).padStart(2, '0')}`;

    // Read all input values dynamically
    const categories = {};
    const inputs = budgetInputsContainer.querySelectorAll('.budget-cat-input');
    inputs.forEach(input => {
        const cat = input.getAttribute('data-category');
        categories[cat] = parseInt(input.value) || 0;
    });

    if (editingBudgetPeriodId) {
        const idx = budgets.findIndex(b => b.id === editingBudgetPeriodId);
        if (idx !== -1) {
            budgets[idx] = {
                id: editingBudgetPeriodId,
                startDate: start,
                endDate: end,
                categories: categories
            };
            showToast('予算設定を更新しました！', 'success');
        }
        editingBudgetPeriodId = null;
        budgetFormTitle.innerHTML = `<i data-lucide="plus-circle" style="color: var(--accent);"></i> 予算期間の新規作成`;
    } else {
        const newBudget = {
            id: Date.now().toString(),
            startDate: start,
            endDate: end,
            categories: categories
        };
        budgets.unshift(newBudget);
        showToast('新しい予算を設定しました！', 'success');
    }

    localStorage.setItem('receipt_budgets', JSON.stringify(budgets));
    resetBudgetForm();
    renderBudgetsList();
}

function resetBudgetForm() {
    budgetStartDate.value = '';
    budgetEndDate.value = '';
    const inputs = budgetInputsContainer.querySelectorAll('.budget-cat-input');
    inputs.forEach(input => input.value = 0);
    editingBudgetPeriodId = null;
    budgetFormTitle.innerHTML = `<i data-lucide="plus-circle" style="color: var(--accent);"></i> 予算期間の新規作成`;
}

function editBudgetPeriod(id) {
    const b = budgets.find(x => x.id === id);
    if (!b) return;

    editingBudgetPeriodId = id;
    budgetStartDate.value = b.startDate.substring(0, 7);
    budgetEndDate.value = b.endDate.substring(0, 7);
    
    // Fill inputs dynamically
    const inputs = budgetInputsContainer.querySelectorAll('.budget-cat-input');
    inputs.forEach(input => {
        const cat = input.getAttribute('data-category');
        input.value = b.categories[cat] || 0;
    });
    
    budgetFormTitle.innerHTML = `<i data-lucide="edit-3" style="color: var(--primary);"></i> 予算期間の編集`;
    document.getElementById('budgetFormTitle').scrollIntoView({ behavior: 'smooth' });
    lucide.createIcons();
}

function deleteBudgetPeriod(id) {
    budgets = budgets.filter(b => b.id !== id);
    localStorage.setItem('receipt_budgets', JSON.stringify(budgets));
    showToast('予算設定を削除しました。', 'info');
    renderBudgetsList();
}

function renderBudgetsList() {
    budgetPeriodsList.innerHTML = '';
    
    if (budgets.length === 0) {
        budgetPeriodsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon"><i data-lucide="info"></i></div>
                <p>設定された予算期間はありません</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    budgets.forEach(b => {
        const sum = Object.values(b.categories).reduce((acc, curr) => acc + curr, 0);
        const startLabel = b.startDate.substring(0, 7).replace('-', '年') + '月';
        const endLabel = b.endDate.substring(0, 7).replace('-', '年') + '月';
        
        const card = document.createElement('div');
        card.className = 'glass-panel budget-period-card';
        card.innerHTML = `
            <div class="budget-period-header">
                <div class="budget-period-dates">
                    <i data-lucide="calendar-range" style="color: var(--primary); width:18px;"></i>
                    <span>${startLabel} 〜 ${endLabel}</span>
                </div>
                <div>
                    <button class="btn btn-icon edit-budget-btn" data-id="${b.id}" title="編集">
                        <i data-lucide="edit-2" style="width:14px;"></i>
                    </button>
                    <button class="btn btn-icon delete-budget-btn" data-id="${b.id}" title="削除">
                        <i data-lucide="trash-2" style="width:14px;"></i>
                    </button>
                </div>
            </div>
            <div style="font-size: 13px; font-weight: 600; margin-bottom: 12px;">合計予算: ¥${sum.toLocaleString()}</div>
            <div class="budget-category-grid">
                <!-- Render top active budgets list (non zero) -->
                ${Object.keys(b.categories).map(catKey => {
                    const amt = b.categories[catKey] || 0;
                    if (amt === 0) return '';
                    const meta = categoryMeta[catKey] || categoryMeta.others;
                    return `
                        <div class="budget-cat-pill">
                            <span class="budget-cat-label">${meta.label}</span>
                            <span class="budget-cat-amount">¥${amt.toLocaleString()}</span>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
        budgetPeriodsList.appendChild(card);
    });

    budgetPeriodsList.querySelectorAll('.edit-budget-btn').forEach(btn => {
        btn.addEventListener('click', () => editBudgetPeriod(btn.getAttribute('data-id')));
    });

    budgetPeriodsList.querySelectorAll('.delete-budget-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (confirm('この予算設定を削除しますか？')) {
                deleteBudgetPeriod(btn.getAttribute('data-id'));
            }
        });
    });

    lucide.createIcons();
}

// ----------------- Recurring Expenses Data Logic -----------------

function loadRecurringExpenses() {
    const saved = localStorage.getItem('receipt_recurring');
    if (saved) {
        try {
            recurringExpenses = JSON.parse(saved);
        } catch (e) {
            recurringExpenses = [];
        }
    } else {
        recurringExpenses = [];
    }
}

function saveRecurringExpense() {
    const name = recurringName.value.trim();
    const amount = parseInt(recurringAmount.value) || 0;
    const category = recurringCategory.value;
    const start = recurringStartDate.value;
    const end = recurringEndDate.value;

    if (!name) {
        showToast('項目名を入力してください。', 'error');
        return;
    }
    if (amount <= 0) {
        showToast('有効な金額を入力してください。', 'error');
        return;
    }
    if (!start) {
        showToast('適用開始日を入力してください。', 'error');
        return;
    }

    if (editingRecurringId) {
        const idx = recurringExpenses.findIndex(r => r.id === editingRecurringId);
        if (idx !== -1) {
            recurringExpenses[idx] = {
                id: editingRecurringId,
                name: name,
                amount: amount,
                category: category,
                startDate: start,
                endDate: end || "" // Optional end date
            };
            showToast('固定費データを更新しました！', 'success');
        }
        editingRecurringId = null;
        recurringFormTitle.innerHTML = `<i data-lucide="plus-circle" style="color: var(--accent);"></i> 定期支出の新規作成`;
    } else {
        const newRecurring = {
            id: Date.now().toString(),
            name: name,
            amount: amount,
            category: category,
            startDate: start,
            endDate: end || ""
        };
        recurringExpenses.push(newRecurring);
        showToast('定期支出を登録しました！', 'success');
    }

    localStorage.setItem('receipt_recurring', JSON.stringify(recurringExpenses));
    resetRecurringForm();
    renderRecurringList();
    updateDashboard(); // Redraw budget calculations
}

function resetRecurringForm() {
    recurringName.value = '';
    recurringAmount.value = '';
    recurringStartDate.value = '';
    recurringEndDate.value = '';
    recurringCategory.value = 'food';
    editingRecurringId = null;
    recurringFormTitle.innerHTML = `<i data-lucide="plus-circle" style="color: var(--accent);"></i> 定期支出の新規作成`;
}

function editRecurring(id) {
    const r = recurringExpenses.find(x => x.id === id);
    if (!r) return;

    editingRecurringId = id;
    recurringName.value = r.name;
    recurringAmount.value = r.amount;
    recurringCategory.value = r.category;
    recurringStartDate.value = r.startDate;
    recurringEndDate.value = r.endDate || '';
    
    recurringFormTitle.innerHTML = `<i data-lucide="edit-3" style="color: var(--primary);"></i> 定期支出の編集`;
    document.getElementById('recurringFormTitle').scrollIntoView({ behavior: 'smooth' });
    lucide.createIcons();
}

function deleteRecurring(id) {
    recurringExpenses = recurringExpenses.filter(r => r.id !== id);
    localStorage.setItem('receipt_recurring', JSON.stringify(recurringExpenses));
    showToast('定期支出設定を削除しました。', 'info');
    renderRecurringList();
    updateDashboard();
}

function renderRecurringList() {
    recurringPeriodsList.innerHTML = '';
    
    if (recurringExpenses.length === 0) {
        recurringPeriodsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon"><i data-lucide="info"></i></div>
                <p>登録された固定費はありません</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    recurringExpenses.forEach(r => {
        const meta = categoryMeta[r.category] || categoryMeta.others;
        const endText = r.endDate ? r.endDate : "期限なし";
        const card = document.createElement('div');
        card.className = 'glass-panel budget-period-card';
        card.innerHTML = `
            <div class="budget-period-header">
                <div class="budget-period-dates">
                    <strong style="font-size: 14px; color: #FFF;">${r.name}</strong>
                </div>
                <div>
                    <button class="btn btn-icon edit-rec-btn" data-id="${r.id}" title="編集">
                        <i data-lucide="edit-2" style="width:14px;"></i>
                    </button>
                    <button class="btn btn-icon delete-rec-btn" data-id="${r.id}" title="削除">
                        <i data-lucide="trash-2" style="width:14px;"></i>
                    </button>
                </div>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; font-size: 13px;">
                <span class="badge ${meta.class}">${meta.label}</span>
                <strong style="color: var(--accent); font-size:15px;">¥${r.amount.toLocaleString()} / 月</strong>
            </div>
            <div style="font-size: 10px; color: var(--text-muted); margin-top: 8px;">
                適用期間: ${r.startDate} 〜 ${endText}
            </div>
        `;
        recurringPeriodsList.appendChild(card);
    });

    recurringPeriodsList.querySelectorAll('.edit-rec-btn').forEach(btn => {
        btn.addEventListener('click', () => editRecurring(btn.getAttribute('data-id')));
    });

    recurringPeriodsList.querySelectorAll('.delete-rec-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (confirm('この定期支出を削除しますか？')) {
                deleteRecurring(btn.getAttribute('data-id'));
            }
        });
    });

    lucide.createIcons();
}

// Find budget covering currently viewed month
function getActiveBudgetForMonth(date) {
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    const match = budgets.find(b => {
        const bStart = new Date(b.startDate);
        const bEnd = new Date(b.endDate);
        return bStart <= monthEnd && bEnd >= monthStart;
    });

    if (match) return match.categories;
    return {};
}

// Event Listeners Setup
function setupEventListeners() {
    openSettingsBtn.addEventListener('click', openModal);
    closeSettingsBtn.addEventListener('click', closeModal);
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) closeModal();
    });
    
    saveApiKeyBtn.addEventListener('click', saveApiKey);
    clearApiKeyBtn.addEventListener('click', clearApiKey);

    // CSV export trigger
    document.getElementById('exportCsvBtn').addEventListener('click', exportToCsv);
    
    // CSV import triggers
    importCsvBtn.addEventListener('click', () => csvFileInput.click());
    csvFileInput.addEventListener('change', importFromCsv);

    // File selection / drag drop
    dropzone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);
    
    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
    });
    
    dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('dragover');
    });
    
    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            processFiles(e.dataTransfer.files);
        }
    });

    // Editor control
    addItemBtn.addEventListener('click', () => addReceiptItem('', 0, 'food'));
    cancelEditBtn.addEventListener('click', resetScannerState);
    saveReceiptBtn.addEventListener('click', saveCurrentTransaction);

    // Day detail Modal close buttons
    closeDayDetailBtn.addEventListener('click', closeDayModal);
    closeDayDetailModalBtn.addEventListener('click', closeDayModal);
    dayDetailModal.addEventListener('click', (e) => {
        if (e.target === dayDetailModal) closeDayModal();
    });

    // Budget Tab control triggers
    saveBudgetBtn.addEventListener('click', saveBudgetPeriod);
    resetBudgetFormBtn.addEventListener('click', resetBudgetForm);

    // Recurring Expenses Tab controls
    saveRecurringBtn.addEventListener('click', saveRecurringExpense);
    resetRecurringFormBtn.addEventListener('click', resetRecurringForm);

    // Continuous In-App Camera Triggers
    startCameraBtn.addEventListener('click', startContinuousCamera);
    closeCameraBtn.addEventListener('click', stopContinuousCamera);
    shutterBtn.addEventListener('click', captureSnapshot);
    processCapturedBtn.addEventListener('click', submitCapturedImages);

    // Manual Input Mode trigger
    manualInputBtn.addEventListener('click', startManualInput);

    // Period aggregator toggles in Analytics view
    const toggleBtns = document.querySelectorAll('#analyticsPeriodToggle .toggle-btn');
    toggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            toggleBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            analyticsPeriod = btn.getAttribute('data-period');
            
            // Show/hide month selector based on period
            const monthNav = document.getElementById('analyticsMonthNav');
            if (analyticsPeriod === 'month') {
                monthNav.style.display = 'flex';
            } else {
                monthNav.style.display = 'none';
            }
            
            updateAnalyticsView();
        });
    });
}

// Manual Input Launch
function startManualInput() {
    resetScannerState();
    
    // スキャンエリアを非表示にし、エディタのみを表示する
    dropzone.style.display = 'none';
    scannerContainer.style.display = 'none';
    
    editingTransactionId = null;
    
    // Blank model
    const blankData = {
        storeName: "",
        date: new Date().toISOString().split('T')[0],
        total: 0,
        items: []
    };

    populateEditor(blankData);
    
    // Set focus
    setTimeout(() => {
        receiptStore.focus();
        editorPanel.scrollIntoView({ behavior: 'smooth' });
    }, 100);
}

// Day Detail Modal Popover
function openDayModal(dateStr, spent, dayTxns) {
    const dateObj = new Date(dateStr);
    const mStr = dateObj.getMonth() + 1;
    const dStr = dateObj.getDate();
    dayDetailTitle.innerText = `${dateObj.getFullYear()}年${mStr}月${dStr}日の支出明細`;
    dayDetailTotalSum.innerText = `¥${spent.toLocaleString()}`;

    dayDetailItemsList.innerHTML = '';
    
    if (dayTxns.length === 0) {
        dayDetailItemsList.innerHTML = `<p style="text-align:center; color:var(--text-muted);">取引データがありません。</p>`;
        dayDetailModal.classList.add('active');
        return;
    }

    dayTxns.forEach(t => {
        const storeDiv = document.createElement('div');
        storeDiv.style.margin = '15px 0 8px 0';
        storeDiv.style.borderBottom = '1px dashed var(--card-border)';
        storeDiv.style.paddingBottom = '4px';
        storeDiv.style.fontSize = '12px';
        storeDiv.style.fontWeight = '700';
        storeDiv.style.color = 'var(--primary)';
        storeDiv.innerText = `${t.storeName}`;
        dayDetailItemsList.appendChild(storeDiv);

        t.items.forEach(item => {
            const meta = categoryMeta[item.category] || categoryMeta.others;
            const itemRow = document.createElement('div');
            itemRow.className = 'day-item-card';
            itemRow.innerHTML = `
                <div class="day-item-details">
                    <div class="day-item-name">${item.name}</div>
                    <div class="day-item-meta"><span class="badge ${meta.class}">${meta.label}</span></div>
                </div>
                <strong style="color:#FFF;">¥${item.price.toLocaleString()}</strong>
            `;
            dayDetailItemsList.appendChild(itemRow);
        });
    });

    dayDetailModal.classList.add('active');
    lucide.createIcons();
}

function closeDayModal() {
    dayDetailModal.classList.remove('active');
}

// File Selection Handler (Support Multiple)
function handleFileSelect(e) {
    if (e.target.files.length > 0) {
        processFiles(e.target.files);
    }
}

// ----------------- WebRTC Camera Functions -----------------

async function startContinuousCamera() {
    const constraints = {
        video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 }
        },
        audio: false
    };

    try {
        cameraStream = await navigator.mediaDevices.getUserMedia(constraints);
        cameraVideo.srcObject = cameraStream;
        cameraViewOverlay.style.display = 'flex';
        capturedImages = [];
        updateCameraThumbs();
        showToast('カメラを起動しました。レシートを撮影してください。', 'info');
    } catch (err) {
        console.error('Camera open failed:', err);
        showToast('カメラの起動に失敗しました。カメラ権限を確認してください。', 'error');
    }
}

function stopContinuousCamera() {
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }
    cameraVideo.srcObject = null;
    cameraViewOverlay.style.display = 'none';
}

function captureSnapshot() {
    if (!cameraStream) return;

    cameraFlash.classList.add('flash-active');
    setTimeout(() => cameraFlash.classList.remove('flash-active'), 250);

    const canvas = document.createElement('canvas');
    const width = cameraVideo.videoWidth || 640;
    const height = cameraVideo.videoHeight || 480;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(cameraVideo, 0, 0, width, height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    capturedImages.push(dataUrl);

    showToast(`${capturedImages.length}枚目のレシートを撮影しました。`, 'success');
    updateCameraThumbs();
}

function updateCameraThumbs() {
    capturedThumbsContainer.innerHTML = '';
    
    capturedImages.forEach((imgData, idx) => {
        const thumbWrapper = document.createElement('div');
        thumbWrapper.className = 'captured-thumb-wrapper';
        
        thumbWrapper.innerHTML = `
            <img class="captured-thumb-img" src="${imgData}" alt="Captured Receipt">
            <button class="captured-thumb-delete" data-index="${idx}">&times;</button>
        `;
        
        thumbWrapper.querySelector('.captured-thumb-delete').addEventListener('click', (e) => {
            e.stopPropagation();
            capturedImages.splice(idx, 1);
            updateCameraThumbs();
        });
        
        capturedThumbsContainer.appendChild(thumbWrapper);
    });

    capturedThumbsContainer.scrollLeft = capturedThumbsContainer.scrollWidth;

    const count = capturedImages.length;
    processCapturedBtn.innerHTML = `<i data-lucide="check"></i> 完了 (${count}枚スキャン)`;
    processCapturedBtn.disabled = count === 0;
    lucide.createIcons();
}

async function submitCapturedImages() {
    if (capturedImages.length === 0) return;

    const imagesToProcess = [...capturedImages];
    stopContinuousCamera();

    if (imagesToProcess.length === 1) {
        const base64Data = imagesToProcess[0].split(',')[1];
        scannedImage.src = imagesToProcess[0];
        
        dropzone.style.display = 'none';
        scannerContainer.style.display = 'flex';
        scannerContainer.classList.add('scanning');
        editorPanel.style.display = 'none';
        editingTransactionId = null;

        performScan(base64Data, 'image/jpeg');
    } else {
        dropzone.style.display = 'none';
        editorPanel.style.display = 'none';
        scannerContainer.style.display = 'none';
        bulkProgressContainer.style.display = 'block';
        
        bulkProgressBar.style.width = '0%';
        bulkProgressText.innerText = `0 / ${imagesToProcess.length} 枚完了`;
        
        let successCount = 0;
        
        for (let i = 0; i < imagesToProcess.length; i++) {
            const imgData = imagesToProcess[i];
            bulkProgressText.innerText = `${i + 1} / ${imagesToProcess.length} 枚目を解析中...`;
            
            try {
                const base64Data = imgData.split(',')[1];
                const result = await processSingleFileInBackground(base64Data, 'image/jpeg');
                
                if (result) {
                    const newTransaction = {
                        id: (Date.now() + i).toString(),
                        storeName: result.storeName || "連続スキャン店舗",
                        date: result.date || new Date().toISOString().split('T')[0],
                        total: result.total || 0,
                        items: result.items || []
                    };
                    transactions.unshift(newTransaction);
                    successCount++;
                }
            } catch (err) {
                console.error(`Bulk WebRTC snap item ${i} failed:`, err);
            }
            
            const percent = ((i + 1) / imagesToProcess.length) * 100;
            bulkProgressBar.style.width = `${percent}%`;
        }
        
        localStorage.setItem('receipt_transactions', JSON.stringify(transactions));
        
        bulkProgressContainer.style.display = 'none';
        resetScannerState();
        updateDashboard();
        
        showToast(`${successCount}件のレシートをカメラから一括登録しました！`, 'success');
    }
}

// ----------------- Dynamic Subscriptions Injection helper -----------------

// Returns custom resolved transactions for current month (including injected recurring)
function getMonthlyResolvedTransactions(year, month) {
    // 1. Get raw standard transactions matching year/month
    const list = transactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate.getFullYear() === year && tDate.getMonth() === month;
    });

    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);

    // 2. Loop through all recurring items and inject virtual transactions if active
    recurringExpenses.forEach(r => {
        const rStart = new Date(r.startDate);
        const rEnd = r.endDate ? new Date(r.endDate) : null;
        
        // Active if recurring duration overlaps current month
        if (rStart <= monthEnd && (!rEnd || rEnd >= monthStart)) {
            // Pick a day for projection (usually the 1st of month or billing date)
            const billingDay = String(Math.min(monthEnd.getDate(), rStart.getDate())).padStart(2, '0');
            const mStr = String(month + 1).padStart(2, '0');
            const billingDateStr = `${year}-${mStr}-${billingDay}`;
            
            const virtualTxn = {
                id: `rec-${r.id}`,
                storeName: `[定期固定] ${r.name}`,
                date: billingDateStr,
                total: r.amount,
                items: [{ name: r.name, price: r.amount, category: r.category }],
                isRecurring: true // Block editing in main history UI
            };
            list.push(virtualTxn);
        }
    });

    return list;
}

// Process Multiple Image files
async function processFiles(files) {
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
        showToast('画像ファイルを選択してください。', 'error');
        return;
    }

    if (imageFiles.length === 1) {
        const file = imageFiles[0];
        const reader = new FileReader();
        reader.onload = function(e) {
            scannedImage.src = e.target.result;
            dropzone.style.display = 'none';
            scannerContainer.style.display = 'flex';
            scannerContainer.classList.add('scanning');
            editorPanel.style.display = 'none';
            editingTransactionId = null; // Clear edit mode
            
            const base64Data = e.target.result.split(',')[1];
            const mimeType = file.type;
            
            performScan(base64Data, mimeType);
        };
        reader.readAsDataURL(file);
    } else {
        dropzone.style.display = 'none';
        editorPanel.style.display = 'none';
        scannerContainer.style.display = 'none';
        bulkProgressContainer.style.display = 'block';
        
        bulkProgressBar.style.width = '0%';
        bulkProgressText.innerText = `0 / ${imageFiles.length} 枚完了`;
        
        let successCount = 0;
        
        for (let i = 0; i < imageFiles.length; i++) {
            const file = imageFiles[i];
            bulkProgressText.innerText = `${i + 1} / ${imageFiles.length} 枚目を解析中...`;
            
            try {
                const base64Data = await readFileAsBase64(file);
                const result = await processSingleFileInBackground(base64Data, file.type);
                
                if (result) {
                    const newTransaction = {
                        id: (Date.now() + i).toString(),
                        storeName: result.storeName || "一括スキャン店舗",
                        date: result.date || new Date().toISOString().split('T')[0],
                        total: result.total || 0,
                        items: result.items || []
                    };
                    
                    transactions.unshift(newTransaction);
                    successCount++;
                }
            } catch (err) {
                console.error(`Bulk item ${i} failed:`, err);
            }
            
            const percent = ((i + 1) / imageFiles.length) * 100;
            bulkProgressBar.style.width = `${percent}%`;
        }
        
        localStorage.setItem('receipt_transactions', JSON.stringify(transactions));
        
        bulkProgressContainer.style.display = 'none';
        resetScannerState();
        updateDashboard();
        
        showToast(`${successCount}件のレシートを自動で一括登録しました！`, 'success');
    }
}

// Promise wrapper to read file as Data URL
function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
}

// Background OCR/AI Parsing for bulk upload
async function processSingleFileInBackground(base64Data, mimeType) {
    const apiKey = localStorage.getItem('gemini_api_key');
    
    if (apiKey) {
        try {
            const promptText = `
Analyze this receipt image. Extract the following information and output it EXACTLY in the requested JSON format.
Determine the appropriate category for each item.
Categories must be exactly one of: 'food', 'dining', 'luxuries', 'shopping', 'clothing', 'furniture', 'utilities', 'mortgage', 'insurance', 'medical', 'education', 'transport', 'social', 'entertainment', 'special', or 'others'.

Output JSON structure:
{
  "storeName": "Store Name Here",
  "date": "YYYY-MM-DD",
  "total": 1200,
  "items": [
    { "name": "Item 1", "price": 400, "category": "food" },
    { "name": "Item 2", "price": 800, "category": "shopping" }
  ]
}
`;
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: promptText },
                            { inlineData: { mimeType: mimeType, data: base64Data } }
                        ]
                    }],
                    generationConfig: {
                        responseMimeType: "application/json",
                        responseSchema: {
                            type: "OBJECT",
                            properties: {
                                storeName: { type: "STRING" },
                                date: { type: "STRING" },
                                total: { type: "INTEGER" },
                                items: {
                                    type: "ARRAY",
                                    items: {
                                        type: "OBJECT",
                                        properties: {
                                            name: { type: "STRING" },
                                            price: { type: "INTEGER" },
                                            category: { type: "STRING", enum: Object.keys(categoryMeta) }
                                        },
                                        required: ["name", "price", "category"]
                                    }
                                }
                            },
                            required: ["storeName", "date", "total", "items"]
                        }
                    }
                })
            });

            if (!response.ok) throw new Error('API failed');
            const data = await response.json();
            return JSON.parse(data.candidates[0].content.parts[0].text.trim());
        } catch (e) {
            console.error('API Background call failed. Using mock fallback.', e);
            return getMockReceiptResult();
        }
    } else {
        await new Promise(r => setTimeout(r, 1500));
        return getMockReceiptResult();
    }
}

// Return a randomized mock receipt result
function getMockReceiptResult() {
    const randomIndex = Math.floor(Math.random() * mockReceipts.length);
    const selectedMock = JSON.parse(JSON.stringify(mockReceipts[randomIndex]));
    
    // Map random categories for mocks out of 16 options
    selectedMock.items.forEach(item => {
        const keys = Object.keys(categoryMeta);
        const randKey = keys[Math.floor(Math.random() * 6)]; // Pick from food/shop/util keys mostly
        item.category = randKey;
    });

    const daysAgo = Math.floor(Math.random() * 5);
    selectedMock.date = new Date(Date.now() - (daysAgo * 86400000)).toISOString().split('T')[0];
    return selectedMock;
}

// OCR & AI Parsing function (Single Flow)
async function performScan(base64Data, mimeType) {
    const apiKey = localStorage.getItem('gemini_api_key');
    
    if (apiKey) {
        try {
            const promptText = `
Analyze this receipt image. Extract the following information and output it EXACTLY in the requested JSON format.
Make your best guess based on the receipt contents. Translate items into Japanese if they are readable.
Categories must be exactly one of: 'food', 'dining', 'luxuries', 'shopping', 'clothing', 'furniture', 'utilities', 'mortgage', 'insurance', 'medical', 'education', 'transport', 'social', 'entertainment', 'special', or 'others'.

Output JSON structure:
{
  "storeName": "Store Name Here",
  "date": "YYYY-MM-DD",
  "total": 1280,
  "items": [
    { "name": "Item Name 1", "price": 500, "category": "food" | "dining" | "luxuries" | "shopping" | "clothing" | "furniture" | "utilities" | "mortgage" | "insurance" | "medical" | "education" | "transport" | "social" | "entertainment" | "special" | "others" },
    { "name": "Item Name 2", "price": 780, "category": "food" | "dining" | "luxuries" | "shopping" | "clothing" | "furniture" | "utilities" | "mortgage" | "insurance" | "medical" | "education" | "transport" | "social" | "entertainment" | "special" | "others" }
  ]
}
`;

            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                { text: promptText },
                                {
                                    inlineData: {
                                        mimeType: mimeType,
                                        data: base64Data
                                    }
                                }
                            ]
                        }
                    ],
                    generationConfig: {
                        responseMimeType: "application/json",
                        responseSchema: {
                            type: "OBJECT",
                            properties: {
                                storeName: { type: "STRING" },
                                date: { type: "STRING", description: "Format: YYYY-MM-DD" },
                                total: { type: "INTEGER" },
                                items: {
                                    type: "ARRAY",
                                    items: {
                                        type: "OBJECT",
                                        properties: {
                                            name: { type: "STRING" },
                                            price: { type: "INTEGER" },
                                            category: { type: "STRING", enum: Object.keys(categoryMeta) }
                                        },
                                        required: ["name", "price", "category"]
                                    }
                                }
                            },
                            required: ["storeName", "date", "total", "items"]
                        }
                    }
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error?.message || 'API request failed');
            }

            const data = await response.json();
            const parsedData = JSON.parse(data.candidates[0].content.parts[0].text.trim());
            
            populateEditor(parsedData);
            showToast('AIレシート解析が完了しました！', 'success');
            
        } catch (error) {
            console.error('Gemini API Error:', error);
            showToast(`API解析エラー: ${error.message}。デモデータで代替します。`, 'error');
            setTimeout(() => runMockScan(), 1000);
        }
    } else {
        runMockScan();
    }
}

function runMockScan() {
    setTimeout(() => {
        const selectedMock = getMockReceiptResult();
        populateEditor(selectedMock);
        showToast('デモレシートのスキャンが完了しました！', 'success');
    }, 2500);
}

// Populate UI form editor
function populateEditor(data) {
    currentScannedData = data;
    scannerContainer.classList.remove('scanning');
    
    if (editingTransactionId) {
        editorTitle.innerHTML = `<i data-lucide="edit-3" style="color: var(--primary)"></i> 取引データの編集`;
    } else if (data.storeName === "" && data.total === 0 && data.items.length === 0) {
        editorTitle.innerHTML = `<i data-lucide="keyboard" style="color: var(--primary)"></i> 手動で支出を追加`;
    } else {
        editorTitle.innerHTML = `<i data-lucide="edit-3" style="color: var(--primary)"></i> 解析結果の確認・編集`;
    }
    
    receiptStore.value = data.storeName || '';
    receiptDate.value = data.date || new Date().toISOString().split('T')[0];
    receiptTotal.value = data.total || 0;
    
    itemsList.innerHTML = '';
    if (data.items && data.items.length > 0) {
        data.items.forEach(item => {
            addReceiptItem(item.name, item.price, item.category || 'others');
        });
    } else {
        addReceiptItem('商品・サービス合計', data.total || 0, 'food');
    }
    
    editorPanel.style.display = 'block';
    editorPanel.scrollIntoView({ behavior: 'smooth' });
    lucide.createIcons();
}

function addReceiptItem(name = '', price = 0, category = 'food') {
    const itemRow = document.createElement('div');
    itemRow.className = 'item-row';
    
    let optionsHtml = '';
    Object.keys(categoryMeta).forEach(key => {
        const meta = categoryMeta[key];
        optionsHtml += `<option value="${key}" ${key === category ? 'selected' : ''}>${meta.label}</option>`;
    });

    itemRow.innerHTML = `
        <input type="text" class="item-name" placeholder="品名" value="${name}">
        <select class="item-category-select">
            ${optionsHtml}
        </select>
        <input type="number" class="item-price" placeholder="単価" value="${price}">
        <button class="btn btn-icon delete-item-btn" title="品目を削除">
            <i data-lucide="trash-2"></i>
        </button>
    `;
    
    itemsList.appendChild(itemRow);
    lucide.createIcons();
    
    const priceInput = itemRow.querySelector('.item-price');
    priceInput.addEventListener('input', calculateTotalFromItems);
    
    const deleteBtn = itemRow.querySelector('.delete-item-btn');
    deleteBtn.addEventListener('click', () => {
        itemRow.remove();
        calculateTotalFromItems();
    });
}

function calculateTotalFromItems() {
    const priceInputs = itemsList.querySelectorAll('.item-price');
    let sum = 0;
    priceInputs.forEach(input => {
        const val = parseFloat(input.value) || 0;
        sum += val;
    });
    receiptTotal.value = sum;
}

// Reset scan UI state
function resetScannerState() {
    dropzone.style.display = 'block';
    scannerContainer.style.display = 'none';
    editorPanel.style.display = 'none';
    fileInput.value = '';
    currentScannedData = null;
    editingTransactionId = null;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Edit existing transaction
function editTransaction(id) {
    const txn = transactions.find(t => t.id === id);
    if (!txn) return;
    
    editingTransactionId = id;
    populateEditor(txn);
    
    dropzone.style.display = 'none';
    scannerContainer.style.display = 'none';
}

// Save active transaction to localStorage
function saveCurrentTransaction() {
    const store = receiptStore.value.trim();
    const date = receiptDate.value;
    const total = parseInt(receiptTotal.value) || 0;
    
    if (!store) {
        showToast('店舗名/支出名を入力してください。', 'error');
        return;
    }
    if (!date) {
        showToast('日付を入力してください。', 'error');
        return;
    }

    const itemRows = itemsList.querySelectorAll('.item-row');
    const items = [];
    itemRows.forEach(row => {
        const name = row.querySelector('.item-name').value.trim();
        const category = row.querySelector('.item-category-select').value;
        const price = parseInt(row.querySelector('.item-price').value) || 0;
        if (name) {
            items.push({ name, category, price });
        }
    });

    if (editingTransactionId) {
        const index = transactions.findIndex(t => t.id === editingTransactionId);
        if (index !== -1) {
            transactions[index] = {
                id: editingTransactionId,
                storeName: store,
                date: date,
                total: total,
                items: items
            };
            showToast('取引データを更新しました！', 'success');
        }
        editingTransactionId = null;
    } else {
        const newTransaction = {
            id: Date.now().toString(),
            storeName: store,
            date: date,
            total: total,
            items: items
        };
        transactions.unshift(newTransaction);
        showToast('家計簿に登録しました！', 'success');
    }

    localStorage.setItem('receipt_transactions', JSON.stringify(transactions));
    resetScannerState();
    updateDashboard();
}

function deleteTransaction(id) {
    transactions = transactions.filter(t => t.id !== id);
    localStorage.setItem('receipt_transactions', JSON.stringify(transactions));
    showToast('データを削除しました。', 'info');
    
    if (activeFilterDate) {
        const hasMoreOnDate = transactions.some(t => t.date === activeFilterDate);
        if (!hasMoreOnDate) activeFilterDate = null;
    }
    
    updateDashboard();
}

function loadTransactions() {
    const saved = localStorage.getItem('receipt_transactions');
    if (saved) {
        try {
            transactions = JSON.parse(saved);
            
            // DATA MIGRATION: Convert old format
            transactions.forEach(t => {
                if (t.category && (!t.items || t.items.some(item => !item.category))) {
                    if (!t.items || t.items.length === 0) {
                        t.items = [{ name: "レシート合計", price: t.total, category: t.category }];
                    } else {
                        t.items.forEach(item => {
                            if (!item.category) item.category = t.category;
                        });
                    }
                    delete t.category;
                }
            });
            localStorage.setItem('receipt_transactions', JSON.stringify(transactions));
        } catch (e) {
            transactions = [];
        }
    }
}

// Update Dashboard View Tab
function updateDashboard() {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth(); // 0-11
    
    // Resolve standard + recurring transactions for current month
    const monthlyTxns = getMonthlyResolvedTransactions(year, month);

    const receiptCount = monthlyTxns.length;
    receiptCountVals.forEach(v => v.innerText = `${receiptCount} 件`);
    
    const monthlyTotalSum = monthlyTxns.reduce((acc, curr) => acc + curr.total, 0);
    totalExpensesVals.forEach(v => v.innerText = `¥${monthlyTotalSum.toLocaleString()}`);
    
    // Budget Calculations (Summed items budget vs actual monthly sum)
    const activeBudgetCats = getActiveBudgetForMonth(currentMonth);
    const overallBudget = Object.values(activeBudgetCats).reduce((acc, curr) => acc + curr, 0);
    
    // Update budget bars on both dashboard/analytics instances
    updateOverallBudgetBars(monthlyTotalSum, overallBudget);
    
    // Render Calendar
    renderCalendarGrid(monthlyTxns);

    // Filter history list
    let filteredHistoryTxns = monthlyTxns;
    if (activeFilterDate) {
        filteredHistoryTxns = monthlyTxns.filter(t => t.date === activeFilterDate);
        filterActiveBadge.style.display = 'inline-block';
        filterActiveBadge.innerText = `${activeFilterDate.split('-')[2]}日のフィルタ中`;
    } else {
        filterActiveBadge.style.display = 'none';
    }

    // Render History List UI
    if (filteredHistoryTxns.length === 0) {
        historyEmptyState.style.display = 'flex';
        const items = historyList.querySelectorAll('.history-item');
        items.forEach(el => el.remove());
    } else {
        historyEmptyState.style.display = 'none';
        
        const oldItems = historyList.querySelectorAll('.history-item');
        oldItems.forEach(el => el.remove());
        
        filteredHistoryTxns.forEach(t => {
            const itemCategories = [...new Set(t.items.map(item => item.category || 'others'))];
            
            let badgesHtml = '';
            itemCategories.forEach(cat => {
                const meta = categoryMeta[cat] || categoryMeta.others;
                badgesHtml += `<span class="badge ${meta.class}">${meta.label}</span>`;
            });

            const isRec = t.isRecurring;
            const actionButtonsHtml = isRec 
                ? `<span style="font-size: 11px; color: var(--text-muted); font-weight: 600; padding-right:10px;">[固定費]</span>`
                : `
                    <button class="btn btn-icon edit-txn-btn" data-id="${t.id}" title="編集" style="color: var(--text-muted);">
                        <i data-lucide="edit-2" style="width: 15px; height: 15px;"></i>
                    </button>
                    <button class="btn btn-icon delete-txn-btn" data-id="${t.id}" title="削除" style="color: var(--text-muted);">
                        <i data-lucide="trash-2" style="width: 15px; height: 15px;"></i>
                    </button>
                  `;

            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.innerHTML = `
                <div class="history-left">
                    <div class="history-title" title="${t.storeName}">${t.storeName}</div>
                    <div class="history-meta">
                        <span>${t.date}</span>
                        ${badgesHtml}
                    </div>
                </div>
                <div class="history-right">
                    <div class="history-amount">¥${t.total.toLocaleString()}</div>
                    ${actionButtonsHtml}
                </div>
            `;
            historyList.appendChild(historyItem);
        });
        
        // Bind events
        historyList.querySelectorAll('.delete-txn-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.getAttribute('data-id');
                if (confirm('この取引データを家計簿から削除しますか？')) {
                    deleteTransaction(id);
                }
            });
        });

        historyList.querySelectorAll('.edit-txn-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.getAttribute('data-id');
                editTransaction(id);
            });
        });
        
        lucide.createIcons();
    }
    
    // Sync Category distribution charts
    updateCategoryCharts(monthlyTxns);
}

// Update dashboard/analytics budget progress bar instances
function updateOverallBudgetBars(monthlyTotalSum, overallBudget) {
    const remaining = overallBudget - monthlyTotalSum;
    const percent = overallBudget > 0 ? (monthlyTotalSum / overallBudget) * 100 : 0;
    
    budgetPercentLabels.forEach(label => {
        if (overallBudget > 0) {
            label.innerText = `消化率: ${Math.round(percent)}% (¥${monthlyTotalSum.toLocaleString()} / ¥${overallBudget.toLocaleString()})`;
        } else {
            label.innerText = `消化率: 0% (¥${monthlyTotalSum.toLocaleString()} / 予算未設定)`;
        }
    });
    
    budgetRemainingLabels.forEach(label => {
        if (overallBudget === 0) {
            label.innerText = "予算を設定してください";
            label.style.color = "var(--text-muted)";
        } else if (remaining >= 0) {
            label.innerText = `残高: ¥${remaining.toLocaleString()}`;
            label.style.color = 'var(--text-muted)';
        } else {
            label.innerText = `予算超過: ¥${Math.abs(remaining).toLocaleString()}`;
            label.style.color = 'var(--danger)';
        }
    });
    
    budgetProgressBars.forEach(bar => {
        bar.style.width = `${Math.min(100, percent)}%`;
        if (percent > 100) {
            bar.classList.add('over-budget');
        } else {
            bar.classList.remove('over-budget');
        }
    });

    // --- CATEGORY BUDGETS LIST RENDERING ---
    const catBudgetsContainer = document.getElementById('dashboardCategoryBudgets');
    if (catBudgetsContainer) {
        catBudgetsContainer.innerHTML = '';
        
        const activeBudgetCats = getActiveBudgetForMonth(currentMonth);
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const monthlyTxns = getMonthlyResolvedTransactions(year, month);
        
        const catSpends = {};
        Object.keys(categoryMeta).forEach(k => catSpends[k] = 0);
        
        monthlyTxns.forEach(t => {
            t.items.forEach(item => {
                const cat = item.category || 'others';
                if (catSpends.hasOwnProperty(cat)) {
                    catSpends[cat] += item.price;
                } else {
                    catSpends.others += item.price;
                }
            });
        });
        
        let hasAnyBudgetDisplay = false;
        Object.keys(categoryMeta).forEach(catKey => {
            const budgetAmt = activeBudgetCats[catKey] || 0;
            const spendAmt = catSpends[catKey] || 0;
            
            // Only render categories that either have a budget set or have recorded spending this month
            if (budgetAmt > 0 || spendAmt > 0) {
                hasAnyBudgetDisplay = true;
                const meta = categoryMeta[catKey] || categoryMeta.others;
                const catPercent = budgetAmt > 0 ? (spendAmt / budgetAmt) * 100 : 0;
                const catRemaining = budgetAmt - spendAmt;
                
                let progressColor = 'background: var(--primary);';
                if (catPercent > 100) {
                    progressColor = 'background: linear-gradient(90deg, var(--danger) 0%, #F59E0B 100%);';
                } else if (catPercent > 80) {
                    progressColor = 'background: #F59E0B;';
                }
                
                const row = document.createElement('div');
                row.className = 'dashboard-category-budget-row';
                
                let budgetText = '';
                let remainingText = '';
                if (budgetAmt > 0) {
                    budgetText = `(¥${spendAmt.toLocaleString()} / ¥${budgetAmt.toLocaleString()})`;
                    if (catRemaining >= 0) {
                        remainingText = `残: ¥${catRemaining.toLocaleString()}`;
                    } else {
                        remainingText = `超過: ¥${Math.abs(catRemaining).toLocaleString()}`;
                    }
                } else {
                    budgetText = `(¥${spendAmt.toLocaleString()} / 未設定)`;
                    remainingText = `予算なし`;
                }
                
                row.innerHTML = `
                    <div class="dashboard-category-budget-info">
                        <span class="badge ${meta.class}" style="font-size: 10px;">${meta.label}</span>
                        <span style="color: var(--text-muted); font-size:10px;">${Math.round(catPercent)}% ${budgetText}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px;">
                        <div class="progress-bar-container" style="flex-grow: 1; height: 6px; background: rgba(255,255,255,0.05); margin-bottom: 0;">
                            <div class="progress-bar-fill" style="height: 100%; width: ${Math.min(100, catPercent)}%; ${progressColor}"></div>
                        </div>
                        <span style="font-size: 10px; font-weight: 600; color: ${catRemaining < 0 ? 'var(--danger)' : 'var(--text-muted)'}; min-width: 80px; text-align: right;">
                            ${remainingText}
                        </span>
                    </div>
                `;
                catBudgetsContainer.appendChild(row);
            }
        });

        if (!hasAnyBudgetDisplay) {
            catBudgetsContainer.innerHTML = `
                <div style="text-align: center; color: var(--text-muted); font-size: 11px; padding: 10px 0;">
                    今月の項目別予算・支出はまだありません。
                </div>
            `;
        }
    }
}

// Dynamically generate calendar grid cells
function renderCalendarGrid(monthlyTxns) {
    calendarGrid.innerHTML = '';
    
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const startOffset = firstDay.getDay(); // 0 is Sunday, 6 is Saturday
    
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    const spendMap = {};
    const txnMap = {};
    
    monthlyTxns.forEach(t => {
        const dateStr = t.date;
        spendMap[dateStr] = (spendMap[dateStr] || 0) + t.total;
        if (!txnMap[dateStr]) txnMap[dateStr] = [];
        txnMap[dateStr].push(t);
    });

    for (let i = 0; i < startOffset; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'calendar-day empty';
        calendarGrid.appendChild(emptyCell);
    }
    
    const todayStr = new Date().toISOString().split('T')[0];
    
    for (let d = 1; d <= totalDays; d++) {
        const dayCell = document.createElement('div');
        const dStr = String(d).padStart(2, '0');
        const mStr = String(month + 1).padStart(2, '0');
        const dateStr = `${year}-${mStr}-${dStr}`;
        
        const spent = spendMap[dateStr] || 0;
        const isToday = dateStr === todayStr;
        const isFiltered = dateStr === activeFilterDate;
        
        let cellClass = 'calendar-day';
        if (isToday) cellClass += ' today';
        if (isFiltered) cellClass += ' active-filter';
        if (spent > 0) {
            cellClass += ' has-spend';
            if (spent >= 10000) {
                cellClass += ' has-high-spend';
            }
        }
        
        dayCell.className = cellClass;
        dayCell.setAttribute('data-date', dateStr);
        
        const amountText = spent > 0 ? `¥${(spent).toLocaleString()}` : '';
        
        dayCell.innerHTML = `
            <span class="calendar-day-num">${d}</span>
            <span class="calendar-day-amount" title="${amountText}">${amountText}</span>
        `;
        
        dayCell.addEventListener('click', () => {
            const dayTxns = txnMap[dateStr] || [];
            openDayModal(dateStr, spent, dayTxns);
            
            if (spent > 0) {
                activeFilterDate = isFiltered ? null : dateStr;
                updateDashboard();
            }
        });
        
        calendarGrid.appendChild(dayCell);
    }
}
function updateAnalyticsView() {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const trendChartTitle = document.getElementById('trendChartTitle');
    const trendChartIcon = document.getElementById('trendChartIcon');

    let resolvedTxns = [];
    let chartLabels = [];
    
    // 16 categories aggregate data storage
    const categoryValues = {};
    Object.keys(categoryMeta).forEach(k => {
        categoryValues[k] = [];
    });
    
    let activeBudgetCats = {};
    
    if (analyticsPeriod === 'month') {
        // --- MONTHLY AGGREGATE ---
        resolvedTxns = getMonthlyResolvedTransactions(year, month);
        activeBudgetCats = getActiveBudgetForMonth(currentMonth);

        const lastDay = new Date(year, month + 1, 0).getDate();
        chartLabels = Array.from({ length: lastDay }, (_, i) => `${i + 1}日`);
        
        // Initialize values array for each category (size = days in month)
        Object.keys(categoryMeta).forEach(k => {
            categoryValues[k] = Array(lastDay).fill(0);
        });
        
        resolvedTxns.forEach(t => {
            const dateObj = new Date(t.date);
            const dateIndex = dateObj.getDate() - 1;
            if (dateIndex >= 0 && dateIndex < lastDay) {
                t.items.forEach(item => {
                    const cat = item.category || 'others';
                    const targetCat = categoryValues.hasOwnProperty(cat) ? cat : 'others';
                    categoryValues[targetCat][dateIndex] += item.price;
                });
            }
        });
        
        trendChartTitle.innerText = "日別支出の内訳 (カテゴリ別積み上げ)";
        if (trendChartIcon) trendChartIcon.setAttribute('data-lucide', 'bar-chart-3');
    } 
    else if (analyticsPeriod === 'quarter') {
        // --- QUARTERLY AGGREGATE ---
        const currentQuarter = Math.floor(month / 3); // 0, 1, 2, 3
        const quarterMonths = [currentQuarter * 3, currentQuarter * 3 + 1, currentQuarter * 3 + 2];
        
        quarterMonths.forEach(m => {
            const monthlyList = getMonthlyResolvedTransactions(year, m);
            resolvedTxns = resolvedTxns.concat(monthlyList);
            
            const bCats = getActiveBudgetForMonth(new Date(year, m, 1));
            Object.keys(bCats).forEach(cat => {
                activeBudgetCats[cat] = (activeBudgetCats[cat] || 0) + bCats[cat];
            });
        });

        chartLabels = ["第1四半期 (1-3月)", "第2四半期 (4-6月)", "第3四半期 (7-9月)", "第4四半期 (10-12月)"];
        
        // Initialize values array for each category (size = 4 quarters)
        Object.keys(categoryMeta).forEach(k => {
            categoryValues[k] = Array(4).fill(0);
        });
        
        for (let q = 0; q < 4; q++) {
            const qMonths = [q * 3, q * 3 + 1, q * 3 + 2];
            qMonths.forEach(m => {
                const list = getMonthlyResolvedTransactions(year, m);
                list.forEach(t => {
                    t.items.forEach(item => {
                        const cat = item.category || 'others';
                        const targetCat = categoryValues.hasOwnProperty(cat) ? cat : 'others';
                        categoryValues[targetCat][q] += item.price;
                    });
                });
            });
        }
        
        trendChartTitle.innerText = `${year}年 四半期別の支出内訳 (カテゴリ別積み上げ)`;
        if (trendChartIcon) trendChartIcon.setAttribute('data-lucide', 'bar-chart-2');
    } 
    else if (analyticsPeriod === 'year') {
        // --- YEARLY AGGREGATE ---
        for (let m = 0; m < 12; m++) {
            const monthlyList = getMonthlyResolvedTransactions(year, m);
            resolvedTxns = resolvedTxns.concat(monthlyList);
            
            const bCats = getActiveBudgetForMonth(new Date(year, m, 1));
            Object.keys(bCats).forEach(cat => {
                activeBudgetCats[cat] = (activeBudgetCats[cat] || 0) + bCats[cat];
            });
        }

        chartLabels = Array.from({ length: 12 }, (_, i) => `${i + 1}月`);
        
        // Initialize values array for each category (size = 12 months)
        Object.keys(categoryMeta).forEach(k => {
            categoryValues[k] = Array(12).fill(0);
        });
        
        for (let m = 0; m < 12; m++) {
            const list = getMonthlyResolvedTransactions(year, m);
            list.forEach(t => {
                t.items.forEach(item => {
                    const cat = item.category || 'others';
                    const targetCat = categoryValues.hasOwnProperty(cat) ? cat : 'others';
                    categoryValues[targetCat][m] += item.price;
                });
            });
        }
        
        trendChartTitle.innerText = `${year}年 月別支出の内訳 (カテゴリ別積み上げ)`;
        if (trendChartIcon) trendChartIcon.setAttribute('data-lucide', 'calendar');
    }

    // Build Chart datasets representing 16 categories stacked bar
    const datasets = Object.keys(categoryMeta).map(key => {
        const meta = categoryMeta[key];
        return {
            label: meta.label,
            data: categoryValues[key],
            backgroundColor: meta.color,
            borderColor: meta.color,
            borderWidth: 1,
            stack: 'Stack0'
        };
    });

    // 1. Draw/Update Chart.js instance (Always type: 'bar' for stacked comparison)
    const ctx = document.getElementById('dailyTrendChart').getContext('2d');
    
    // Destroy dailyTrendChartInstance if it was previously created as a different type
    if (dailyTrendChartInstance && dailyTrendChartInstance.config.type !== 'bar') {
        dailyTrendChartInstance.destroy();
        dailyTrendChartInstance = null;
    }

    if (dailyTrendChartInstance) {
        dailyTrendChartInstance.data.labels = chartLabels;
        dailyTrendChartInstance.data.datasets = datasets;
        dailyTrendChartInstance.update();
    } else {
        dailyTrendChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: chartLabels,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                            color: '#9CA3AF',
                            font: { family: 'Plus Jakarta Sans', size: 9 },
                            boxWidth: 8,
                            padding: 8
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                if (context.raw === 0) return null;
                                return `${context.dataset.label}: ¥${context.raw.toLocaleString()}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        stacked: true,
                        ticks: { color: '#9CA3AF' },
                        grid: { color: 'rgba(255,255,255,0.05)' }
                    },
                    x: {
                        stacked: true,
                        ticks: { color: '#9CA3AF', maxRotation: 0 },
                        grid: { display: false }
                    }
                }
            }
        });
    }

    // 2. Render Category Budgets vs Spends Table
    const catSpends = {};
    Object.keys(categoryMeta).forEach(k => catSpends[k] = 0);
    
    resolvedTxns.forEach(t => {
        t.items.forEach(item => {
            const cat = item.category || 'others';
            if (catSpends.hasOwnProperty(cat)) {
                catSpends[cat] += item.price;
            } else {
                catSpends.others += item.price;
            }
        });
    });

    const tableBody = document.getElementById('categoryAnalysisTableBody');
    tableBody.innerHTML = '';

    Object.keys(categoryMeta).forEach(key => {
        const meta = categoryMeta[key];
        const spend = catSpends[key];
        const budget = activeBudgetCats[key] || 0;
        const percent = budget > 0 ? (spend / budget) * 100 : 0;
        const remaining = budget - spend;
        
        let progressColor = 'background: var(--primary);';
        if (percent > 100) {
            progressColor = 'background: linear-gradient(90deg, var(--danger) 0%, #F59E0B 100%);';
        } else if (percent > 80) {
            progressColor = 'background: #F59E0B;';
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><span class="badge ${meta.class}">${meta.label}</span></td>
            <td style="font-weight: 700;">¥${spend.toLocaleString()}</td>
            <td style="color: var(--text-muted);">${budget > 0 ? '¥' + budget.toLocaleString() : '未設定'}</td>
            <td>
                <div style="display:flex; justify-content:space-between; font-size:11px; margin-bottom:4px;">
                    <span>${Math.round(percent)}%</span>
                    <span style="color: ${remaining < 0 ? 'var(--danger)' : 'var(--text-muted)'};">
                        ${remaining >= 0 ? '残: ¥' + remaining.toLocaleString() : '超過: ¥' + Math.abs(remaining).toLocaleString()}
                    </span>
                </div>
                <div style="background: rgba(255,255,255,0.05); height: 6px; border-radius: 3px; overflow: hidden; width: 100%;">
                    <div style="height: 100%; width: ${Math.min(100, percent)}%; ${progressColor} transition: width 0.3s ease;"></div>
                </div>
            </td>
        `;
        tableBody.appendChild(tr);
    });

    // 3. Render Top 10 Expensive Items Purchased (Expanded from 5 to 10)
    const allItems = [];
    resolvedTxns.forEach(t => {
        t.items.forEach(item => {
            allItems.push({
                name: item.name,
                price: item.price,
                category: item.category || 'others',
                store: t.storeName,
                date: t.date
            });
        });
    });

    allItems.sort((a, b) => b.price - a.price);
    const top10 = allItems.slice(0, 10);

    const rankingContainer = document.getElementById('topExpensiveItemsList');
    rankingContainer.innerHTML = '';
    
    if (top10.length === 0) {
        rankingContainer.innerHTML = `<p style="text-align:center; padding: 20px; color: var(--text-muted);">データがありません。</p>`;
    } else {
        top10.forEach((item, index) => {
            const meta = categoryMeta[item.category] || categoryMeta.others;
            const rankCard = document.createElement('div');
            rankCard.className = 'ranking-card';
            rankCard.innerHTML = `
                <div class="ranking-num">${index + 1}</div>
                <div class="ranking-details">
                    <div style="font-weight:600; font-size:13px;">${item.name}</div>
                    <div style="font-size:11px; color:var(--text-muted); display:flex; gap:8px;">
                        <span>${item.store}</span>
                        <span>(${item.date})</span>
                    </div>
                </div>
                <div style="display:flex; flex-direction:column; align-items:flex-end; gap:4px;">
                    <strong style="color:#FFF; font-size:14px;">¥${item.price.toLocaleString()}</strong>
                    <span class="badge ${meta.class}">${meta.label}</span>
                </div>
            `;
            rankingContainer.appendChild(rankCard);
        });
    }

    // 4. Render Top 10 Stores Spend Rankings
    const storeData = {};
    resolvedTxns.forEach(t => {
        const store = t.storeName || "不明な店舗・用途";
        if (!storeData[store]) {
            storeData[store] = { total: 0, count: 0 };
        }
        storeData[store].total += t.total;
        storeData[store].count += 1;
    });
    
    const sortedStores = Object.keys(storeData).map(name => {
        return {
            name: name,
            total: storeData[name].total,
            count: storeData[name].count
        };
    });
    sortedStores.sort((a, b) => b.total - a.total);
    const top10Stores = sortedStores.slice(0, 10);
    
    const storeRankingContainer = document.getElementById('topStoresList');
    if (storeRankingContainer) {
        storeRankingContainer.innerHTML = '';
        
        if (top10Stores.length === 0) {
            storeRankingContainer.innerHTML = `<p style="text-align:center; padding: 20px; color: var(--text-muted);">データがありません。</p>`;
        } else {
            top10Stores.forEach((store, index) => {
                const rankCard = document.createElement('div');
                rankCard.className = 'ranking-card';
                rankCard.innerHTML = `
                    <div class="ranking-num">${index + 1}</div>
                    <div class="ranking-details">
                        <div style="font-weight:600; font-size:13px;">${store.name}</div>
                        <div style="font-size:11px; color:var(--text-muted);">
                            利用回数: ${store.count} 回
                        </div>
                    </div>
                    <div style="display:flex; flex-direction:column; align-items:flex-end;">
                        <strong style="color:#FFF; font-size:14px;">¥${store.total.toLocaleString()}</strong>
                    </div>
                `;
                storeRankingContainer.appendChild(rankCard);
            });
        }
    }


// Chart.js Category doughnut init
function initCharts() {
    const canvases = document.querySelectorAll('.categoryChartCanvas');
    categoryCharts = [];
    
    canvases.forEach(canvas => {
        const ctx = canvas.getContext('2d');
        const chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.values(categoryMeta).map(m => m.label),
                datasets: [{
                    data: Array(Object.keys(categoryMeta).length).fill(0),
                    backgroundColor: Object.values(categoryMeta).map(m => m.color),
                    borderWidth: 1,
                    borderColor: '#1F2937'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                            color: '#9CA3AF',
                            font: { family: 'Plus Jakarta Sans', size: 9 },
                            boxWidth: 8
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.label}: ¥${context.raw.toLocaleString()}`;
                            }
                        }
                    }
                },
                cutout: '65%'
            }
        });
        categoryCharts.push(chart);
    });
}

// Sync category data across all categoryCharts
function updateCategoryCharts(monthlyTxns = []) {
    if (categoryCharts.length === 0) return;
    
    const catSums = {};
    Object.keys(categoryMeta).forEach(k => catSums[k] = 0);
    
    monthlyTxns.forEach(t => {
        if (t.items && t.items.length > 0) {
            t.items.forEach(item => {
                const cat = item.category || 'others';
                if (catSums.hasOwnProperty(cat)) {
                    catSums[cat] += item.price;
                } else {
                    catSums.others += item.price;
                }
            });
        } else {
            catSums.others += t.total;
        }
    });
    
    const dataset = Object.keys(categoryMeta).map(key => catSums[key]);
    const hasData = dataset.some(val => val > 0);
    
    categoryCharts.forEach(chart => {
        if (!hasData) {
            chart.data.datasets[0].data = [1];
            chart.data.datasets[0].backgroundColor = ['#1F2937'];
            chart.data.labels = ['データなし'];
        } else {
            chart.data.datasets[0].data = dataset;
            chart.data.datasets[0].backgroundColor = Object.values(categoryMeta).map(m => m.color);
            chart.data.labels = Object.values(categoryMeta).map(m => m.label);
        }
        chart.update();
    });
}

// Export budget data as CSV
function exportToCsv() {
    if (transactions.length === 0) {
        showToast('保存された家計簿データがありません。', 'error');
        return;
    }

    let csvContent = "\uFEFF"; // UTF-8 BOM
    csvContent += "ID,店舗名,日付,品目名,カテゴリ,価格\n";

    transactions.forEach(t => {
        const storeEscaped = t.storeName.replace(/"/g, '""');
        
        if (t.items && t.items.length > 0) {
            t.items.forEach(item => {
                const catLabel = (categoryMeta[item.category] || categoryMeta.others).label;
                const nameEscaped = item.name.replace(/"/g, '""');
                csvContent += `"${t.id}","${storeEscaped}","${t.date}","${nameEscaped}","${catLabel}",${item.price}\n`;
            });
        } else {
            csvContent += `"${t.id}","${storeEscaped}","${t.date}","レシート合計","その他",${t.total}\n`;
        }
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '_');
    link.setAttribute("download", `receipt_data_${dateStr}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('CSVデータを出力しました！', 'success');
}

// ----------------- CSV Import (Data Restore / Merge Sync) -----------------

function importFromCsv(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(evt) {
        const text = evt.target.result;
        try {
            const importedTransactions = parseCsvData(text);
            
            if (importedTransactions.length === 0) {
                showToast('有効なCSVデータが見つかりませんでした。', 'error');
                return;
            }

            // Merge imported transactions with existing ones, prioritizing imported ones if ID matches
            let mergedCount = 0;
            importedTransactions.forEach(impTxn => {
                const existingIdx = transactions.findIndex(t => t.id === impTxn.id);
                if (existingIdx !== -1) {
                    transactions[existingIdx] = impTxn; // Overwrite
                } else {
                    transactions.push(impTxn); // Append
                    mergedCount++;
                }
            });

            // Sort transactions by date descending
            transactions.sort((a, b) => b.date.localeCompare(a.date));
            
            localStorage.setItem('receipt_transactions', JSON.stringify(transactions));
            showToast(`${importedTransactions.length}件のデータを取り込みました（新規登録: ${mergedCount}件）！`, 'success');
            
            // Refresh
            updateDashboard();
            csvFileInput.value = ''; // Reset file input
            
        } catch (err) {
            console.error('Import CSV Parse Error:', err);
            showToast('CSVのパースに失敗しました。ファイル形式を確認してください。', 'error');
        }
    };
    reader.readAsText(file);
}

// Parse CSV text back to structured Transactions array
function parseCsvData(csvText) {
    const lines = csvText.split('\n');
    if (lines.length <= 1) return [];

    const txnsMap = {};
    const labelToKeyMap = {};
    Object.keys(categoryMeta).forEach(k => labelToKeyMap[categoryMeta[k].label] = k);

    // CSV fields helper parser to handle double quoted commas
    function parseCsvLine(text) {
        let p = '', r = [];
        let q = false;
        for (let i = 0; i < text.length; i++) {
            let c = text[i];
            if (c === '"') {
                q = !q;
            } else if (c === ',' && !q) {
                r.push(p);
                p = '';
            } else {
                p += c;
            }
        }
        r.push(p);
        return r;
    }

    // Skip header line
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const cells = parseCsvLine(line);
        if (cells.length < 6) continue;

        const id = cells[0].trim();
        const storeName = cells[1].trim();
        const date = cells[2].trim();
        const itemName = cells[3].trim();
        const catLabel = cells[4].trim();
        const price = parseInt(cells[5]) || 0;

        const categoryKey = labelToKeyMap[catLabel] || 'others';

        if (!txnsMap[id]) {
            txnsMap[id] = {
                id: id,
                storeName: storeName,
                date: date,
                total: 0,
                items: []
            };
        }

        txnsMap[id].items.push({
            name: itemName,
            price: price,
            category: categoryKey
        });
        txnsMap[id].total += price;
    }

    return Object.values(txnsMap);
}
