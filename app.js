// App State Management
let transactions = [];
let categoryChart = null;
let currentScannedData = null;
let editingTransactionId = null; // Holds the ID of the transaction being edited (if any)
let currentMonth = new Date(); // Tracks the currently selected month/year for display
let activeFilterDate = null; // Tracks calendar click filter (e.g. "2026-05-30")

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
            { name: "しっとりバームクーヘン", price: 150, category: "shopping" } // Different category item
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
            { name: "ポップコーンセット (塩/M)", price: 400, category: "food" } // Different category item
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

// Dashboard Elements
const currentMonthYearLabel = document.getElementById('currentMonthYearLabel');
const prevMonthBtn = document.getElementById('prevMonthBtn');
const nextMonthBtn = document.getElementById('nextMonthBtn');
const monthlyBudgetInput = document.getElementById('monthlyBudgetInput');
const budgetPercentLabel = document.getElementById('budgetPercentLabel');
const budgetRemainingLabel = document.getElementById('budgetRemainingLabel');
const budgetProgressBar = document.getElementById('budgetProgressBar');

const totalExpensesVal = document.getElementById('totalExpensesVal');
const receiptCountVal = document.getElementById('receiptCountVal');
const calendarGrid = document.getElementById('calendarGrid');
const historyList = document.getElementById('historyList');
const historyEmptyState = document.getElementById('historyEmptyState');
const filterActiveBadge = document.getElementById('filterActiveBadge');

const openSettingsBtn = document.getElementById('openSettingsBtn');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const settingsModal = document.getElementById('settingsModal');
const apiKeyInput = document.getElementById('apiKeyInput');
const saveApiKeyBtn = document.getElementById('saveApiKeyBtn');
const clearApiKeyBtn = document.getElementById('clearApiKeyBtn');
const apiKeyStatus = document.getElementById('apiKeyStatus');
const toastContainer = document.getElementById('toastContainer');

// Initialize the Application
document.addEventListener('DOMContentLoaded', () => {
    loadApiKey();
    loadTransactions();
    initMonthSelector();
    initChart();
    updateDashboard(); // Will also build calendar
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

// Month Selector Initialization
function initMonthSelector() {
    // Set to current month/year
    updateMonthLabel();
    loadBudgetForCurrentMonth();
    
    prevMonthBtn.addEventListener('click', () => {
        currentMonth.setMonth(currentMonth.getMonth() - 1);
        activeFilterDate = null; // Clear day filter on month change
        updateMonthLabel();
        loadBudgetForCurrentMonth();
        updateDashboard();
    });
    
    nextMonthBtn.addEventListener('click', () => {
        currentMonth.setMonth(currentMonth.getMonth() + 1);
        activeFilterDate = null;
        updateMonthLabel();
        loadBudgetForCurrentMonth();
        updateDashboard();
    });

    monthlyBudgetInput.addEventListener('change', () => {
        const budgetVal = parseInt(monthlyBudgetInput.value) || 0;
        const key = `budget_${getYearMonthString(currentMonth)}`;
        localStorage.setItem(key, budgetVal);
        updateDashboard();
    });
}

function updateMonthLabel() {
    const year = currentMonth.getFullYear();
    const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
    currentMonthYearLabel.innerText = `${year}年${month}月`;
}

function getYearMonthString(dateObj) {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    return `${year}_${month}`;
}

function loadBudgetForCurrentMonth() {
    const key = `budget_${getYearMonthString(currentMonth)}`;
    const savedBudget = localStorage.getItem(key);
    if (savedBudget) {
        monthlyBudgetInput.value = savedBudget;
    } else {
        monthlyBudgetInput.value = 50000; // Default budget: 50,000 yen
        localStorage.setItem(key, 50000);
    }
}

// Event Listeners Setup
function setupEventListeners() {
    // Open/Close Modal
    openSettingsBtn.addEventListener('click', openModal);
    closeSettingsBtn.addEventListener('click', closeModal);
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) closeModal();
    });
    
    saveApiKeyBtn.addEventListener('click', saveApiKey);
    clearApiKeyBtn.addEventListener('click', clearApiKey);

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

    // CSV Export
    document.getElementById('exportCsvBtn').addEventListener('click', exportToCsv);
}

// File Selection Handler (Support Multiple)
function handleFileSelect(e) {
    if (e.target.files.length > 0) {
        processFiles(e.target.files);
    }
}

// Process Multiple Image files
async function processFiles(files) {
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
        showToast('画像ファイルを選択してください。', 'error');
        return;
    }

    if (imageFiles.length === 1) {
        // Single File Flow (shows scanner visual + interactive editor)
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
                    // Auto save to database
                    const newTransaction = {
                        id: (Date.now() + i).toString(), // Add index to ensure unique IDs if processed rapidly
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
            
            // Update progress bar
            const percent = ((i + 1) / imageFiles.length) * 100;
            bulkProgressBar.style.width = `${percent}%`;
        }
        
        // Save to localStorage
        localStorage.setItem('receipt_transactions', JSON.stringify(transactions));
        
        // Hide progress, show stats
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
        // Wait 1.5 seconds in background for mock effect
        await new Promise(r => setTimeout(r, 1500));
        return getMockReceiptResult();
    }
}

// Return a randomized mock receipt result
function getMockReceiptResult() {
    const randomIndex = Math.floor(Math.random() * mockReceipts.length);
    const selectedMock = JSON.parse(JSON.stringify(mockReceipts[randomIndex]));
    
    // Set realistic date near today
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

// Simulates API processing (Single Flow)
function runMockScan() {
    setTimeout(() => {
        const selectedMock = getMockReceiptResult();
        populateEditor(selectedMock);
        showToast('デモレシートのスキャンが完了しました！', 'success');
    }, 2500);
}

// Populate UI form editor with scanned/selected data
function populateEditor(data) {
    currentScannedData = data;
    
    // Stop scanning animation
    scannerContainer.classList.remove('scanning');
    
    // Set title based on mode
    if (editingTransactionId) {
        editorTitle.innerHTML = `<i data-lucide="edit-3" style="color: var(--primary)"></i> 取引データの編集`;
    } else {
        editorTitle.innerHTML = `<i data-lucide="edit-3" style="color: var(--primary)"></i> 解析結果の確認・編集`;
    }
    
    // Populate form fields
    receiptStore.value = data.storeName || '';
    receiptDate.value = data.date || new Date().toISOString().split('T')[0];
    receiptTotal.value = data.total || 0;
    
    // Populate items list
    itemsList.innerHTML = '';
    if (data.items && data.items.length > 0) {
        data.items.forEach(item => {
            addReceiptItem(item.name, item.price, item.category || 'others');
        });
    } else {
        addReceiptItem('商品・サービス合計', data.total || 0, 'others');
    }
    
    // Display Editor panel
    editorPanel.style.display = 'block';
    editorPanel.scrollIntoView({ behavior: 'smooth' });
    lucide.createIcons();
}

// Add row to items list in editor (With per-item Category)
function addReceiptItem(name = '', price = 0, category = 'food') {
    const itemRow = document.createElement('div');
    itemRow.className = 'item-row';
    
    // Construct options list for category select
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
    
    // Attach event listeners for price calculation
    const priceInput = itemRow.querySelector('.item-price');
    priceInput.addEventListener('input', calculateTotalFromItems);
    
    const deleteBtn = itemRow.querySelector('.delete-item-btn');
    deleteBtn.addEventListener('click', () => {
        itemRow.remove();
        calculateTotalFromItems();
    });
}

// Calculate sum of item prices and set total
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
    
    // Populate form using helper
    populateEditor(txn);
    
    // Hide upload zone & show image container (without scanner line)
    dropzone.style.display = 'none';
    scannerContainer.style.display = 'none'; // Keep image hidden when editing text
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

    // Capture items with categories
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
        // Edit Mode: Update existing
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
        // Create Mode: Add new
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
    
    // Reset state & Refresh dashboard
    resetScannerState();
    updateDashboard();
}

// Delete a transaction from local storage
function deleteTransaction(id) {
    transactions = transactions.filter(t => t.id !== id);
    localStorage.setItem('receipt_transactions', JSON.stringify(transactions));
    showToast('データを削除しました。', 'info');
    
    // Clear DAY filter if the deleted transaction was the last one on that day
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
            
            // DATA MIGRATION: Convert old transactions format (transaction-level category) to new format (item-level category)
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
            // Resave migrated data
            localStorage.setItem('receipt_transactions', JSON.stringify(transactions));
            
        } catch (e) {
            console.error('Failed to parse transactions:', e);
            transactions = [];
        }
    }
}

// Update the dashboard statistics and history view
function updateDashboard() {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth(); // 0-11
    
    // Filter transactions to the currently selected month
    const monthlyTxns = transactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate.getFullYear() === year && tDate.getMonth() === month;
    });

    // 1. Update Stats Summaries for the Current Month
    const receiptCount = monthlyTxns.length;
    receiptCountVal.innerText = `${receiptCount} 件`;
    
    const monthlyTotalSum = monthlyTxns.reduce((acc, curr) => acc + curr.total, 0);
    totalExpensesVal.innerText = `¥${monthlyTotalSum.toLocaleString()}`;
    
    // Update Budget progress bar
    updateBudgetProgressBar(monthlyTotalSum);
    
    // 2. Render Calendar Grid
    renderCalendarGrid(monthlyTxns);

    // 3. Filter history by Selected Month (and Day filter if active)
    let filteredHistoryTxns = monthlyTxns;
    if (activeFilterDate) {
        filteredHistoryTxns = monthlyTxns.filter(t => t.date === activeFilterDate);
        filterActiveBadge.style.display = 'inline-block';
        filterActiveBadge.innerText = `${activeFilterDate.split('-')[2]}日のフィルタ中`;
    } else {
        filterActiveBadge.style.display = 'none';
    }

    // 4. Render History List
    if (filteredHistoryTxns.length === 0) {
        historyEmptyState.style.display = 'flex';
        // Remove old list items
        const items = historyList.querySelectorAll('.history-item');
        items.forEach(el => el.remove());
    } else {
        historyEmptyState.style.display = 'none';
        
        // Remove old history elements
        const oldItems = historyList.querySelectorAll('.history-item');
        oldItems.forEach(el => el.remove());
        
        filteredHistoryTxns.forEach(t => {
            // Find categories present in this transaction to display as list badges
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
        
        // Attach delete event listeners
        const deleteTxnBtns = historyList.querySelectorAll('.delete-txn-btn');
        deleteTxnBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.getAttribute('data-id');
                if (confirm('この取引データを家計簿から削除しますか？')) {
                    deleteTransaction(id);
                }
            });
        });

        // Attach edit event listeners
        const editTxnBtns = historyList.querySelectorAll('.edit-txn-btn');
        editTxnBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.getAttribute('data-id');
                editTransaction(id);
            });
        });
        
        lucide.createIcons();
    }
    
    // 5. Update Chart (uses item-level categories for active month)
    updateChartData(monthlyTxns);
}

// Update Budget Progress visual UI
function updateBudgetProgressBar(monthlyTotalSum) {
    const key = `budget_${getYearMonthString(currentMonth)}`;
    const budget = parseInt(localStorage.getItem(key)) || 50000;
    
    const remaining = budget - monthlyTotalSum;
    const percent = budget > 0 ? (monthlyTotalSum / budget) * 100 : 0;
    
    budgetPercentLabel.innerText = `消化率: ${Math.round(percent)}% (¥${monthlyTotalSum.toLocaleString()} / ¥${budget.toLocaleString()})`;
    
    if (remaining >= 0) {
        budgetRemainingLabel.innerText = `残高: ¥${remaining.toLocaleString()}`;
        budgetRemainingLabel.style.color = 'var(--text-muted)';
    } else {
        budgetRemainingLabel.innerText = `予算超過: ¥${Math.abs(remaining).toLocaleString()}`;
        budgetRemainingLabel.style.color = 'var(--danger)';
    }
    
    budgetProgressBar.style.width = `${Math.min(100, percent)}%`;
    
    // Add warning color if budget is exceeded
    if (percent > 100) {
        budgetProgressBar.classList.add('over-budget');
    } else {
        budgetProgressBar.classList.remove('over-budget');
    }
}

// Dynamically generate calendar grid cells
function renderCalendarGrid(monthlyTxns) {
    calendarGrid.innerHTML = '';
    
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // First day of currentMonth
    const firstDay = new Date(year, month, 1);
    const startOffset = firstDay.getDay(); // 0 is Sunday, 6 is Saturday
    
    // Total days in currentMonth
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    // Map transactions to dates: "YYYY-MM-DD" -> totalSpent
    const spendMap = {};
    monthlyTxns.forEach(t => {
        const dateStr = t.date; // YYYY-MM-DD
        spendMap[dateStr] = (spendMap[dateStr] || 0) + t.total;
    });

    // Add empty padding cells for starting offset days
    for (let i = 0; i < startOffset; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'calendar-day empty';
        calendarGrid.appendChild(emptyCell);
    }
    
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Render actual day cells
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
            // Alert color if spent on a single day is very high (e.g. > 10,000 yen)
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
        
        // Click event to filter dashboard list by day
        dayCell.addEventListener('click', () => {
            if (spent === 0 && !isFiltered) {
                // Ignore click on empty spent days unless we are clearing filter
                return;
            }
            
            if (activeFilterDate === dateStr) {
                activeFilterDate = null; // Clear filter
            } else {
                activeFilterDate = dateStr; // Apply filter
            }
            updateDashboard();
        });
        
        calendarGrid.appendChild(dayCell);
    }
}

// Chart.js initialization
function initChart() {
    const ctx = document.getElementById('categoryChart').getContext('2d');
    
    categoryChart = new Chart(ctx, {
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
                        font: {
                            family: 'Plus Jakarta Sans',
                            size: 11
                        },
                        boxWidth: 12
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
}

// Re-calculate category totals (aggregating each item's price) and redraw chart
function updateChartData(monthlyTxns = []) {
    if (!categoryChart) return;
    
    const catSums = {
        food: 0,
        utilities: 0,
        shopping: 0,
        entertainment: 0,
        others: 0
    };
    
    // Accumulate each individual item's price into its respective category
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
            // Fallback for itemless transaction
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
    
    if (!hasData) {
        categoryChart.data.datasets[0].data = [1];
        categoryChart.data.datasets[0].backgroundColor = ['#1F2937'];
        categoryChart.data.labels = ['データなし'];
    } else {
        categoryChart.data.datasets[0].data = dataset;
        categoryChart.data.datasets[0].backgroundColor = Object.values(categoryMeta).map(m => m.color);
        categoryChart.data.labels = Object.values(categoryMeta).map(m => m.label);
    }
    
    categoryChart.update();
}

// Export budget data as CSV
function exportToCsv() {
    if (transactions.length === 0) {
        showToast('エクスポートするデータがありません。', 'error');
        return;
    }

    // CSV Headers (With UTF-8 BOM for Japanese Excel compatibility)
    let csvContent = "\uFEFF";
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

    // Create downloadable link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    
    // File name: receipt_data_YYYY_MM_DD.csv
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '_');
    link.setAttribute("download", `receipt_data_${dateStr}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('CSVデータを出力しました！', 'success');
}

