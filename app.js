// App State Management
let transactions = [];
let budgets = [];
let categoryCharts = []; // Holds category doughnut charts (dashboard and analytics)
let dailyTrendChart = null; // Holds daily spending line chart (analytics)
let currentScannedData = null;
let editingTransactionId = null; // ID of transaction being edited
let editingBudgetPeriodId = null; // ID of budget period being edited
let currentMonth = new Date(); // Active viewing month
let activeFilterDate = null; // Holds filtered date string "YYYY-MM-DD"

// WebRTC Camera State
let cameraStream = null;
let capturedImages = []; // Array of base64 DataURLs

// Mock Data Database for Demo Mode (Each item now has its own category)
const mockReceipts = [
    {
        storeName: "スターバックス コーヒー 渋谷店",
        date: "", // Set dynamically
        total: 1100,
        items: [
            { name: "ドリップコーヒー Tall", price: 420, category: "food" },
            { name: "チョコチップスコーン", price: 350, category: "food" },
            { name: "チキン＆チーズ ホットサンド", price: 330, category: "food" }
        ]
    },
    {
        storeName: "セブン-イレブン 新宿3丁目店",
        date: "",
        total: 750,
        items: [
            { name: "こだわりツナマヨおにぎり", price: 160, category: "food" },
            { name: "特製サラダチキン", price: 290, category: "food" },
            { name: "濃いお茶 600ml", price: 150, category: "food" },
            { name: "しっとりバームクーヘン", price: 150, category: "shopping" }
        ]
    },
    {
        storeName: "ユニクロ（UNIQLO）原宿店",
        date: "",
        total: 5980,
        items: [
            { name: "ウォッシャブル セーター", price: 2990, category: "shopping" },
            { name: "ストレッチセルビッジジーンズ", price: 2990, category: "shopping" }
        ]
    },
    {
        storeName: "TOHOシネマズ 新宿",
        date: "",
        total: 2300,
        items: [
            { name: "映画鑑賞券（一般）", price: 1900, category: "entertainment" },
            { name: "ポップコーンセット (塩/M)", price: 400, category: "food" }
        ]
    },
    {
        storeName: "東京電力エナジーパートナー",
        date: "",
        total: 8450,
        items: [
            { name: "電気料金（当月分）", price: 8450, category: "utilities" }
        ]
    }
];

// Category metadata for styling
const categoryMeta = {
    food: { label: "食費", class: "food", color: "#F59E0B" },
    utilities: { label: "水道光熱・通信", class: "utilities", color: "#3B82F6" },
    shopping: { label: "日用品・買い物", class: "shopping", color: "#EC4899" },
    entertainment: { label: "娯楽・趣味", class: "entertainment", color: "#8B5CF6" },
    others: { label: "その他", class: "others", color: "#10B981" }
};

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

// Dashboard Elements (using class queries for elements duplicated in SPA tabs)
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
const budgetFood = document.getElementById('budgetFood');
const budgetUtilities = document.getElementById('budgetUtilities');
const budgetShopping = document.getElementById('budgetShopping');
const budgetEntertainment = document.getElementById('budgetEntertainment');
const budgetOthers = document.getElementById('budgetOthers');
const saveBudgetBtn = document.getElementById('saveBudgetBtn');
const resetBudgetFormBtn = document.getElementById('resetBudgetFormBtn');
const budgetPeriodsList = document.getElementById('budgetPeriodsList');
const budgetFormTitle = document.getElementById('budgetFormTitle');

// In-App WebRTC Camera Elements
const startCameraBtn = document.getElementById('startCameraBtn');
const cameraViewOverlay = document.getElementById('cameraViewOverlay');
const cameraVideo = document.getElementById('cameraVideo');
const closeCameraBtn = document.getElementById('closeCameraBtn');
const shutterBtn = document.getElementById('shutterBtn');
const cameraFlash = document.getElementById('cameraFlash');
const capturedThumbsContainer = document.getElementById('capturedThumbsContainer');
const processCapturedBtn = document.getElementById('processCapturedBtn');

// Initialize the Application
document.addEventListener('DOMContentLoaded', () => {
    loadApiKey();
    loadTransactions();
    loadBudgets();
    initTabNavigation();
    initMonthSelector();
    initCharts();
    updateDashboard(); // Redraws Dashboard and updates Active view
    setupEventListeners();
});

// Toast notification helper
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = message;
    toastContainer.appendChild(toast);
    
    // Slide out and remove
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

// SPA Tab Navigation Init
function initTabNavigation() {
    const tabs = document.querySelectorAll('.nav-tab');
    const panels = document.querySelectorAll('.view-panel');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.getAttribute('data-tab');
            
            // Deactivate all tabs
            tabs.forEach(t => t.classList.remove('active'));
            // Hide all panels
            panels.forEach(p => p.classList.remove('active'));
            
            // Activate target
            tab.classList.add('active');
            document.getElementById(`${targetTab}View`).classList.add('active');
            
            // Trigger specific tab update logic
            if (targetTab === 'analytics') {
                updateAnalyticsView();
            } else if (targetTab === 'budgets') {
                renderBudgetsList();
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
    
    // Bind prev button clicks (runs across both tab instances)
    prevMonthBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            currentMonth.setMonth(currentMonth.getMonth() - 1);
            activeFilterDate = null;
            updateMonthLabel();
            
            // Re-render currently active view
            const activeTab = document.querySelector('.nav-tab.active').getAttribute('data-tab');
            if (activeTab === 'analytics') {
                updateAnalyticsView();
            } else {
                updateDashboard();
            }
        });
    });
    
    // Bind next button clicks
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

function getYearMonthString(dateObj) {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    return `${year}_${month}`;
}

// Load Budgets list from Storage
function loadBudgets() {
    const saved = localStorage.getItem('receipt_budgets');
    if (saved) {
        try {
            budgets = JSON.parse(saved);
        } catch (e) {
            console.error('Failed to parse budgets:', e);
            budgets = [];
        }
    } else {
        // Fallback default budget period
        const today = new Date();
        const start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        const end = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
        budgets = [{
            id: 'default-budget-id',
            startDate: start,
            endDate: end,
            categories: { food: 25000, utilities: 10000, shopping: 10000, entertainment: 3000, others: 2000 }
        }];
        localStorage.setItem('receipt_budgets', JSON.stringify(budgets));
    }
}

// Save Budget Period Config
function saveBudgetPeriod() {
    const start = budgetStartDate.value;
    const end = budgetEndDate.value;
    
    if (!start || !end) {
        showToast('開始日と終了日を選択してください。', 'error');
        return;
    }
    
    if (start > end) {
        showToast('開始日は終了日以前の日付を入力してください。', 'error');
        return;
    }

    const categories = {
        food: parseInt(budgetFood.value) || 0,
        utilities: parseInt(budgetUtilities.value) || 0,
        shopping: parseInt(budgetShopping.value) || 0,
        entertainment: parseInt(budgetEntertainment.value) || 0,
        others: parseInt(budgetOthers.value) || 0
    };

    if (editingBudgetPeriodId) {
        // Edit Mode: Update
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
        // Create Mode: Add
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
    budgetFood.value = 0;
    budgetUtilities.value = 0;
    budgetShopping.value = 0;
    budgetEntertainment.value = 0;
    budgetOthers.value = 0;
    editingBudgetPeriodId = null;
    budgetFormTitle.innerHTML = `<i data-lucide="plus-circle" style="color: var(--accent);"></i> 予算期間の新規作成`;
}

function editBudgetPeriod(id) {
    const b = budgets.find(x => x.id === id);
    if (!b) return;

    editingBudgetPeriodId = id;
    budgetStartDate.value = b.startDate;
    budgetEndDate.value = b.endDate;
    budgetFood.value = b.categories.food || 0;
    budgetUtilities.value = b.categories.utilities || 0;
    budgetShopping.value = b.categories.shopping || 0;
    budgetEntertainment.value = b.categories.entertainment || 0;
    budgetOthers.value = b.categories.others || 0;
    
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

// Render list of saved budgets under "予算設定" tab
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
        const card = document.createElement('div');
        card.className = 'glass-panel budget-period-card';
        card.innerHTML = `
            <div class="budget-period-header">
                <div class="budget-period-dates">
                    <i data-lucide="calendar-range" style="color: var(--primary); width:18px;"></i>
                    <span>${b.startDate} 〜 ${b.endDate}</span>
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
                <div class="budget-cat-pill">
                    <span class="budget-cat-label">食費</span>
                    <span class="budget-cat-amount">¥${(b.categories.food || 0).toLocaleString()}</span>
                </div>
                <div class="budget-cat-pill">
                    <span class="budget-cat-label">光熱・通信</span>
                    <span class="budget-cat-amount">¥${(b.categories.utilities || 0).toLocaleString()}</span>
                </div>
                <div class="budget-cat-pill">
                    <span class="budget-cat-label">日用品</span>
                    <span class="budget-cat-amount">¥${(b.categories.shopping || 0).toLocaleString()}</span>
                </div>
                <div class="budget-cat-pill">
                    <span class="budget-cat-label">娯楽</span>
                    <span class="budget-cat-amount">¥${(b.categories.entertainment || 0).toLocaleString()}</span>
                </div>
                <div class="budget-cat-pill">
                    <span class="budget-cat-label">その他</span>
                    <span class="budget-cat-amount">¥${(b.categories.others || 0).toLocaleString()}</span>
                </div>
            </div>
        `;
        budgetPeriodsList.appendChild(card);
    });

    // Event bindings
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
    return { food: 0, utilities: 0, shopping: 0, entertainment: 0, others: 0 };
}

// Event Listeners Setup
function setupEventListeners() {
    // Open/Close settings modal
    openSettingsBtn.addEventListener('click', openModal);
    closeSettingsBtn.addEventListener('click', closeModal);
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) closeModal();
    });
    
    saveApiKeyBtn.addEventListener('click', saveApiKey);
    clearApiKeyBtn.addEventListener('click', clearApiKey);

    // CSV export trigger
    document.getElementById('exportCsvBtn').addEventListener('click', exportToCsv);

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

    // Continuous In-App Camera Triggers
    startCameraBtn.addEventListener('click', startContinuousCamera);
    closeCameraBtn.addEventListener('click', stopContinuousCamera);
    shutterBtn.addEventListener('click', captureSnapshot);
    processCapturedBtn.addEventListener('click', submitCapturedImages);
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
            facingMode: { ideal: "environment" }, // Request back camera first
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

    // Trigger white flash animation
    cameraFlash.classList.add('flash-active');
    setTimeout(() => cameraFlash.classList.remove('flash-active'), 250);

    const canvas = document.createElement('canvas');
    // Ensure canvas dimensions match actual video resolution
    const width = cameraVideo.videoWidth || 640;
    const height = cameraVideo.videoHeight || 480;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    
    // Draw mirrored or standard depending on front/back camera (mostly standard environment)
    ctx.drawImage(cameraVideo, 0, 0, width, height);

    // Get Base64 image
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    capturedImages.push(dataUrl);

    // Play feedback toast
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

    // Auto scroll thumbnails container to the right
    capturedThumbsContainer.scrollLeft = capturedThumbsContainer.scrollWidth;

    // Manage scan start button
    const count = capturedImages.length;
    processCapturedBtn.innerHTML = `<i data-lucide="check"></i> 完了 (${count}枚スキャン)`;
    processCapturedBtn.disabled = count === 0;
    lucide.createIcons();
}

async function submitCapturedImages() {
    if (capturedImages.length === 0) return;

    const imagesToProcess = [...capturedImages];
    stopContinuousCamera(); // Close camera view

    if (imagesToProcess.length === 1) {
        // Process Single Image (Shows scanner visualization and loads editor)
        const base64Data = imagesToProcess[0].split(',')[1];
        scannedImage.src = imagesToProcess[0];
        
        dropzone.style.display = 'none';
        scannerContainer.style.display = 'flex';
        scannerContainer.classList.add('scanning');
        editorPanel.style.display = 'none';
        editingTransactionId = null;

        performScan(base64Data, 'image/jpeg');
    } else {
        // Process Bulk Images in Background (Progress Bar)
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

// -----------------------------------------------------------

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
        // Bulk Upload Flow (automatic processing in background)
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
Categories must be exactly one of: 'food', 'utilities', 'shopping', 'entertainment', or 'others'.

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
                                            category: { type: "STRING", enum: ["food", "utilities", "shopping", "entertainment", "others"] }
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
Categories must be exactly one of: 'food' (for groceries/restaurant/cafe/drinks), 'utilities' (electric/gas/water/internet/phone), 'shopping' (clothing/daily items/toiletries/electronics/books), 'entertainment' (movies/games/hobby/leisure/events), or 'others' (default).

Output JSON structure:
{
  "storeName": "Store Name Here",
  "date": "YYYY-MM-DD",
  "total": 1280,
  "items": [
    { "name": "Item Name 1", "price": 500, "category": "food" | "utilities" | "shopping" | "entertainment" | "others" },
    { "name": "Item Name 2", "price": 780, "category": "food" | "utilities" | "shopping" | "entertainment" | "others" }
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
                                            category: { type: "STRING", enum: ["food", "utilities", "shopping", "entertainment", "others"] }
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
        addReceiptItem('商品・サービス合計', data.total || 0, 'others');
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
        showToast('店舗名を入力してください。', 'error');
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

// Load transaction history from localStorage
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
            console.error('Failed to parse transactions:', e);
            transactions = [];
        }
    }
}

// Update Dashboard View Tab
function updateDashboard() {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth(); // 0-11
    
    const monthlyTxns = transactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate.getFullYear() === year && tDate.getMonth() === month;
    });

    const receiptCount = monthlyTxns.length;
    receiptCountVals.forEach(v => v.innerText = `${receiptCount} 件`);
    
    const monthlyTotalSum = monthlyTxns.reduce((acc, curr) => acc + curr.total, 0);
    totalExpensesVals.forEach(v => v.innerText = `¥${monthlyTotalSum.toLocaleString()}`);
    
    const activeBudgetCats = getActiveBudgetForMonth(currentMonth);
    const overallBudget = Object.values(activeBudgetCats).reduce((acc, curr) => acc + curr, 0);
    
    updateOverallBudgetBars(monthlyTotalSum, overallBudget);
    renderCalendarGrid(monthlyTxns);

    let filteredHistoryTxns = monthlyTxns;
    if (activeFilterDate) {
        filteredHistoryTxns = monthlyTxns.filter(t => t.date === activeFilterDate);
        filterActiveBadge.style.display = 'inline-block';
        filterActiveBadge.innerText = `${activeFilterDate.split('-')[2]}日のフィルタ中`;
    } else {
        filterActiveBadge.style.display = 'none';
    }

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
                    <button class="btn btn-icon edit-txn-btn" data-id="${t.id}" title="編集" style="color: var(--text-muted);">
                        <i data-lucide="edit-2" style="width: 15px; height: 15px;"></i>
                    </button>
                    <button class="btn btn-icon delete-txn-btn" data-id="${t.id}" title="削除" style="color: var(--text-muted);">
                        <i data-lucide="trash-2" style="width: 15px; height: 15px;"></i>
                    </button>
                </div>
            `;
            historyList.appendChild(historyItem);
        });
        
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
            label.innerText = "予算期間を設定してください";
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

// Update the Detail Analytics page
function updateAnalyticsView() {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();
    
    const monthlyTxns = transactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate.getFullYear() === year && tDate.getMonth() === month;
    });

    const dailySpend = Array(lastDay).fill(0);
    monthlyTxns.forEach(t => {
        const dateObj = new Date(t.date);
        const dateIndex = dateObj.getDate() - 1; // 0-indexed day
        if (dateIndex >= 0 && dateIndex < lastDay) {
            dailySpend[dateIndex] += t.total;
        }
    });

    const labels = Array.from({ length: lastDay }, (_, i) => `${i + 1}日`);
    
    if (dailyTrendChart) {
        dailyTrendChart.data.labels = labels;
        dailyTrendChart.data.datasets[0].data = dailySpend;
        dailyTrendChart.update();
    } else {
        const ctx = document.getElementById('dailyTrendChart').getContext('2d');
        dailyTrendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: '支出推移',
                    data: dailySpend,
                    borderColor: '#6366F1',
                    backgroundColor: 'rgba(99, 102, 241, 0.15)',
                    fill: true,
                    tension: 0.3,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        ticks: { color: '#9CA3AF' },
                        grid: { color: 'rgba(255,255,255,0.05)' }
                    },
                    x: {
                        ticks: { color: '#9CA3AF', maxRotation: 0 },
                        grid: { display: false }
                    }
                }
            }
        });
    }

    const activeBudgetCats = getActiveBudgetForMonth(currentMonth);
    const catSpends = { food: 0, utilities: 0, shopping: 0, entertainment: 0, others: 0 };
    
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

    const allItems = [];
    monthlyTxns.forEach(t => {
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
    const top5 = allItems.slice(0, 5);

    const rankingContainer = document.getElementById('topExpensiveItemsList');
    rankingContainer.innerHTML = '';
    
    if (top5.length === 0) {
        rankingContainer.innerHTML = `<p style="text-align:center; padding: 20px; color: var(--text-muted);">データがありません。</p>`;
    } else {
        top5.forEach((item, index) => {
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

    updateCategoryCharts(monthlyTxns);
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
                    data: [0, 0, 0, 0, 0],
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
                            font: { family: 'Plus Jakarta Sans', size: 10 },
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
    
    const catSums = { food: 0, utilities: 0, shopping: 0, entertainment: 0, others: 0 };
    
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
    
    const dataset = [
        catSums.food,
        catSums.utilities,
        catSums.shopping,
        catSums.entertainment,
        catSums.others
    ];
    
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
