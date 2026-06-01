/* ============================================================
   SmartReceipt — Client-side SPA Application Logic
   ============================================================ */

// 1. Constants & Meta Config
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
    medical: { label: '健康・医療費', class: 'medical', color: '#F43F5E' },
    education: { label: '教育', class: 'education', color: '#A855F7' },
    transport: { label: '交通費', class: 'transport', color: '#3B82F6' },
    social: { label: '交際費', class: 'social', color: '#EC4899' },
    entertainment: { label: '娯楽・趣味', class: 'entertainment', color: '#8B5CF6' },
    special: { label: '特別費', class: 'special', color: '#D97706' },
    others: { label: 'その他', class: 'others', color: '#6B7280' }
};

// Mock data list for fallback / demo mode
const mockReceipts = [
    { storeName: 'セブンイレブン 渋谷中央店', total: 1120, items: [{name: '炭火焼鳥おにぎり', price: 160, category: 'food'}, {name: 'ツナマヨサンドイッチ', price: 340, category: 'food'}, {name: 'のむヨーグルト', price: 180, category: 'food'}, {name: 'アルカリ乾電池 単3', price: 440, category: 'shopping'}] },
    { storeName: 'イオンモール 幕張新都心', total: 4720, items: [{name: '綿100%Tシャツ', price: 1980, category: 'clothing'}, {name: '抗菌洗濯洗剤ボトル', price: 320, category: 'shopping'}, {name: 'BOXティッシュ 5箱', price: 450, category: 'shopping'}, {name: 'こだわりヨーグルト 4個パック', price: 280, category: 'food'}, {name: 'USB Type-C急速充電器', price: 1690, category: 'furniture'}] },
    { storeName: 'スターバックス 新宿サザンテラス', total: 1610, items: [{name: 'スターバックスラテ Tall', price: 490, category: 'dining'}, {name: 'チョコレートスコーン', price: 340, category: 'dining'}, {name: 'ドリップコーヒー Grande', price: 435, category: 'dining'}, {name: 'バタースコッチドーナツ', price: 345, category: 'dining'}] },
    { storeName: 'マツモトキヨシ 池袋東口店', total: 3120, items: [{name: 'マルチビタミン 60日分', price: 1980, category: 'medical'}, {name: '保湿リップクリーム', price: 440, category: 'shopping'}, {name: '除菌ウェットティッシュ 3個組', price: 700, category: 'shopping'}] },
    { storeName: 'ヤオコー スーパーマーケット', total: 2450, items: [{name: '国産鶏むね肉 600g', price: 580, category: 'food'}, {name: '長野県産コシヒカリ 2kg', price: 1280, category: 'food'}, {name: '有機牛乳 1000ml', price: 290, category: 'food'}, {name: 'アサヒ スーパードライ 350ml', price: 300, category: 'luxuries'}] }
];

// 2. Global State Variables
let transactions = [];
let budgets = [];
let recurringExpenses = [];
let categoryDoughnutCharts = [];
let trendChartInstance = null;
let budgetTrendChartInstance = null;

function getJSTCurrentDate() {
    const now = new Date();
    try {
        const formatter = new Intl.DateTimeFormat("ja-JP", {
            timeZone: "Asia/Tokyo",
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        });
        const parts = formatter.formatToParts(now);
        const year = parseInt(parts.find(p => p.type === 'year').value);
        const month = parseInt(parts.find(p => p.type === 'month').value);
        const day = parseInt(parts.find(p => p.type === 'day').value);
        return new Date(year, month - 1, day);
    } catch (e) {
        return new Date();
    }
}
let currentMonth = getJSTCurrentDate();
let activeFilterDate = null;
let analyticsPeriod = 'month'; // 'month' | 'quarter' | 'year'

let cameraStream = null;
let capturedImages = [];
let apiKey = '';

// Active state for editing
let editingTransactionId = null;
let editingBudgetPeriodId = null;
let editingRecurringId = null;

// Category details popup state
let currentCategoryItems = [];
let currentCategoryKey = '';

// Helpers
const el = (id) => document.getElementById(id);
const qsa = (sel) => document.querySelectorAll(sel);
const qs = (sel) => document.querySelector(sel);

// 3. Application Lifecycle
document.addEventListener('DOMContentLoaded', () => {
    try {
        loadSettings();
        loadData();
        
        // Render dynamic selections and components
        buildBudgetCategorySelect();
        buildRecurringCategorySelect();
        
        initTabNavigation();
        initMonthSelector();
        initCharts();
        initSwipeNavigation();
        
        setupEventListeners();
        
        // Render initial view
        updateDashboard();
        
        // 予算推移の開始年月インプットの初期値を設定
        const trendStartInput = el('budgetTrendStartMonth');
        if (trendStartInput) {
            const y = currentMonth.getFullYear();
            const m = String(currentMonth.getMonth() + 1).padStart(2, '0');
            trendStartInput.value = `${y}-${m}`;
        }
        updateBudgetTrendChart();
        
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    } catch (e) {
        console.error("SmartReceipt initialization error: ", e);
        showToast("初期化中にエラーが発生しました。リロードしてください。", "error");
    }
});

// 4. Data Storage Access
function loadSettings() {
    apiKey = localStorage.getItem('gemini_api_key') || '';
    if (el('apiKeyInput')) el('apiKeyInput').value = apiKey;
    updateApiKeyStatus();
    
    // Load theme setting
    const currentTheme = localStorage.getItem('smartreceipt_theme') || 'dark';
    applyTheme(currentTheme);
}

// Theme Helper Functions
function applyTheme(theme) {
    const body = document.body;
    const btn = el('themeToggleBtn');
    if (theme === 'light') {
        body.classList.add('light-mode');
        if (btn) {
            btn.innerHTML = '<i data-lucide="moon"></i>';
            btn.title = 'ダークモードに切り替え';
        }
    } else {
        body.classList.remove('light-mode');
        if (btn) {
            btn.innerHTML = '<i data-lucide="sun"></i>';
            btn.title = 'ライトモードに切り替え';
        }
    }
    localStorage.setItem('smartreceipt_theme', theme);
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    // Update active chart colors
    updateChartThemeColors(theme);
}

function getChartTextColor() {
    const theme = localStorage.getItem('smartreceipt_theme') || 'dark';
    return theme === 'light' ? '#64748B' : '#9CA3AF';
}

function getChartGridColor() {
    const theme = localStorage.getItem('smartreceipt_theme') || 'dark';
    return theme === 'light' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.03)';
}

function updateChartThemeColors(theme) {
    const isLight = theme === 'light';
    const gridColor = isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.03)';
    const textColor = isLight ? '#64748B' : '#9CA3AF';

    const updateScales = (chart) => {
        if (!chart || !chart.options || !chart.options.scales) return;
        if (chart.options.scales.x) {
            if (!chart.options.scales.x.grid) chart.options.scales.x.grid = {};
            chart.options.scales.x.grid.color = gridColor;
            if (!chart.options.scales.x.ticks) chart.options.scales.x.ticks = {};
            chart.options.scales.x.ticks.color = textColor;
        }
        if (chart.options.scales.y) {
            if (!chart.options.scales.y.grid) chart.options.scales.y.grid = {};
            chart.options.scales.y.grid.color = gridColor;
            if (!chart.options.scales.y.ticks) chart.options.scales.y.ticks = {};
            chart.options.scales.y.ticks.color = textColor;
        }
    };

    const updateDoughnut = (chart) => {
        if (!chart || !chart.options || !chart.options.plugins) return;
        if (chart.options.plugins.legend && chart.options.plugins.legend.labels) {
            chart.options.plugins.legend.labels.color = textColor;
        }
    };

    if (typeof categoryDoughnutCharts !== 'undefined' && categoryDoughnutCharts) {
        categoryDoughnutCharts.forEach(chart => {
            updateDoughnut(chart);
            chart.update();
        });
    }

    if (typeof trendChartInstance !== 'undefined' && trendChartInstance) {
        updateScales(trendChartInstance);
        trendChartInstance.update();
    }

    if (typeof budgetTrendChartInstance !== 'undefined' && budgetTrendChartInstance) {
        updateScales(budgetTrendChartInstance);
        if (budgetTrendChartInstance.options.plugins.legend && budgetTrendChartInstance.options.plugins.legend.labels) {
            budgetTrendChartInstance.options.plugins.legend.labels.color = textColor;
        }
        budgetTrendChartInstance.update();
    }
}

// Category Detail Popup Helpers
function getTransactionsForCurrentScope() {
    const activeTab = qs('.nav-tab.active') ? qs('.nav-tab.active').getAttribute('data-tab') : 'dashboard';
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth() + 1;
    
    if (activeTab === 'dashboard') {
        // Dashboard is always monthly
        return getMonthlyResolvedTransactions(year, month);
    } else if (activeTab === 'analytics') {
        // Analytics period
        if (analyticsPeriod === 'month') {
            return getMonthlyResolvedTransactions(year, month);
        } else if (analyticsPeriod === 'quarter') {
            const quarterIndex = Math.ceil(month / 3);
            const startMonthOfQuarter = (quarterIndex - 1) * 3 + 1;
            let quarterTxns = [];
            for (let m = 0; m < 3; m++) {
                quarterTxns = quarterTxns.concat(getMonthlyResolvedTransactions(year, startMonthOfQuarter + m));
            }
            return quarterTxns;
        } else if (analyticsPeriod === 'year') {
            let yearTxns = [];
            for (let m = 1; m <= 12; m++) {
                yearTxns = yearTxns.concat(getMonthlyResolvedTransactions(year, m));
            }
            return yearTxns;
        }
    }
    // Fallback
    return getMonthlyResolvedTransactions(year, month);
}

function showCategoryItems(categoryKey) {
    currentCategoryKey = categoryKey;
    const txns = getTransactionsForCurrentScope();
    
    currentCategoryItems = [];
    txns.forEach(t => {
        const items = t.items || [];
        items.forEach(i => {
            const cat = i.category || 'others';
            if (cat === categoryKey) {
                currentCategoryItems.push({
                    name: i.name,
                    price: i.price,
                    date: t.date,
                    store: t.storeName,
                    category: cat,
                    txnId: t.id
                });
            }
        });
    });
    
    // Reset sort selector to date-desc initially
    if (el('categoryItemsSort')) {
        el('categoryItemsSort').value = 'date-desc';
    }
    
    // Sort and render
    renderCategoryItems();
    
    // Open the modal
    openModal('categoryItemsModal');
}

function renderCategoryItems() {
    const listEl = el('categoryItemsList');
    if (!listEl) return;
    
    listEl.innerHTML = '';
    
    // Determine sort option
    const sortVal = el('categoryItemsSort') ? el('categoryItemsSort').value : 'date-desc';
    
    const sorted = [...currentCategoryItems];
    if (sortVal === 'date-desc') {
        sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else if (sortVal === 'date-asc') {
        sorted.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (sortVal === 'amount-desc') {
        sorted.sort((a, b) => b.price - a.price);
    } else if (sortVal === 'amount-asc') {
        sorted.sort((a, b) => a.price - b.price);
    }
    
    // Set title and period label
    const meta = categoryMeta[currentCategoryKey] || categoryMeta.others;
    if (el('categoryItemsTitle')) {
        el('categoryItemsTitle').innerHTML = `<span class="cat-dot" style="background-color:${meta.color}; width:12px; height:12px; display:inline-block; border-radius:50%; margin-right:8px;"></span>${meta.label} の支出内訳`;
    }
    
    if (el('categoryItemsPeriodLabel')) {
        const activeTab = qs('.nav-tab.active') ? qs('.nav-tab.active').getAttribute('data-tab') : 'dashboard';
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth() + 1;
        
        if (activeTab === 'dashboard') {
            el('categoryItemsPeriodLabel').textContent = `${year}年${month}月`;
        } else {
            if (analyticsPeriod === 'month') {
                el('categoryItemsPeriodLabel').textContent = `${year}年${month}月`;
            } else if (analyticsPeriod === 'quarter') {
                const q = Math.ceil(month / 3);
                el('categoryItemsPeriodLabel').textContent = `${year}年 Q${q}`;
            } else if (analyticsPeriod === 'year') {
                el('categoryItemsPeriodLabel').textContent = `${year}年`;
            }
        }
    }
    
    if (sorted.length === 0) {
        listEl.innerHTML = '<div class="empty-state">該当するデータはありません</div>';
        return;
    }
    
    sorted.forEach(item => {
        const div = document.createElement('div');
        div.className = 'day-item-card';
        div.style.marginBottom = '8px';
        div.style.cursor = 'pointer';
        div.title = 'クリックして編集';
        div.addEventListener('click', () => {
            closeModal('categoryItemsModal');
            window.editTransactionItem(item.txnId);
        });
        div.innerHTML = `
            <div class="day-item-header" style="display:flex; justify-content:space-between; align-items:center;">
                <div style="font-weight:700; font-size:0.9rem; color:var(--text-main);">${item.name}</div>
                <div style="font-weight:700; font-size:0.95rem; color:var(--primary);">¥${item.price.toLocaleString()}</div>
            </div>
            <div class="day-sub-item" style="display:flex; justify-content:space-between; font-size:0.78rem; color:var(--text-muted); margin-top:4px;">
                <div>${item.store}</div>
                <div>${item.date}</div>
            </div>
        `;
        listEl.appendChild(div);
    });
}


function loadData() {
    // Transactions
    const txnData = localStorage.getItem('receipt_transactions');
    transactions = txnData ? JSON.parse(txnData) : [];
    
    // Budgets
    const budgetData = localStorage.getItem('receipt_budgets');
    const loadedBudgets = budgetData ? JSON.parse(budgetData) : [];
    
    // Migrate old format to new category-specific rules if needed
    let migrated = false;
    budgets = [];
    loadedBudgets.forEach(b => {
        if (b.categories && typeof b.categories === 'object') {
            Object.entries(b.categories).forEach(([cat, amount]) => {
                if (amount > 0) {
                    budgets.push({
                        id: 'bgt-' + Date.now().toString() + '-' + Math.random().toString(36).substr(2, 4),
                        category: cat,
                        amount: amount,
                        startDate: b.startDate,
                        endDate: b.endDate
                    });
                }
            });
            migrated = true;
        } else if (b.category && b.amount) {
            budgets.push(b);
        }
    });
    if (migrated) {
        saveData('budgets');
    }
    
    // Recurring Costs
    const recurData = localStorage.getItem('receipt_recurring');
    recurringExpenses = recurData ? JSON.parse(recurData) : [];
}

function saveData(key) {
    if (key === 'transactions') {
        localStorage.setItem('receipt_transactions', JSON.stringify(transactions));
    } else if (key === 'budgets') {
        localStorage.setItem('receipt_budgets', JSON.stringify(budgets));
    } else if (key === 'recurring') {
        localStorage.setItem('receipt_recurring', JSON.stringify(recurringExpenses));
    }
}

// 5. Toast Notifications (Custom Vanilla Style)
function showToast(message, type = 'info') {
    const container = el('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let iconName = 'info';
    if (type === 'success') iconName = 'check-circle';
    if (type === 'error') iconName = 'alert-triangle';
    
    toast.innerHTML = `<i data-lucide="${iconName}"></i> <span>${message}</span>`;
    container.appendChild(toast);
    
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(40px)';
        toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// 6. API Status Display & Toggle settings
function updateApiKeyStatus() {
    const statusBadge = el('apiKeyStatus');
    if (!statusBadge) return;
    if (apiKey) {
        statusBadge.className = 'api-key-badge connected';
        statusBadge.innerHTML = '<i data-lucide="check-circle"></i> AI解析有効中';
    } else {
        statusBadge.className = 'api-key-badge disconnected';
        statusBadge.innerHTML = '<i data-lucide="info"></i> デモモード';
    }
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

function saveApiKey() {
    const inputVal = el('apiKeyInput').value.trim();
    localStorage.setItem('gemini_api_key', inputVal);
    apiKey = inputVal;
    updateApiKeyStatus();
    closeModal('settingsModal');
    showToast('APIキーを保存しました。', 'success');
}

function clearApiKey() {
    localStorage.removeItem('gemini_api_key');
    apiKey = '';
    el('apiKeyInput').value = '';
    updateApiKeyStatus();
    closeModal('settingsModal');
    showToast('APIキーを削除しました。デモモードに戻ります。', 'info');
}

// 7. Modals Control System (Active Class Only)
function openModal(modalId) {
    const modal = el(modalId);
    if (modal) modal.classList.add('active');
}

function closeModal(modalId) {
    const modal = el(modalId);
    if (modal) modal.classList.remove('active');
}

window.openModal = openModal;
window.closeModal = closeModal;
window.showCategoryItems = showCategoryItems;
window.renderCategoryItems = renderCategoryItems;

// 8. Setup Subpanel states inside Dashboard
function showDashboardSubpanel(activePanelId) {
    const panels = ['dropzone', 'scannerContainer', 'editorPanel', 'bulkProgressContainer'];
    panels.forEach(pid => {
        const panel = el(pid);
        if (panel) {
            if (pid === activePanelId) {
                panel.classList.add('active');
            } else {
                panel.classList.remove('active');
            }
        }
    });
}

// 9. SPA Tab Controller
function initTabNavigation() {
    const tabs = qsa('.nav-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            const selectedTab = e.currentTarget.getAttribute('data-tab');
            
            tabs.forEach(t => t.classList.remove('active'));
            e.currentTarget.classList.add('active');
            
            qsa('.view-panel').forEach(panel => {
                panel.classList.remove('active');
            });
            
            const targetPanel = el(`${selectedTab}View`);
            if (targetPanel) {
                targetPanel.classList.add('active');
            }
            
            // Tab change actions
            if (selectedTab === 'analytics') {
                updateAnalyticsView();
            } else if (selectedTab === 'budgets') {
                renderBudgetsList();
                renderRecurringList();
                updateBudgetTrendChart();
            } else if (selectedTab === 'dashboard') {
                updateDashboard();
            }
        });
    });
}

function initSwipeNavigation() {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;
    
    // スワイプ判定の最小横移動距離 (80px)
    const minSwipeDistance = 80;
    // 縦スクロールと誤認させないための最大縦移動距離 (60px)
    const maxSwipeVerticalDistance = 60;

    document.addEventListener('touchstart', (e) => {
        // モーダル表示中、カメラ起動中、および入力フォーカス中は誤作動防止のためスワイプを無効化
        if (document.querySelector('.modal-overlay.active') || 
            document.querySelector('.camera-view-overlay.active') ||
            document.activeElement.tagName === 'INPUT' || 
            document.activeElement.tagName === 'SELECT' || 
            document.activeElement.tagName === 'TEXTAREA') {
            return;
        }
        
        // カレンダーグリッドやサムネイルコンテナ等、個別のスクロールが必要な領域もスワイプ除外
        if (e.target.closest('#dropzone') || 
            e.target.closest('#capturedThumbsContainer') || 
            e.target.closest('.calendarGrid') ||
            e.target.closest('.history-list') ||
            e.target.closest('#trendChart') ||
            e.target.closest('#budgetTrendChart')) {
            return;
        }

        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
        if (document.querySelector('.modal-overlay.active') || 
            document.querySelector('.camera-view-overlay.active') ||
            document.activeElement.tagName === 'INPUT' || 
            document.activeElement.tagName === 'SELECT' || 
            document.activeElement.tagName === 'TEXTAREA') {
            return;
        }
        
        if (e.target.closest('#dropzone') || 
            e.target.closest('#capturedThumbsContainer') || 
            e.target.closest('.calendarGrid') ||
            e.target.closest('.history-list') ||
            e.target.closest('#trendChart') ||
            e.target.closest('#budgetTrendChart')) {
            return;
        }

        touchEndX = e.changedTouches[0].screenX;
        touchEndY = e.changedTouches[0].screenY;

        handleSwipeGesture();
    }, { passive: true });

    function handleSwipeGesture() {
        const deltaX = touchEndX - touchStartX;
        const deltaY = Math.abs(touchEndY - touchStartY);

        // 横スワイプ距離が十分かつ、縦移動が少ない場合のみスワイプと判定
        if (Math.abs(deltaX) > minSwipeDistance && deltaY < maxSwipeVerticalDistance) {
            const tabs = ['dashboard', 'analytics', 'budgets'];
            const activeTabEl = document.querySelector('.nav-tab.active');
            if (!activeTabEl) return;
            
            const currentTab = activeTabEl.getAttribute('data-tab');
            const currentIndex = tabs.indexOf(currentTab);
            if (currentIndex === -1) return;

            let nextIndex = currentIndex;
            
            if (deltaX < 0) {
                // 左スワイプ（右から左） -> 次のタブへ
                if (currentIndex < tabs.length - 1) {
                    nextIndex = currentIndex + 1;
                }
            } else {
                // 右スワイプ（左から右） -> 前のタブへ
                if (currentIndex > 0) {
                    nextIndex = currentIndex - 1;
                }
            }

            if (nextIndex !== currentIndex) {
                const targetTabBtn = document.querySelector(`.nav-tab[data-tab="${tabs[nextIndex]}"]`);
                if (targetTabBtn) {
                    targetTabBtn.click();
                }
            }
        }
    }
}

// 10. Month Select Navigation
let pickerSelectedYear = new Date().getFullYear();

function initMonthSelector() {
    qsa('.prevMonthBtn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const viewId = e.currentTarget.closest('.view-panel')?.id;
            // 31日等がある月にsetMonthすると意図せず翌々月に繰り上がるバグを防ぐため、日を一度1日に固定する
            currentMonth.setDate(1);
            if (viewId === 'analyticsView') {
                if (analyticsPeriod === 'quarter') {
                    // Go back 1 quarter (3 months)
                    currentMonth.setMonth(currentMonth.getMonth() - 3);
                } else if (analyticsPeriod === 'year') {
                    // Go back 1 year
                    currentMonth.setFullYear(currentMonth.getFullYear() - 1);
                } else {
                    // Go back 1 month
                    currentMonth.setMonth(currentMonth.getMonth() - 1);
                }
            } else {
                // Dashboard is always monthly
                currentMonth.setMonth(currentMonth.getMonth() - 1);
            }
            activeFilterDate = null;
            refreshCurrentTabState();
        });
    });
    
    qsa('.nextMonthBtn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const viewId = e.currentTarget.closest('.view-panel')?.id;
            // 31日等がある月にsetMonthすると意図せず翌々月に繰り上がるバグを防ぐため、日を一度1日に固定する
            currentMonth.setDate(1);
            if (viewId === 'analyticsView') {
                if (analyticsPeriod === 'quarter') {
                    // Go forward 1 quarter (3 months)
                    currentMonth.setMonth(currentMonth.getMonth() + 3);
                } else if (analyticsPeriod === 'year') {
                    // Go forward 1 year
                    currentMonth.setFullYear(currentMonth.getFullYear() + 1);
                } else {
                    // Go forward 1 month
                    currentMonth.setMonth(currentMonth.getMonth() + 1);
                }
            } else {
                // Dashboard is always monthly
                currentMonth.setMonth(currentMonth.getMonth() + 1);
            }
            activeFilterDate = null;
            refreshCurrentTabState();
        });
    });

    qsa('.currentMonthYearLabel-wrapper').forEach(wrapper => {
        wrapper.addEventListener('click', (e) => {
            const viewId = e.currentTarget.closest('.view-panel')?.id;
            openCustomMonthPicker(viewId);
        });
    });

    // Custom Picker Year Controls
    if (el('pickerPrevYearBtn')) {
        el('pickerPrevYearBtn').addEventListener('click', () => {
            pickerSelectedYear--;
            const activeView = qs('.view-panel.active');
            const viewId = activeView ? activeView.id : 'dashboardView';
            renderCustomMonthPicker(viewId);
        });
    }
    if (el('pickerNextYearBtn')) {
        el('pickerNextYearBtn').addEventListener('click', () => {
            pickerSelectedYear++;
            const activeView = qs('.view-panel.active');
            const viewId = activeView ? activeView.id : 'dashboardView';
            renderCustomMonthPicker(viewId);
        });
    }

    updateMonthLabel();
}

function updateMonthLabel() {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth() + 1;
    
    // 1. Dashboard month label (always monthly)
    const dbLabel = qs('#dashboardView .currentMonthYearLabel');
    if (dbLabel) {
        dbLabel.textContent = `${year}年${String(month).padStart(2, '0')}月`;
    }
    
    // 2. Analytics month label (depends on analyticsPeriod)
    const analyticsLabel = qs('#analyticsView .currentMonthYearLabel');
    if (analyticsLabel) {
        if (analyticsPeriod === 'month') {
            analyticsLabel.textContent = `${year}年${String(month).padStart(2, '0')}月`;
        } else if (analyticsPeriod === 'quarter') {
            const q = Math.ceil(month / 3);
            analyticsLabel.textContent = `${year}年 Q${q}`;
        } else if (analyticsPeriod === 'year') {
            analyticsLabel.textContent = `${year}年`;
        }
    }
}

function openCustomMonthPicker(viewId) {
    pickerSelectedYear = currentMonth.getFullYear();
    renderCustomMonthPicker(viewId);
    openModal('monthPickerModal');
}

function renderCustomMonthPicker(viewId) {
    updateCustomPickerYearLabel();
    
    const grid = qs('#monthPickerModal .month-picker-grid');
    if (!grid) return;
    
    if (viewId === 'analyticsView' && analyticsPeriod === 'quarter') {
        // Quarter Picker
        grid.style.gridTemplateColumns = 'repeat(2, 1fr)';
        grid.innerHTML = '';
        const quarters = [
            { label: 'Q1 (1-3月)', monthVal: 0 },
            { label: 'Q2 (4-6月)', monthVal: 3 },
            { label: 'Q3 (7-9月)', monthVal: 6 },
            { label: 'Q4 (10-12月)', monthVal: 9 }
        ];
        
        const activeQ = Math.ceil((currentMonth.getMonth() + 1) / 3) - 1;
        
        quarters.forEach((q, idx) => {
            const btn = document.createElement('button');
            btn.className = `month-picker-btn ${idx === activeQ && pickerSelectedYear === currentMonth.getFullYear() ? 'active' : ''}`;
            btn.textContent = q.label;
            btn.addEventListener('click', () => {
                currentMonth = new Date(pickerSelectedYear, q.monthVal, 1);
                activeFilterDate = null;
                refreshCurrentTabState();
                closeModal('monthPickerModal');
            });
            grid.appendChild(btn);
        });
    } else if (viewId === 'analyticsView' && analyticsPeriod === 'year') {
        // Year Picker
        grid.style.gridTemplateColumns = 'repeat(3, 1fr)';
        grid.innerHTML = '';
        const currentYear = new Date().getFullYear();
        const startY = currentYear - 5;
        const endY = currentYear + 3;
        
        for (let y = startY; y <= endY; y++) {
            const btn = document.createElement('button');
            btn.className = `month-picker-btn ${y === currentMonth.getFullYear() ? 'active' : ''}`;
            btn.textContent = `${y}年`;
            btn.addEventListener('click', () => {
                currentMonth = new Date(y, 0, 1);
                activeFilterDate = null;
                refreshCurrentTabState();
                closeModal('monthPickerModal');
            });
            grid.appendChild(btn);
        }
    } else {
        // Month Picker (Default Dashboard)
        grid.style.gridTemplateColumns = 'repeat(3, 1fr)';
        grid.innerHTML = '';
        
        for (let m = 0; m < 12; m++) {
            const btn = document.createElement('button');
            btn.className = `month-picker-btn ${m === currentMonth.getMonth() && pickerSelectedYear === currentMonth.getFullYear() ? 'active' : ''}`;
            btn.textContent = `${m + 1}月`;
            btn.addEventListener('click', () => {
                currentMonth = new Date(pickerSelectedYear, m, 1);
                activeFilterDate = null;
                refreshCurrentTabState();
                closeModal('monthPickerModal');
            });
            grid.appendChild(btn);
        }
    }
    
    // Hide year selector if year picker is shown
    const yearSelector = qs('#monthPickerModal .month-picker-year-selector');
    if (yearSelector) {
        if (viewId === 'analyticsView' && analyticsPeriod === 'year') {
            yearSelector.style.display = 'none';
        } else {
            yearSelector.style.display = 'flex';
        }
    }
}

function updateCustomPickerYearLabel() {
    const label = el('pickerYearLabel');
    if (label) label.textContent = `${pickerSelectedYear}年`;
}
window.openCustomMonthPicker = openCustomMonthPicker;

function refreshCurrentTabState() {
    updateMonthLabel();
    const activeView = qs('.view-panel.active');
    if (activeView) {
        if (activeView.id === 'dashboardView') updateDashboard();
        if (activeView.id === 'analyticsView') updateAnalyticsView();
        if (activeView.id === 'budgetsView') updateBudgetTrendChart();
    }
}

// 11. Budget Category select builder
function buildBudgetCategorySelect() {
    const select = el('budgetCategory');
    if (!select) return;
    select.innerHTML = '<option value="">カテゴリを選択</option>';
    Object.entries(categoryMeta).forEach(([key, meta]) => {
        const opt = document.createElement('option');
        opt.value = key;
        opt.textContent = meta.label;
        select.appendChild(opt);
    });
}

function buildRecurringCategorySelect() {
    const select = el('recurringCategory');
    if (!select) return;
    select.innerHTML = '<option value="">カテゴリを選択</option>';
    Object.entries(categoryMeta).forEach(([key, meta]) => {
        const opt = document.createElement('option');
        opt.value = key;
        opt.textContent = meta.label;
        select.appendChild(opt);
    });
}

function getTransactionItemsWithTax(t) {
    let itemBaseSum = 0;
    const itemsList = t.items || [];
    itemsList.forEach(item => {
        const netPrice = item.price - (item.discount || 0);
        itemBaseSum += netPrice;
    });
    
    const tax = t.tax || 0;
    
    const resolvedItems = itemsList.map(item => {
        const netPrice = item.price - (item.discount || 0);
        let distributedTax = 0;
        if (itemBaseSum > 0) {
            distributedTax = (netPrice / itemBaseSum) * tax;
        } else if (itemsList.length > 0) {
            distributedTax = tax / itemsList.length;
        }
        
        return {
            name: item.name,
            price: Math.round(netPrice + distributedTax),
            category: item.category || 'others'
        };
    });
    
    // Adjust rounding difference on the last item to match transaction total
    if (resolvedItems.length > 0) {
        const itemsSum = resolvedItems.reduce((s, item) => s + item.price, 0);
        const diff = t.total - itemsSum;
        if (diff !== 0) {
            resolvedItems[resolvedItems.length - 1].price += diff;
        }
    }
    
    return resolvedItems;
}

// 12. Dynamic transaction resolved list (normal + recurring)
function getMonthlyResolvedTransactions(year, month) {
    const targetMonthStr = `${year}-${String(month).padStart(2, '0')}`;
    
    // 1. Normal transactions matching this month
    const normalTxns = transactions.filter(t => t.date.startsWith(targetMonthStr));
    
    const resolvedNormal = normalTxns.map(t => {
        return {
            ...t,
            items: getTransactionItemsWithTax(t)
        };
    });
    
    // 2. Inject recurring virtual transactions matching the target month range
    const virtualTxns = [];
    recurringExpenses.forEach(r => {
        const rStartMonth = r.startDate.substring(0, 7);
        const rEndMonth = r.endDate ? r.endDate.substring(0, 7) : '9999-12';
        
        if (targetMonthStr >= rStartMonth && targetMonthStr <= rEndMonth) {
            // Distribute recurring virtual transactions to their actual day of start date
            const startDay = parseInt(r.startDate.substring(8, 10)) || 1;
            const lastDayOfMonth = new Date(year, month, 0).getDate();
            const actualDay = Math.min(startDay, lastDayOfMonth);
            const billingDateStr = `${targetMonthStr}-${String(actualDay).padStart(2, '0')}`;
            
            virtualTxns.push({
                id: `rec-${r.id}-${targetMonthStr}`,
                storeName: `[固定費] ${r.name}`,
                date: billingDateStr,
                total: r.amount,
                items: [{ name: r.name, price: r.amount, category: r.category }],
                isRecurring: true,
                recurringConfigId: r.id
            });
        }
    });
    
    return [...resolvedNormal, ...virtualTxns];
}

// Find active budgets mapping covering target month
function getActiveBudgetForMonth(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const midMonthDate = `${year}-${month}-15`;
    
    const activeMapping = {};
    Object.keys(categoryMeta).forEach(k => activeMapping[k] = 0);
    
    budgets.forEach(b => {
        if (b.startDate <= midMonthDate && b.endDate >= midMonthDate) {
            activeMapping[b.category] = (activeMapping[b.category] || 0) + b.amount;
        }
    });
    
    return activeMapping;
}

function getBudgetForMonth(year, month) {
    return getActiveBudgetForMonth(new Date(year, month - 1, 15));
}

function getBudgetForPeriod(period, date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // 1-indexed
    
    const aggregatedBudget = {};
    Object.keys(categoryMeta).forEach(k => aggregatedBudget[k] = 0);
    
    let monthsToSum = [];
    if (period === 'month') {
        monthsToSum.push(month);
    } else if (period === 'quarter') {
        const q = Math.ceil(month / 3);
        const startMonth = (q - 1) * 3 + 1;
        monthsToSum = [startMonth, startMonth + 1, startMonth + 2];
    } else if (period === 'year') {
        for (let m = 1; m <= 12; m++) monthsToSum.push(m);
    }
    
    monthsToSum.forEach(m => {
        const monthBudget = getBudgetForMonth(year, m);
        Object.entries(monthBudget).forEach(([cat, val]) => {
            if (aggregatedBudget[cat] !== undefined) {
                aggregatedBudget[cat] += val;
            }
        });
    });
    
    return aggregatedBudget;
}

// 13. Dashboard View Updates
function updateDashboard() {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth() + 1;
    
    const monthlyTxns = getMonthlyResolvedTransactions(year, month);
    const totalExpenses = monthlyTxns.reduce((sum, t) => sum + t.total, 0);
    
    // Update Stats Card
    qsa('.totalExpensesVal').forEach(node => node.textContent = `¥${totalExpenses.toLocaleString()}`);
    qsa('.receiptCountVal').forEach(node => node.textContent = `${monthlyTxns.length} 件`);
    
    // Budget progress elements
    const activeBudget = getActiveBudgetForMonth(currentMonth);
    const overallBudget = Object.values(activeBudget).reduce((sum, v) => sum + v, 0);
    
    updateOverallBudgetProgress(totalExpenses, overallBudget);
    renderCategoryBudgetList(monthlyTxns, activeBudget);
    
    // Components updates
    renderCalendar(monthlyTxns);
    renderRecentHistory(monthlyTxns);
    updateShareCharts(monthlyTxns);
}

function updateOverallBudgetProgress(totalSpent, overallBudget) {
    let percent = 0;
    if (overallBudget > 0) percent = Math.min((totalSpent / overallBudget) * 100, 100);
    
    qsa('.budgetPercentLabel').forEach(node => node.textContent = overallBudget > 0 ? `消化率: ${Math.round(percent)}%` : '消化率: - %');
    qsa('.budgetRemainingLabel').forEach(node => {
        if (overallBudget === 0) {
            node.textContent = '予算未設定';
        } else {
            const rem = overallBudget - totalSpent;
            if (rem >= 0) {
                node.textContent = `残高: ¥${rem.toLocaleString()}`;
            } else {
                node.textContent = `超過: ¥${Math.abs(rem).toLocaleString()}`;
            }
        }
    });
    
    qsa('.budgetProgressBar').forEach(bar => {
        bar.style.width = `${percent}%`;
        bar.classList.remove('warning', 'danger');
        if (percent >= 100) {
            bar.classList.add('danger');
        } else if (percent >= 80) {
            bar.classList.add('warning');
        }
    });
}

function renderCategoryBudgetList(monthlyTxns, activeBudget) {
    const container = el('dashboardCategoryBudgets');
    if (!container) return;
    container.innerHTML = '';
    
    // Calculate spends per category
    const spends = {};
    Object.keys(categoryMeta).forEach(k => spends[k] = 0);
    monthlyTxns.forEach(t => {
        (t.items || []).forEach(item => {
            const cat = item.category || 'others';
            if (spends[cat] !== undefined) spends[cat] += item.price;
            else spends['others'] += item.price;
        });
    });
    
    // Render list for categories that have budget or spend
    Object.entries(categoryMeta).forEach(([key, meta]) => {
        const budget = activeBudget[key] || 0;
        const spent = spends[key] || 0;
        
        if (budget > 0 || spent > 0) {
            let percent = 0;
            if (budget > 0) percent = Math.min((spent / budget) * 100, 100);
            else if (spent > 0) percent = 100;
            
            let progressClass = '';
            if (spent > budget && budget > 0) progressClass = 'danger';
            else if (percent >= 80) progressClass = 'warning';
            
            let remText = '';
            if (budget > 0) {
                const rem = budget - spent;
                if (rem >= 0) remText = `残 ¥${rem.toLocaleString()}`;
                else remText = `超過 ¥${Math.abs(rem).toLocaleString()}`;
            } else {
                remText = '予算なし';
            }
            
            const row = document.createElement('div');
            row.className = 'dashboard-category-budget-row';
            row.addEventListener('click', () => showCategoryItems(key));
            row.innerHTML = `
                <div class="cat-label-indicator">
                    <span class="cat-dot" style="background-color: ${meta.color}"></span>
                    <span style="font-weight:600; font-size:0.8rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${meta.label}</span>
                </div>
                <div class="progress-bar-container" style="height:6px; margin:0;">
                    <div class="progress-bar-fill ${progressClass}" style="width: ${percent}%; background-color: ${progressClass ? '' : meta.color}"></div>
                </div>
                <div class="cat-budget-values-wrapper" style="text-align:right; font-size:0.76rem; display:flex; flex-direction:column; line-height:1.25; min-width:0;">
                    <div style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                        <span style="font-weight:700; color:var(--text-main);">${spent.toLocaleString()}</span>
                        <span style="color:var(--text-muted); font-size:0.68rem;">/ ${budget > 0 ? budget.toLocaleString() : '無'}</span>
                    </div>
                    <div class="cat-rem-text ${spent > budget && budget > 0 ? 'text-red-500 font-bold' : ''}" style="font-size:0.65rem; color:var(--text-muted); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${remText}</div>
                </div>
            `;
            container.appendChild(row);
        }
    });
}

// 14. Calendar Rendering
function renderCalendar(monthlyTxns) {
    const grid = qs('.calendarGrid');
    if (!grid) return;
    grid.innerHTML = '';
    
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    // Pad initial blank days
    for (let i = 0; i < firstDayIndex; i++) {
        const empty = document.createElement('div');
        empty.className = 'calendar-day empty';
        grid.appendChild(empty);
    }
    
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Draw cells
    for (let dayNum = 1; dayNum <= totalDays; dayNum++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
        const dayTxns = monthlyTxns.filter(t => t.date === dateStr);
        const dayTotal = dayTxns.reduce((sum, t) => sum + t.total, 0);
        
        const cell = document.createElement('div');
        cell.className = 'calendar-day';
        cell.setAttribute('data-date', dateStr);
        
        if (dateStr === todayStr) cell.classList.add('today');
        if (dateStr === activeFilterDate) cell.classList.add('active-filter');
        
        if (dayTotal > 0) {
            cell.classList.add('has-spend');
            if (dayTotal >= 10000) cell.classList.add('has-high-spend');
        }
        
        // Recurring dot indicator
        let hasRecurring = dayTxns.some(t => t.isRecurring);
        let recurringDot = hasRecurring ? '<span class="recur-indicator-dot"></span>' : '';
        let amountText = dayTotal > 0 ? `¥${dayTotal.toLocaleString()}` : '';
        
        cell.innerHTML = `
            <span class="calendar-day-num">${dayNum}</span>
            ${recurringDot}
            <span class="calendar-day-amount">${amountText}</span>
        `;
        
        grid.appendChild(cell);
    }
}

// Open detailed view for a day
function openDayDetailsModal(dateStr, sum, dayTxns) {
    if (el('dayDetailTitle')) el('dayDetailTitle').textContent = `${dateStr} の支出内訳`;
    if (el('dayDetailTotalSum')) el('dayDetailTotalSum').textContent = `¥${sum.toLocaleString()}`;
    
    const list = el('dayDetailItemsList');
    if (list) {
        list.innerHTML = '';
        if (dayTxns.length === 0) {
            list.innerHTML = `
                <div class="empty-state" style="padding: 24px 0; text-align: center;">
                    <div class="empty-icon" style="margin-bottom: 12px; font-size: 24px; color: var(--text-muted);"><i data-lucide="folder-open"></i></div>
                    <p style="color: var(--text-muted); margin-bottom: 16px;">この日の支出記録はありません。</p>
                    <button class="btn btn-primary" onclick="startManualInputForDate('${dateStr}')"><i data-lucide="plus"></i> この日に手動入力する</button>
                </div>
            `;
            if (typeof lucide !== 'undefined') lucide.createIcons();
        } else {
            dayTxns.forEach(t => {
                const card = document.createElement('div');
                card.className = 'day-item-card';
                
                let recurText = t.isRecurring ? ' <span class="badge" style="background:rgba(168,85,247,0.15);color:#A855F7;padding:1px 6px;margin-left:6px;">固定</span>' : '';
                
                let subItemsHtml = (t.items || []).map(item => {
                    const meta = categoryMeta[item.category] || categoryMeta.others;
                    return `
                        <div class="day-sub-item">
                            <span class="day-sub-item-label">
                                <span class="cat-dot" style="background-color:${meta.color}"></span>
                                <span>${item.name}</span>
                            </span>
                            <span>¥${item.price.toLocaleString()}</span>
                        </div>
                    `;
                }).join('');
                
                card.innerHTML = `
                    <div class="day-item-header">
                        <span class="day-item-store">${t.storeName}${recurText}</span>
                        <span class="day-item-total">¥${t.total.toLocaleString()}</span>
                    </div>
                    ${subItemsHtml}
                    <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:8px;">
                        <button class="history-action-btn" onclick="editTransactionItem('${t.id}')">編集</button>
                        <button class="history-action-btn delete" onclick="deleteTransactionItem('${t.id}')">削除</button>
                    </div>
                `;
                list.appendChild(card);
            });
        }
    }
    
    // Manage footer
    const footer = qs('#dayDetailModal .modal-footer');
    if (footer) {
        if (dayTxns.length > 0) {
            footer.innerHTML = `
                <button class="btn btn-secondary" id="closeDayDetailModalBtn" onclick="closeModal('dayDetailModal')">閉じる</button>
                <button class="btn btn-primary" onclick="startManualInputForDate('${dateStr}')"><i data-lucide="plus"></i> この日に追加</button>
            `;
            if (typeof lucide !== 'undefined') lucide.createIcons();
        } else {
            footer.innerHTML = `
                <button class="btn btn-secondary" id="closeDayDetailModalBtn" onclick="closeModal('dayDetailModal')">閉じる</button>
            `;
        }
    }
    
    openModal('dayDetailModal');
}

function startManualInputForDate(dateStr) {
    closeModal('dayDetailModal');
    startManualInputForm();
    if (el('receiptDate')) {
        el('receiptDate').value = dateStr;
    }
}
window.startManualInputForDate = startManualInputForDate;

// 15. Render Transaction History List
function renderRecentHistory(monthlyTxns) {
    const container = qs('.historyList');
    const emptyState = qs('.historyEmptyState');
    const filterBadge = qs('.filterActiveBadge');
    if (!container) return;
    
    // Clear list but keep empty state element
    const emptyHtml = emptyState ? emptyState.outerHTML : '';
    container.innerHTML = emptyHtml;
    
    let filtered = monthlyTxns;
    if (activeFilterDate) {
        filtered = monthlyTxns.filter(t => t.date === activeFilterDate);
        if (filterBadge) {
            filterBadge.innerHTML = `${activeFilterDate.split('-')[2]}日の記録 <span style="cursor:pointer;margin-left:6px;font-weight:700;opacity:0.8;" onclick="clearDateFilter(event)" title="フィルター解除">&times;</span>`;
            filterBadge.classList.add('active');
        }
    } else {
        if (filterBadge) filterBadge.classList.remove('active');
    }
    
    // Sort newest date first
    filtered.sort((a, b) => b.date.localeCompare(a.date));
    
    const itemsCount = filtered.length;
    if (itemsCount === 0) {
        if (el('historyList') && qs('.historyEmptyState')) {
            qs('.historyEmptyState').style.display = 'flex';
        }
    } else {
        if (qs('.historyEmptyState')) {
            qs('.historyEmptyState').style.display = 'none';
        }
        
        filtered.forEach(t => {
            const row = document.createElement('div');
            row.className = 'history-item';
            row.addEventListener('click', (e) => {
                // Prevent trigger when clicking action buttons
                if (e.target.tagName !== 'BUTTON') {
                    editTransactionItem(t.id);
                }
            });
            
            const detailText = t.items.map(i => i.name).join(', ');
            const badgeMeta = categoryMeta[t.items[0]?.category || 'others'] || categoryMeta.others;
            const recurText = t.isRecurring ? '<span class="badge" style="background:rgba(168,85,247,0.15);color:#A855F7;padding:1px 6px;margin-left:6px;">固定</span>' : '';
            
            row.innerHTML = `
                <div class="history-left">
                    <div class="history-title-row">
                        <span class="history-title">${t.storeName}</span>
                        ${recurText}
                    </div>
                    <div class="history-meta">
                        <span class="badge ${badgeMeta.class}">${badgeMeta.label}</span>
                        <span class="truncate">${t.date} | ${detailText}</span>
                    </div>
                </div>
                <div class="history-right">
                    <span class="history-amount">¥${t.total.toLocaleString()}</span>
                    <div class="history-actions">
                        <button class="history-action-btn" onclick="event.stopPropagation(); editTransactionItem('${t.id}')">編集</button>
                        <button class="history-action-btn delete" onclick="event.stopPropagation(); deleteTransactionItem('${t.id}')">削除</button>
                    </div>
                </div>
            `;
            container.appendChild(row);
        });
    }
}

function clearDateFilter(e) {
    if (e) e.stopPropagation();
    activeFilterDate = null;
    updateDashboard();
}
window.clearDateFilter = clearDateFilter;

// 16. Transaction Actions (CRUD)
window.editTransactionItem = function(id) {
    if (id.startsWith('rec-')) {
        showToast('固定費支出の編集は「予算・固定費設定」タブから行ってください。', 'info');
        return;
    }
    
    const txn = transactions.find(t => t.id === id);
    if (!txn) return;
    
    editingTransactionId = id;
    
    // Hide inputs, show editor
    showDashboardSubpanel('editorPanel');
    if (el('editorTitle')) el('editorTitle').innerHTML = '<i data-lucide="edit-3" style="color:var(--primary)"></i> 記録の編集';
    
    if (el('receiptStore')) el('receiptStore').value = txn.storeName;
    if (el('receiptDate')) el('receiptDate').value = txn.date;
    if (el('receiptTax')) el('receiptTax').value = txn.tax || 0;
    if (el('receiptTotal')) el('receiptTotal').value = txn.total;
    
    const list = el('itemsList');
    if (list) {
        list.innerHTML = '';
        txn.items.forEach(item => addEditorItemRow(item.name, item.price, item.discount || 0, item.category));
    }
    
    closeModal('dayDetailModal');
    if (typeof lucide !== 'undefined') lucide.createIcons();
};

window.deleteTransactionItem = function(id) {
    if (id.startsWith('rec-')) {
        showToast('固定費支出の削除は「予算・固定費設定」タブから行ってください。', 'info');
        return;
    }
    
    if (!confirm('この記録を削除してもよろしいですか？')) return;
    
    transactions = transactions.filter(t => t.id !== id);
    saveData('transactions');
    updateDashboard();
    closeModal('dayDetailModal');
    showToast('記録を削除しました。', 'info');
};

// 17. Manual & AI Scan Upload Forms
function startManualInputForm() {
    editingTransactionId = null;
    showDashboardSubpanel('editorPanel');
    if (el('editorTitle')) el('editorTitle').innerHTML = '<i data-lucide="keyboard" style="color:var(--primary)"></i> 手動入力';
    
    if (el('receiptStore')) el('receiptStore').value = '';
    if (el('receiptDate')) el('receiptDate').value = new Date().toISOString().split('T')[0];
    if (el('receiptTax')) el('receiptTax').value = '0';
    if (el('receiptTotal')) el('receiptTotal').value = '0';
    
    const list = el('itemsList');
    if (list) {
        list.innerHTML = '';
        addEditorItemRow('', 0, 0, 'food');
    }
    
    setTimeout(() => {
        if (el('receiptStore')) el('receiptStore').focus();
    }, 150);
}

function cancelEditor() {
    editingTransactionId = null;
    showDashboardSubpanel('dropzone');
    if (el('fileInput')) el('fileInput').value = '';
}
window.cancelEditor = cancelEditor;

function addEditorItemRow(name = '', price = 0, discount = 0, category = 'food') {
    const container = el('itemsList');
    if (!container) return;
    
    const row = document.createElement('div');
    row.className = 'item-row';
    
    let selectOptions = '';
    Object.entries(categoryMeta).forEach(([k, v]) => {
        selectOptions += `<option value="${k}" ${k === category ? 'selected' : ''}>${v.label}</option>`;
    });
    
    row.innerHTML = `
        <select class="item-category">${selectOptions}</select>
        <input type="text" class="item-name" placeholder="品名" value="${name}">
        <div class="item-price-field">
            <label class="mobile-field-label">単価 (¥)</label>
            <input type="number" class="item-price" placeholder="単価" value="${price}" min="0">
        </div>
        <div class="item-discount-field">
            <label class="mobile-field-label">割引 (¥)</label>
            <input type="number" class="item-discount" placeholder="割引" value="${discount}" min="0">
        </div>
        <button class="btn-icon" style="color:var(--text-muted);" title="削除"><i data-lucide="trash-2"></i></button>
    `;
    
    
    // Bind auto calculations and dynamic category coloring
    const selectEl = row.querySelector('.item-category');
    const updateSelectColor = () => {
        const cat = selectEl.value;
        const meta = categoryMeta[cat] || categoryMeta.others;
        selectEl.style.borderLeft = `4px solid ${meta.color}`;
    };
    selectEl.addEventListener('change', updateSelectColor);
    updateSelectColor();

    row.querySelector('.item-price').addEventListener('input', calculateTotalFromItems);
    row.querySelector('.item-discount').addEventListener('input', calculateTotalFromItems);
    row.querySelector('button').addEventListener('click', () => {
        row.remove();
        calculateTotalFromItems();
    });
    
    container.appendChild(row);
    if (typeof lucide !== 'undefined') lucide.createIcons();
    calculateTotalFromItems();
}

function calculateTotalFromItems() {
    let sum = 0;
    qsa('.item-row').forEach(row => {
        const price = parseInt(row.querySelector('.item-price').value) || 0;
        const discount = parseInt(row.querySelector('.item-discount').value) || 0;
        sum += Math.max(0, price - discount);
    });
    
    const tax = parseInt(el('receiptTax').value) || 0;
    sum += tax;
    
    if (el('receiptTotal')) el('receiptTotal').value = sum;
}

function saveCurrentTransaction() {
    const store = el('receiptStore').value.trim();
    const dateStr = el('receiptDate').value;
    const taxVal = parseInt(el('receiptTax').value) || 0;
    const totalVal = parseInt(el('receiptTotal').value) || 0;
    
    if (!dateStr || totalVal <= 0) {
        showToast('正しい日付と金額を入力してください。', 'error');
        return;
    }
    
    // Retrieve rows
    const items = [];
    qsa('.item-row').forEach(row => {
        const name = row.querySelector('.item-name').value.trim();
        const category = row.querySelector('.item-category').value;
        const price = parseInt(row.querySelector('.item-price').value) || 0;
        const discount = parseInt(row.querySelector('.item-discount').value) || 0;
        
        if (name || price > 0) {
            items.push({
                name: name || '品目明細',
                category: category || 'others',
                price: price,
                discount: discount
            });
        }
    });
    
    if (items.length === 0) {
        items.push({ name: 'まとめ支出', category: 'others', price: totalVal - taxVal, discount: 0 });
    }
    
    if (editingTransactionId) {
        const index = transactions.findIndex(t => t.id === editingTransactionId);
        if (index > -1) {
            transactions[index] = {
                ...transactions[index],
                storeName: store || '不明な店舗',
                date: dateStr,
                tax: taxVal,
                total: totalVal,
                items: items
            };
            showToast('家計簿記録を更新しました。', 'success');
        }
    } else {
        transactions.push({
            id: 'txn-' + Date.now().toString(),
            storeName: store || '不明な店舗',
            date: dateStr,
            tax: taxVal,
            total: totalVal,
            items: items
        });
        showToast('家計簿記録を登録しました。', 'success');
    }
    
    saveData('transactions');
    showDashboardSubpanel('dropzone');
    updateDashboard();
    updateAnalyticsView();
}

// 18. Receipts Batch / Single file upload process
function handleFileUpload(e) {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    if (files.length === 1) {
        processSingleReceipt(files[0]);
    } else {
        processMultipleReceipts(files);
    }
    e.target.value = '';
}

async function processSingleReceipt(file) {
    try {
        const base64 = await convertFileToBase64(file);
        
        // Show scanning animation panel
        showDashboardSubpanel('scannerContainer');
        if (el('scannedImage')) el('scannedImage').src = base64;
        
        // Process AI / Mock
        const res = await callScanApi(base64.split(',')[1], file.type);
        
        // Fill editor
        showDashboardSubpanel('editorPanel');
        if (el('editorTitle')) el('editorTitle').innerHTML = '<i data-lucide="edit-3" style="color:var(--primary)"></i> 解析結果の確認';
        if (el('receiptStore')) el('receiptStore').value = res.storeName || '';
        if (el('receiptDate')) el('receiptDate').value = res.date || new Date().toISOString().split('T')[0];
        if (el('receiptTax')) el('receiptTax').value = res.tax || 0;
        if (el('receiptTotal')) el('receiptTotal').value = res.total || 0;
        
        const list = el('itemsList');
        if (list) {
            list.innerHTML = '';
            if (res.items && res.items.length) {
                res.items.forEach(item => addEditorItemRow(item.name, item.price, item.discount || 0, item.category));
            } else {
                addEditorItemRow('レシート品目', res.total - (res.tax || 0), 0, 'food');
            }
        }
    } catch (err) {
        console.error(err);
        showToast('スキャンエラーが発生しました。', 'error');
        showDashboardSubpanel('dropzone');
    }
}

async function processMultipleReceipts(files) {
    showDashboardSubpanel('bulkProgressContainer');
    let successCount = 0;
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (el('bulkProgressText')) {
            el('bulkProgressText').textContent = `処理中: ${i + 1} / ${files.length} (${file.name})`;
        }
        if (el('bulkProgressBar')) {
            el('bulkProgressBar').style.width = `${((i) / files.length) * 100}%`;
        }
        
        try {
            const base64 = await convertFileToBase64(file);
            const res = await callScanApi(base64.split(',')[1], file.type);
            
            transactions.push({
                id: 'txn-' + Date.now().toString() + '-' + i,
                storeName: res.storeName || '不明な店舗',
                date: res.date || new Date().toISOString().split('T')[0],
                total: res.total || 0,
                items: res.items && res.items.length ? res.items : [{ name: 'まとめ支出', price: res.total || 0, category: 'others' }]
            });
            successCount++;
        } catch (err) {
            console.error('Batch scanning single error: ', err);
        }
    }
    
    if (el('bulkProgressBar')) el('bulkProgressBar').style.width = '100%';
    
    setTimeout(() => {
        saveData('transactions');
        showDashboardSubpanel('dropzone');
        updateDashboard();
        showToast(`${successCount} 枚のレシートを一括登録しました。`, 'success');
    }, 1000);
}

function convertFileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// 19. Gemini AI Integration with strict JSON output
async function callScanApi(base64Data, mimeType) {
    if (!apiKey) {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(getMockDataResponse());
            }, 2500);
        });
    }
    
    const schema = {
        type: "OBJECT",
        properties: {
            storeName: { type: "STRING" },
            date: { type: "STRING", description: "YYYY-MM-DD format" },
            tax: { type: "INTEGER", description: "Receipt-wide tax if computed collectively at the end, otherwise 0" },
            total: { type: "INTEGER" },
            items: {
                type: "ARRAY",
                items: {
                    type: "OBJECT",
                    properties: {
                        name: { type: "STRING" },
                        price: { type: "INTEGER", description: "Base unit price of the item before discount" },
                        discount: { type: "INTEGER", description: "Discount amount for this item if applicable, otherwise 0" },
                        category: { type: "STRING", description: "Must be: food, dining, luxuries, shopping, clothing, furniture, utilities, mortgage, insurance, medical, education, transport, social, entertainment, special, or others" }
                    },
                    required: ["name", "price", "discount", "category"]
                }
            }
        },
        required: ["storeName", "date", "tax", "total", "items"]
    };
    
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { inlineData: { mimeType: mimeType || 'image/jpeg', data: base64Data } },
                        { text: "Extract receipt details. Analyze items and map each item to the appropriate category from the schema.\n\n" +
                                "Category definitions:\n" +
                                "- luxuries (嗜好品): Alcoholic beverages (beer, wine, sake, whiskey), cigarettes, sweets (candies, cakes, ice cream, chocolate, donuts), snacks, potato chips, desserts, and non-essential drinks/items.\n" +
                                "- food (食費): Basic groceries, raw cooking ingredients (meat, fish, vegetables), bread, milk, eggs, tofu, seasonings, and daily cooking items.\n" +
                                "- dining (外食費): Restaurant bills, cafe drinks/food, fast food, takeout lunches, food court, and dining out.\n" +
                                "- shopping (日用品・買い物): Toilet paper, tissues, laundry detergent, shampoo, cosmetics, stationeries, trash bags, kitchen goods.\n" +
                                "- transport (交通費): Train tickets, IC cards top-up, bus, taxi, parking fees.\n" +
                                "- medical (健康・医療費): Medicines, hospital checkups, clinic fees, masks, vitamins.\n" +
                                "- clothing (衣服): Apparel, shoes, accessories.\n" +
                                "- furniture (家具・家電): Furniture, home electronics, light bulbs.\n" +
                                "- utilities (水道光熱・通信): Electricity, gas, water, internet, phone bills.\n" +
                                "- mortgage (住宅ローン・家賃): Rent, housing loan.\n" +
                                "- insurance (保険料): Life, health, or car insurance.\n" +
                                "- education (教育): Textbooks, tutoring, school supplies.\n" +
                                "- social (交際費): Gifts, dinner with friends/co-workers, social gather expenses.\n" +
                                "- entertainment (娯楽・趣味): Movies, games, toys, hobbies, travel, concert tickets.\n" +
                                "- special (特別費): Taxes, large yearly insurance, car purchases.\n" +
                                "- others (その他): Anything else that does not fit the definitions above." }
                    ]
                }],
                generationConfig: {
                    responseMimeType: 'application/json',
                    responseSchema: schema
                }
            })
        });
        
        const responseData = await response.json();
        if (responseData.error) {
            throw new Error(responseData.error.message);
        }
        
        const responseText = responseData.candidates[0].content.parts[0].text;
        return JSON.parse(responseText);
    } catch (err) {
        console.error('API integration failure, fallback to Mock: ', err);
        showToast('AI解析に失敗しました。デモ用のダミー値を使用します。', 'error');
        return getMockDataResponse();
    }
}

function getMockDataResponse() {
    const mock = JSON.parse(JSON.stringify(mockReceipts[Math.floor(Math.random() * mockReceipts.length)]));
    
    // Add random tax and discounts sometimes
    mock.tax = Math.random() > 0.5 ? Math.floor(mock.total * 0.08) : 0;
    
    let baseSum = 0;
    mock.items = mock.items.map(item => {
        const discount = Math.random() > 0.6 ? 50 : 0;
        baseSum += (item.price - discount);
        return {
            ...item,
            discount: discount
        };
    });
    
    mock.total = baseSum + mock.tax;
    
    const randomDaysAgo = Math.floor(Math.random() * 8);
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 15);
    date.setDate(date.getDate() - randomDaysAgo);
    mock.date = date.toISOString().split('T')[0];
    return mock;
}

// 20. WebRTC camera controls
async function startContinuousCamera() {
    try {
        cameraStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        
        const video = el('cameraVideo');
        if (video) {
            video.srcObject = cameraStream;
            video.play();
        }
        
        capturedImages = [];
        updateCapturedThumbsUI();
        openModal('cameraViewOverlay');
    } catch (e) {
        console.error(e);
        showToast('カメラの起動に失敗しました。権限を許可してください。', 'error');
    }
}

function stopContinuousCamera() {
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }
    const video = el('cameraVideo');
    if (video) video.srcObject = null;
    
    closeModal('cameraViewOverlay');
}

function captureCameraSnapshot() {
    const video = el('cameraVideo');
    if (!video || !cameraStream) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    
    const dataUrl = canvas.toDataURL('image/jpeg');
    capturedImages.push(dataUrl);
    
    // Trigger flash animation
    const flash = el('cameraFlash');
    if (flash) {
        flash.classList.add('active');
        setTimeout(() => {
            flash.classList.remove('active');
        }, 350);
    }
    
    updateCapturedThumbsUI();
    showToast('撮影しました。', 'success');
}

function updateCapturedThumbsUI() {
    const container = el('capturedThumbsContainer');
    if (!container) return;
    container.innerHTML = '';
    
    capturedImages.forEach((img, index) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'captured-thumb-wrapper';
        wrapper.innerHTML = `
            <img src="${img}" alt="Thumb">
            <button class="delete-thumb-btn" onclick="removeCapturedThumb(${index})">&times;</button>
        `;
        container.appendChild(wrapper);
    });
    
    const processBtn = el('processCapturedBtn');
    if (processBtn) {
        processBtn.disabled = capturedImages.length === 0;
        processBtn.innerHTML = `<i data-lucide="check"></i> 完了 (${capturedImages.length}枚)`;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
}

window.removeCapturedThumb = function(index) {
    capturedImages.splice(index, 1);
    updateCapturedThumbsUI();
};

async function processCapturedBatches() {
    const images = [...capturedImages];
    stopContinuousCamera();
    
    if (images.length === 0) return;
    
    if (images.length === 1) {
        // Show scan overlay single
        showDashboardSubpanel('scannerContainer');
        if (el('scannedImage')) el('scannedImage').src = images[0];
        
        try {
            const res = await callScanApi(images[0].split(',')[1], 'image/jpeg');
            showDashboardSubpanel('editorPanel');
            if (el('editorTitle')) el('editorTitle').innerHTML = '<i data-lucide="edit-3" style="color:var(--primary)"></i> 撮影結果の確認';
            if (el('receiptStore')) el('receiptStore').value = res.storeName || '';
            if (el('receiptDate')) el('receiptDate').value = res.date || new Date().toISOString().split('T')[0];
            if (el('receiptTax')) el('receiptTax').value = res.tax || 0;
            if (el('receiptTotal')) el('receiptTotal').value = res.total || 0;
            
            const list = el('itemsList');
            if (list) {
                list.innerHTML = '';
                res.items.forEach(item => addEditorItemRow(item.name, item.price, item.discount || 0, item.category));
            }
        } catch (e) {
            showDashboardSubpanel('dropzone');
        }
    } else {
        // Bulk progress overlay
        showDashboardSubpanel('bulkProgressContainer');
        let success = 0;
        
        for (let i = 0; i < images.length; i++) {
            if (el('bulkProgressText')) el('bulkProgressText').textContent = `処理中: ${i + 1} / ${images.length}`;
            if (el('bulkProgressBar')) el('bulkProgressBar').style.width = `${((i) / images.length) * 100}%`;
            
            try {
                const res = await callScanApi(images[i].split(',')[1], 'image/jpeg');
                transactions.push({
                    id: 'txn-' + Date.now().toString() + '-' + i,
                    storeName: res.storeName || '不明な店舗',
                    date: res.date || new Date().toISOString().split('T')[0],
                    total: res.total || 0,
                    items: res.items && res.items.length ? res.items : [{ name: 'まとめ支出', price: res.total || 0, category: 'others' }]
                });
                success++;
            } catch (err) {}
        }
        
        if (el('bulkProgressBar')) el('bulkProgressBar').style.width = '100%';
        setTimeout(() => {
            saveData('transactions');
            showDashboardSubpanel('dropzone');
            updateDashboard();
            showToast(`${success} 件の撮影レシートを取り込みました。`, 'success');
        }, 1000);
    }
}

// 21. Chart Rendering Logic
function initCharts() {
    categoryDoughnutCharts = [];
    qsa('.categoryChartCanvas').forEach(canvas => {
        const ctx = canvas.getContext('2d');
        const chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['データなし'],
                datasets: [{
                    data: [1],
                    backgroundColor: ['rgba(255, 255, 255, 0.05)'],
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.08)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                onClick: (event, activeElements, chartInstance) => {
                    if (activeElements && activeElements.length > 0) {
                        const clickedElementIndex = activeElements[0].index;
                        const label = chartInstance.data.labels[clickedElementIndex];
                        if (label && label !== 'データなし') {
                            const catLabel = label.split(':')[0].trim();
                            const catKey = Object.keys(categoryMeta).find(k => categoryMeta[k].label === catLabel);
                            if (catKey) {
                                showCategoryItems(catKey);
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            boxWidth: 8,
                            color: getChartTextColor(),
                            font: { size: 9, family: 'Plus Jakarta Sans' },
                            padding: 8
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                if (context.label === 'データなし') return ' データなし';
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const value = context.raw;
                                const pct = ((value / total) * 100).toFixed(1);
                                // 凡例のテキストをパースしてカテゴリ名を取り出す
                                const labelParts = context.label.split(':');
                                const catName = labelParts[0] || context.label;
                                return ` ${catName}: ¥${value.toLocaleString()} (${pct}%)`;
                            }
                        }
                    }
                }
            }
        });
        categoryDoughnutCharts.push(chart);
    });
}

function updateShareCharts(monthlyTxns) {
    const spends = {};
    Object.keys(categoryMeta).forEach(k => spends[k] = 0);
    
    let total = 0;
    monthlyTxns.forEach(t => t.items.forEach(item => {
        const cat = item.category || 'others';
        spends[cat] += item.price;
        total += item.price;
    }));
    
    const labels = [];
    const data = [];
    const colors = [];
    
    if (total === 0) {
        labels.push('データなし');
        data.push(1);
        colors.push('rgba(255, 255, 255, 0.08)');
    } else {
        Object.entries(categoryMeta).forEach(([key, meta]) => {
            if (spends[key] > 0) {
                const pct = ((spends[key] / total) * 100).toFixed(1);
                labels.push(`${meta.label}: ¥${spends[key].toLocaleString()} (${pct}%)`);
                data.push(spends[key]);
                colors.push(meta.color);
            }
        });
    }
    
    categoryDoughnutCharts.forEach(chart => {
        chart.data.labels = labels;
        chart.data.datasets[0].data = data;
        chart.data.datasets[0].backgroundColor = colors;
        chart.update();
    });
}

// 22. Detailed Analytics View
function updateAnalyticsView() {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth() + 1;
    
    // Navigator should always stay visible in Analytics to allow navigating quarters and years
    const navPanel = el('analyticsMonthNav');
    if (navPanel) {
        navPanel.style.display = 'flex';
    }
    
    let labels = [];
    let titleStr = '';
    let datasetTxns = [];
    let tableAndRankingTxns = [];
    
    if (analyticsPeriod === 'month') {
        titleStr = `${year}年${String(month).padStart(2, '0')}月 の詳細内訳`;
        const daysCount = new Date(year, month, 0).getDate();
        for (let i = 1; i <= daysCount; i++) {
            labels.push(`${i}日`);
        }
        datasetTxns = getMonthlyResolvedTransactions(year, month);
        tableAndRankingTxns = datasetTxns;
    } else if (analyticsPeriod === 'quarter') {
        const quarterIndex = Math.ceil(month / 3);
        titleStr = `${year}年 Q${quarterIndex} (第${quarterIndex}四半期) の集計と推移`;
        labels = [`Q1 (1-3月)`, `Q2 (4-6月)`, `Q3 (7-9月)`, `Q4 (10-12月)`];
        
        // Fetch all year data for the stacked bar trend chart
        for (let m = 1; m <= 12; m++) {
            datasetTxns = datasetTxns.concat(getMonthlyResolvedTransactions(year, m));
        }
        
        // Filter table/rankings to only the selected quarter
        const startMonthOfQuarter = (quarterIndex - 1) * 3 + 1;
        const quarterMonths = [startMonthOfQuarter, startMonthOfQuarter + 1, startMonthOfQuarter + 2];
        quarterMonths.forEach(m => {
            tableAndRankingTxns.push(...getMonthlyResolvedTransactions(year, m));
        });
    } else if (analyticsPeriod === 'year') {
        titleStr = `${year}年 年間支出の集計と推移`;
        for (let m = 1; m <= 12; m++) {
            labels.push(`${m}月`);
            datasetTxns = datasetTxns.concat(getMonthlyResolvedTransactions(year, m));
        }
        tableAndRankingTxns = datasetTxns;
    }
    
    if (el('trendChartTitle')) el('trendChartTitle').textContent = titleStr;
    
    // Prepare datasets for stacked bar chart (16 categories)
    const datasets = [];
    const catKeys = Object.keys(categoryMeta);
    catKeys.forEach(k => {
        datasets.push({
            label: categoryMeta[k].label,
            backgroundColor: categoryMeta[k].color,
            borderColor: categoryMeta[k].color,
            borderWidth: 0,
            data: new Array(labels.length).fill(0),
            stack: 'stack-group'
        });
    });
    
    datasetTxns.forEach(t => {
        let labelIndex = -1;
        const d = new Date(t.date);
        const tMonth = d.getMonth() + 1;
        
        if (analyticsPeriod === 'month') {
            labelIndex = parseInt(t.date.split('-')[2]) - 1;
        } else if (analyticsPeriod === 'quarter') {
            labelIndex = Math.ceil(tMonth / 3) - 1;
        } else if (analyticsPeriod === 'year') {
            labelIndex = tMonth - 1;
        }
        
        if (labelIndex >= 0 && labelIndex < labels.length) {
            t.items.forEach(item => {
                const catIndex = catKeys.indexOf(item.category || 'others');
                if (catIndex > -1) {
                    datasets[catIndex].data[labelIndex] += item.price;
                }
            });
        }
    });
    
    // Render Stacked Bar Chart
    const canvas = el('trendChart');
    if (canvas) {
        if (trendChartInstance) trendChartInstance.destroy();
        const ctx = canvas.getContext('2d');
        trendChartInstance = new Chart(ctx, {
            type: 'bar',
            data: { labels: labels, datasets: datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { stacked: true, grid: { color: getChartGridColor() }, ticks: { color: getChartTextColor(), font: { size: 9 } } },
                    y: { stacked: true, grid: { color: getChartGridColor() }, ticks: { color: getChartTextColor(), font: { size: 9 } }, beginAtZero: true }
                },
                plugins: {
                    legend: { display: false }, // Legend too large for mobile stack
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.raw === 0 ? null : `${context.dataset.label}: ¥${context.raw.toLocaleString()}`;
                            }
                        }
                    }
                }
            }
        });

        // グラフ下部の動的凡例の生成（枠線を廃止し、フォントサイズを縮小してパーセント割合を追加）
        const legendContainer = el('trendChartLegend');
        if (legendContainer) {
            legendContainer.innerHTML = '';
            const categoryTotals = {};
            catKeys.forEach(k => categoryTotals[k] = 0);
            
            datasetTxns.forEach(t => {
                t.items.forEach(item => {
                    const cat = item.category || 'others';
                    if (categoryTotals[cat] !== undefined) {
                        categoryTotals[cat] += item.price;
                    }
                });
            });

            // 期間中の合計支出を計算
            let periodTotal = 0;
            Object.values(categoryTotals).forEach(v => periodTotal += v);

            Object.entries(categoryMeta).forEach(([key, meta]) => {
                const spent = categoryTotals[key] || 0;
                if (spent > 0) {
                    const pct = periodTotal > 0 ? ((spent / periodTotal) * 100).toFixed(1) : '0.0';
                    const legendItem = document.createElement('div');
                    legendItem.style.display = 'inline-flex';
                    legendItem.style.alignItems = 'center';
                    legendItem.style.gap = '5px';
                    legendItem.style.fontSize = '0.62rem';
                    legendItem.style.color = 'var(--text-muted)';
                    legendItem.style.cursor = 'pointer';
                    legendItem.style.padding = '2px 4px';
                    legendItem.addEventListener('click', () => showCategoryItems(key));
                    legendItem.innerHTML = `
                        <span class="cat-dot" style="background-color: ${meta.color}; width:6px; height:6px; border-radius:50%; display:inline-block;"></span>
                        <span style="font-weight:600; color:var(--text-main);">${meta.label}:</span>
                        <span style="color:var(--text-main);">¥${spent.toLocaleString()}</span>
                        <span style="font-size:0.58rem; color:var(--text-muted); font-weight:normal;">(${pct}%)</span>
                    `;
                    legendContainer.appendChild(legendItem);
                }
            });
        }
    }
    
    // Update category analysis table
    const tableBody = el('categoryAnalysisTableBody');
    if (tableBody) {
        tableBody.innerHTML = '';
        const catTotals = {};
        catKeys.forEach(k => catTotals[k] = 0);
        tableAndRankingTxns.forEach(t => t.items.forEach(i => catTotals[i.category || 'others'] += i.price));
        
        let activeBudget = getBudgetForPeriod(analyticsPeriod, currentMonth);
        const sortedCats = catKeys.map(k => ({ key: k, spent: catTotals[k] })).sort((a, b) => b.spent - a.spent);
        
        sortedCats.forEach(sc => {
            if (sc.spent > 0 || (activeBudget[sc.key] && activeBudget[sc.key] > 0)) {
                const meta = categoryMeta[sc.key];
                const budgetVal = activeBudget[sc.key] || 0;
                let percentText = '-';
                let isOver = false;
                
                if (budgetVal > 0) {
                    percentText = `${Math.round((sc.spent / budgetVal) * 100)}%`;
                    isOver = sc.spent > budgetVal;
                }
                
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="display:flex;align-items:center;gap:8px;cursor:pointer;text-decoration:underline;text-underline-offset:3px;" onclick="showCategoryItems('${sc.key}')"><span class="cat-dot" style="background-color:${meta.color}"></span>${meta.label}</td>
                    <td style="text-align:right;">¥${sc.spent.toLocaleString()}</td>
                    <td style="text-align:right;color:var(--text-muted);">${budgetVal > 0 ? '¥' + budgetVal.toLocaleString() : '未設定'}</td>
                    <td style="text-align:right;font-weight:700;" class="${isOver ? 'text-red-500' : ''}">${percentText}</td>
                `;
                tableBody.appendChild(tr);
            }
        });
    }
    
    // Rankings lists updates
    renderRankings(tableAndRankingTxns);
    updateShareCharts(tableAndRankingTxns);
}

function renderRankings(datasetTxns) {
    const itemsList = el('topExpensiveItemsList');
    const storesList = el('topStoresList');
    
    if (itemsList) {
        itemsList.innerHTML = '';
        let allItems = [];
        datasetTxns.forEach(t => {
            t.items.forEach(i => {
                allItems.push({ name: i.name, price: i.price, date: t.date, store: t.storeName, category: i.category, txnId: t.id });
            });
        });
        
        // Sort price desc
        allItems.sort((a, b) => b.price - a.price);
        
        const top10Items = allItems.slice(0, 10);
        if (top10Items.length === 0) {
            itemsList.innerHTML = '<div class="empty-state" style="padding:16px;">ランキングデータがありません</div>';
        } else {
            top10Items.forEach((item, index) => {
                const badgeMeta = categoryMeta[item.category || 'others'] || categoryMeta.others;
                const li = document.createElement('li');
                li.className = 'ranking-item';
                li.style.cursor = 'pointer';
                li.title = 'クリックして編集';
                li.addEventListener('click', () => {
                    window.editTransactionItem(item.txnId);
                });
                li.innerHTML = `
                    <div class="ranking-left-info">
                        <span class="ranking-index">${index + 1}</span>
                        <div class="ranking-name-desc">
                            <div class="ranking-main-name">${item.name}</div>
                            <div class="ranking-sub-desc">${item.store} | ${item.date} <span class="badge ${badgeMeta.class}" style="padding:0px 4px;font-size:7px;">${badgeMeta.label}</span></div>
                        </div>
                    </div>
                    <span class="ranking-price">¥${item.price.toLocaleString()}</span>
                `;
                itemsList.appendChild(li);
            });
        }
    }
    
    if (storesList) {
        storesList.innerHTML = '';
        const storeGroups = {};
        datasetTxns.forEach(t => {
            if (!storeGroups[t.storeName]) {
                storeGroups[t.storeName] = { count: 0, total: 0 };
            }
            storeGroups[t.storeName].count += 1;
            storeGroups[t.storeName].total += t.total;
        });
        
        const sortedStores = Object.keys(storeGroups)
            .map(k => ({ name: k, count: storeGroups[k].count, total: storeGroups[k].total }))
            .sort((a, b) => b.count - a.count); // sort by frequency
            
        const top10Stores = sortedStores.slice(0, 10);
        if (top10Stores.length === 0) {
            storesList.innerHTML = '<div class="empty-state" style="padding:16px;">ランキングデータがありません</div>';
        } else {
            top10Stores.forEach((st, index) => {
                const li = document.createElement('li');
                li.className = 'ranking-item';
                li.innerHTML = `
                    <div class="ranking-left-info">
                        <span class="ranking-index">${index + 1}</span>
                        <div class="ranking-name-desc">
                            <div class="ranking-main-name">${st.name}</div>
                            <div class="ranking-sub-desc">利用回数: ${st.count} 回</div>
                        </div>
                    </div>
                    <span class="ranking-price">¥${st.total.toLocaleString()}</span>
                `;
                storesList.appendChild(li);
            });
        }
    }
}

// 23. Budgets settings & listings (Category-specific)
function saveBudgetPeriodConfig() {
    const category = el('budgetCategory').value;
    const amount = parseInt(el('budgetAmount').value) || 0;
    const startMonth = el('budgetStartDate').value;
    const endMonth = el('budgetEndDate').value;
    
    if (!category || amount <= 0 || !startMonth || !endMonth) {
        showToast('必須項目をすべて入力してください。', 'error');
        return;
    }
    
    if (startMonth > endMonth) {
        showToast('開始月は終了月より前の月を選択してください。', 'error');
        return;
    }
    
    const [sy, sm] = startMonth.split('-');
    const [ey, em] = endMonth.split('-');
    const startDate = `${sy}-${sm}-01`;
    const lastDay = new Date(ey, em, 0).getDate();
    const endDate = `${ey}-${em}-${lastDay}`;
    
    if (editingBudgetPeriodId) {
        const index = budgets.findIndex(b => b.id === editingBudgetPeriodId);
        if (index > -1) {
            budgets[index] = {
                ...budgets[index],
                category,
                amount,
                startDate,
                endDate
            };
            showToast('予算設定を更新しました。', 'success');
        }
    } else {
        budgets.push({
            id: 'bgt-' + Date.now().toString(),
            category,
            amount,
            startDate,
            endDate
        });
        showToast('カテゴリ予算を設定しました。', 'success');
    }
    
    saveData('budgets');
    resetBudgetConfigForm();
    renderBudgetsList();
    updateDashboard();
    updateBudgetTrendChart();
}

function renderBudgetsList() {
    const container = el('budgetPeriodsList');
    if (!container) return;
    container.innerHTML = '';
    
    // Sort desc start date
    const sorted = [...budgets].sort((a, b) => b.startDate.localeCompare(a.startDate) || a.category.localeCompare(b.category));
    
    if (sorted.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>設定されたカテゴリ別予算はありません。</p></div>';
        return;
    }
    
    sorted.forEach(b => {
        const startLabel = b.startDate.substring(0, 7).replace('-', '年') + '月';
        const endLabel = b.endDate.substring(0, 7).replace('-', '年') + '月';
        const meta = categoryMeta[b.category] || categoryMeta.others;
        
        const card = document.createElement('div');
        card.className = 'budget-period-card';
        card.innerHTML = `
            <div class="budget-period-header" style="margin-bottom:0;">
                <div style="width: calc(100% - 80px);">
                    <div class="budget-period-title" style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 4px;">
                        <span class="badge ${meta.class}" style="flex-shrink: 0;">${meta.label}</span>
                        <span style="white-space: nowrap; font-size: 0.85rem; font-weight: 500; color: var(--text-muted);">${startLabel} 〜 ${endLabel}</span>
                    </div>
                    <span style="font-size:0.9rem; font-weight:700; color:var(--accent);">予算: ¥${b.amount.toLocaleString()} / 月</span>
                </div>
                <div class="budget-period-actions">
                    <button class="period-action-btn" onclick="editBudgetPeriod('${b.id}')" title="編集"><i data-lucide="edit-2"></i></button>
                    <button class="period-action-btn delete" onclick="deleteBudgetPeriod('${b.id}')" title="削除"><i data-lucide="trash-2"></i></button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
    
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

window.editBudgetPeriod = function(id) {
    const b = budgets.find(x => x.id === id);
    if (!b) return;
    
    editingBudgetPeriodId = id;
    if (el('budgetFormTitle')) el('budgetFormTitle').innerHTML = '<i data-lucide="edit" style="color:var(--primary)"></i> 予算の編集';
    
    if (el('budgetCategory')) el('budgetCategory').value = b.category;
    if (el('budgetAmount')) el('budgetAmount').value = b.amount;
    if (el('budgetStartDate')) el('budgetStartDate').value = b.startDate.substring(0, 7);
    if (el('budgetEndDate')) el('budgetEndDate').value = b.endDate.substring(0, 7);
    
    if (el('budgetCategory')) el('budgetCategory').scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (typeof lucide !== 'undefined') lucide.createIcons();
};

window.deleteBudgetPeriod = function(id) {
    if (!confirm('この予算設定を削除しますか？')) return;
    budgets = budgets.filter(b => b.id !== id);
    saveData('budgets');
    renderBudgetsList();
    updateDashboard();
    updateBudgetTrendChart();
    showToast('予算設定を削除しました。', 'info');
};

function resetBudgetConfigForm() {
    editingBudgetPeriodId = null;
    if (el('budgetFormTitle')) el('budgetFormTitle').innerHTML = '<i data-lucide="plus-circle" style="color:var(--accent);"></i> カテゴリ別予算の新規作成';
    if (el('budgetCategory')) el('budgetCategory').value = '';
    if (el('budgetAmount')) el('budgetAmount').value = '';
    if (el('budgetStartDate')) el('budgetStartDate').value = '';
    if (el('budgetEndDate')) el('budgetEndDate').value = '';
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// 24. Recurring Costs settings & listings
function saveRecurringExpenseConfig() {
    const name = el('recurringName').value.trim();
    const amount = parseInt(el('recurringAmount').value) || 0;
    const category = el('recurringCategory').value;
    const startDate = el('recurringStartDate').value;
    const endDate = el('recurringEndDate').value;
    
    if (!name || amount <= 0 || !category || !startDate) {
        showToast('必須項目を入力してください（項目名、金額、カテゴリ、適用開始日）。', 'error');
        return;
    }
    
    if (editingRecurringId) {
        const index = recurringExpenses.findIndex(r => r.id === editingRecurringId);
        if (index > -1) {
            recurringExpenses[index] = {
                ...recurringExpenses[index],
                name, amount, category, startDate, endDate
            };
            showToast('固定費設定を更新しました。', 'success');
        }
    } else {
        recurringExpenses.push({
            id: 'rec-' + Date.now().toString(),
            name, amount, category, startDate, endDate
        });
        showToast('固定費を設定しました。', 'success');
    }
    
    saveData('recurring');
    resetRecurringConfigForm();
    renderRecurringList();
    updateDashboard();
    updateBudgetTrendChart();
}

function renderRecurringList() {
    const container = el('recurringPeriodsList');
    if (!container) return;
    container.innerHTML = '';
    
    if (recurringExpenses.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>登録された固定費はありません。</p></div>';
        return;
    }
    
    recurringExpenses.forEach(r => {
        const catMeta = categoryMeta[r.category] || categoryMeta.others;
        const endLabel = r.endDate ? ` 〜 ${r.endDate}` : ' 〜 継続的';
        
        const card = document.createElement('div');
        card.className = 'budget-period-card';
        card.innerHTML = `
            <div class="budget-period-header" style="margin-bottom:0;">
                <div>
                    <div class="budget-period-title">${r.name} <span class="badge ${catMeta.class}" style="margin-left:6px;">${catMeta.label}</span></div>
                    <span style="font-size:0.88rem;font-weight:700;color:var(--accent);">¥${r.amount.toLocaleString()} / 月</span>
                    <div style="font-size:0.74rem;color:var(--text-muted);margin-top:2px;">適用: ${r.startDate}${endLabel}</div>
                </div>
                <div class="budget-period-actions">
                    <button class="period-action-btn" onclick="editRecurringExpense('${r.id}')" title="編集"><i data-lucide="edit-2"></i></button>
                    <button class="period-action-btn delete" onclick="deleteRecurringExpense('${r.id}')" title="削除"><i data-lucide="trash-2"></i></button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
    
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

window.editRecurringExpense = function(id) {
    const r = recurringExpenses.find(x => x.id === id);
    if (!r) return;
    
    editingRecurringId = id;
    if (el('recurringFormTitle')) el('recurringFormTitle').innerHTML = '<i data-lucide="edit" style="color:var(--primary)"></i> 固定費の編集';
    
    el('recurringName').value = r.name;
    el('recurringAmount').value = r.amount;
    el('recurringCategory').value = r.category;
    el('recurringStartDate').value = r.startDate;
    el('recurringEndDate').value = r.endDate || '';
    
    el('recurringName').scrollIntoView({ behavior: 'smooth', block: 'center' });
};

window.deleteRecurringExpense = function(id) {
    if (!confirm('この固定費設定を削除しますか？')) return;
    recurringExpenses = recurringExpenses.filter(r => r.id !== id);
    saveData('recurring');
    renderRecurringList();
    updateDashboard();
    updateBudgetTrendChart();
    showToast('固定費設定を削除しました。', 'info');
};

function resetRecurringConfigForm() {
    editingRecurringId = null;
    if (el('recurringFormTitle')) el('recurringFormTitle').innerHTML = '<i data-lucide="plus-circle" style="color:var(--accent);"></i> 定期支出の新規作成';
    el('recurringName').value = '';
    el('recurringAmount').value = '';
    el('recurringCategory').value = '';
    el('recurringStartDate').value = '';
    el('recurringEndDate').value = '';
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// 25. CSV Backups System
function exportCSV() {
    if (transactions.length === 0) {
        showToast('エクスポートするデータがありません。', 'error');
        return;
    }
    
    // Add UTF-8 BOM to prevent Japanese Mojibake in Excel
    let csvContent = '\uFEFF';
    csvContent += "ID,店舗名,日付,税金,品目名,カテゴリ,単価,割引\n";
    
    transactions.forEach(t => {
        t.items.forEach(item => {
            const catLabel = categoryMeta[item.category]?.label || 'その他';
            const escapedStore = t.storeName.replace(/"/g, '""');
            const escapedItem = item.name.replace(/"/g, '""');
            csvContent += `${t.id},"${escapedStore}",${t.date},${t.tax || 0},"${escapedItem}",${catLabel},${item.price},${item.discount || 0}\n`;
        });
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `smartreceipt_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('CSVデータを出力しました。', 'success');
}

function importCSV(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const lines = event.target.result.split('\n').map(l => l.trim()).filter(l => l.length > 0);
            if (lines.length <= 1) {
                showToast('インポート可能なデータがありません。', 'error');
                return;
            }
            
            // Build inverted label map
            const labelMap = {};
            Object.entries(categoryMeta).forEach(([k, v]) => labelMap[v.label] = k);
            
            const imported = {};
            
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i];
                const cols = [];
                let inQuotes = false;
                let colVal = '';
                
                // Parser for quoted commas
                for (let c = 0; c < line.length; c++) {
                    const char = line[c];
                    if (char === '"') {
                        inQuotes = !inQuotes;
                    } else if (char === ',' && !inQuotes) {
                        cols.push(colVal);
                        colVal = '';
                    } else {
                        colVal += char;
                    }
                }
                cols.push(colVal);
                
                if (cols.length < 8) continue;
                
                const id = cols[0].trim();
                const store = cols[1].trim();
                const date = cols[2].trim();
                const tax = parseInt(cols[3].trim()) || 0;
                const itemName = cols[4].trim();
                const categoryLabel = cols[5].trim();
                const price = parseInt(cols[6].trim()) || 0;
                const discount = parseInt(cols[7].trim()) || 0;
                
                const catKey = labelMap[categoryLabel] || 'others';
                
                if (!imported[id]) {
                    imported[id] = {
                        id: id,
                        storeName: store,
                        date: date,
                        tax: tax,
                        total: 0,
                        items: []
                    };
                }
                imported[id].items.push({ name: itemName, category: catKey, price: price, discount: discount });
                imported[id].total += Math.max(0, price - discount);
            }
            
            // Post-process imported totals to include tax
            Object.values(imported).forEach(newTxn => {
                newTxn.total += newTxn.tax || 0;
            });
            
            // Merge into transactions
            Object.values(imported).forEach(newTxn => {
                const existingIndex = transactions.findIndex(t => t.id === newTxn.id);
                if (existingIndex > -1) {
                    transactions[existingIndex] = newTxn;
                } else {
                    transactions.push(newTxn);
                }
            });
            
            saveData('transactions');
            updateDashboard();
            showToast('CSVデータをインポートしました。', 'success');
        } catch (err) {
            console.error(err);
            showToast('CSVパース中にエラーが発生しました。', 'error');
        }
    };
    reader.readAsText(file);
    e.target.value = '';
}

// 25. DOM Event bindings safely setup
function setupEventListeners() {
    // 1. API key settings modal toggles
    if (el('openSettingsBtn')) el('openSettingsBtn').addEventListener('click', () => openModal('settingsModal'));
    if (el('closeSettingsBtn')) el('closeSettingsBtn').addEventListener('click', () => closeModal('settingsModal'));
    if (el('saveApiKeyBtn')) el('saveApiKeyBtn').addEventListener('click', saveApiKey);
    if (el('clearApiKeyBtn')) el('clearApiKeyBtn').addEventListener('click', clearApiKey);
    if (el('resetDbBtn')) el('resetDbBtn').addEventListener('click', resetDatabase);
    
    // Theme toggle button click listener
    if (el('themeToggleBtn')) {
        el('themeToggleBtn').addEventListener('click', () => {
            const current = localStorage.getItem('smartreceipt_theme') || 'dark';
            const next = current === 'dark' ? 'light' : 'dark';
            applyTheme(next);
        });
    }
    
    // 2. CSV Backups buttons
    if (el('exportCsvBtn')) el('exportCsvBtn').addEventListener('click', exportCSV);
    if (el('importCsvBtn')) el('importCsvBtn').addEventListener('click', () => {
        if (el('csvFileInput')) el('csvFileInput').click();
    });
    if (el('csvFileInput')) el('csvFileInput').addEventListener('change', importCSV);
    
    // 3. Receipt Scan Card Actions
    const dropzone = el('dropzone');
    if (dropzone) {
        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.style.borderColor = 'var(--primary)';
            dropzone.style.background = 'rgba(99, 102, 241, 0.08)';
        });
        dropzone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            dropzone.style.borderColor = '';
            dropzone.style.background = '';
        });
        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.style.borderColor = '';
            dropzone.style.background = '';
            
            if (e.dataTransfer.files.length > 0) {
                const imageFiles = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
                if (imageFiles.length === 1) {
                    processSingleReceipt(imageFiles[0]);
                } else if (imageFiles.length > 1) {
                    processMultipleReceipts(imageFiles);
                }
            }
        });
        dropzone.addEventListener('click', () => {
            if (el('fileInput')) el('fileInput').click();
        });
    }
    if (el('fileInput')) el('fileInput').addEventListener('change', handleFileUpload);
    
    // 4. Quick Actions
    if (el('manualInputBtn')) el('manualInputBtn').addEventListener('click', startManualInputForm);
    if (el('startCameraBtn')) el('startCameraBtn').addEventListener('click', startContinuousCamera);
    
    // 5. Editor Buttons
    if (el('addItemBtn')) el('addItemBtn').addEventListener('click', () => addEditorItemRow('', 0, 0, 'others'));
    if (el('saveReceiptBtn')) el('saveReceiptBtn').addEventListener('click', saveCurrentTransaction);
    if (el('receiptTax')) el('receiptTax').addEventListener('input', calculateTotalFromItems);
    
    // 6. Camera Overlay controls
    if (el('closeCameraBtn')) el('closeCameraBtn').addEventListener('click', stopContinuousCamera);
    if (el('shutterBtn')) el('shutterBtn').addEventListener('click', captureCameraSnapshot);
    if (el('processCapturedBtn')) el('processCapturedBtn').addEventListener('click', processCapturedBatches);
    
    // 7. Day Detail Modal Close
    if (el('closeDayDetailBtn')) el('closeDayDetailBtn').addEventListener('click', () => closeModal('dayDetailModal'));
    if (el('closeDayDetailModalBtn')) el('closeDayDetailModalBtn').addEventListener('click', () => closeModal('dayDetailModal'));
    
    // 8. Budget Config buttons
    if (el('saveBudgetBtn')) el('saveBudgetBtn').addEventListener('click', saveBudgetPeriodConfig);
    if (el('resetBudgetFormBtn')) el('resetBudgetFormBtn').addEventListener('click', resetBudgetConfigForm);
    
    // 9. Recurring Config buttons
    if (el('saveRecurringBtn')) el('saveRecurringBtn').addEventListener('click', saveRecurringExpenseConfig);
    if (el('resetRecurringFormBtn')) el('resetRecurringFormBtn').addEventListener('click', resetRecurringConfigForm);
    
    // 10. Analytics Period toggler
    qsa('#analyticsPeriodToggle .toggle-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            qsa('#analyticsPeriodToggle .toggle-btn').forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            analyticsPeriod = e.currentTarget.getAttribute('data-period');
            updateAnalyticsView();
        });
    });

    // 11. Calendar Event Delegation
    const calendarGrid = qs('.calendarGrid');
    if (calendarGrid) {
        calendarGrid.addEventListener('click', (e) => {
            const cell = e.target.closest('.calendar-day');
            if (cell && !cell.classList.contains('empty')) {
                const dateStr = cell.getAttribute('data-date');
                if (!dateStr) return;
                
                activeFilterDate = dateStr;
                
                // Fetch the transactions matching this day
                const year = currentMonth.getFullYear();
                const month = currentMonth.getMonth() + 1;
                const monthlyTxns = getMonthlyResolvedTransactions(year, month);
                const dayTxns = monthlyTxns.filter(t => t.date === dateStr);
                const dayTotal = dayTxns.reduce((sum, t) => sum + t.total, 0);
                
                openDayDetailsModal(dateStr, dayTotal, dayTxns);
                renderCalendar(monthlyTxns);
                renderRecentHistory(monthlyTxns);
            }
        });
    }
    
    // 12. Budget Trend Start Month Selector Change Event
    if (el('budgetTrendStartMonth')) {
        el('budgetTrendStartMonth').addEventListener('change', updateBudgetTrendChart);
    }
    
    // 13. Category items popup modal sort change & close events
    if (el('categoryItemsSort')) {
        el('categoryItemsSort').addEventListener('change', renderCategoryItems);
    }
    if (el('closeCategoryItemsBtn')) {
        el('closeCategoryItemsBtn').addEventListener('click', () => closeModal('categoryItemsModal'));
    }
    if (el('closeCategoryItemsModalBtn')) {
        el('closeCategoryItemsModalBtn').addEventListener('click', () => closeModal('categoryItemsModal'));
    }
    
    // 14. Click outside modal overlays to close them
    qsa('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                // If it is the editor panel, trigger standard cancel logic to clean up state
                if (overlay.id === 'editorPanel') {
                    if (typeof cancelEditor === 'function') {
                        cancelEditor();
                    } else {
                        closeModal(overlay.id);
                    }
                } else {
                    closeModal(overlay.id);
                }
            }
        });
    });
}

// 26. Stacked Bar Chart for monthly budget composition trend
function updateBudgetTrendChart() {
    const canvas = el('budgetTrendChart');
    if (!canvas) return;
    
    // 開始年月の取得
    let startDate = currentMonth; // デフォルトは現在の表示月
    const startInput = el('budgetTrendStartMonth');
    if (startInput && startInput.value) {
        const [sy, sm] = startInput.value.split('-');
        startDate = new Date(parseInt(sy), parseInt(sm) - 1, 15);
    } else if (startInput) {
        // インプットはあるが値が空の場合は初期設定
        const y = currentMonth.getFullYear();
        const m = String(currentMonth.getMonth() + 1).padStart(2, '0');
        startInput.value = `${y}-${m}`;
    }
    
    const startYear = startDate.getFullYear();
    const startMonth = startDate.getMonth(); // 0-indexed
    
    const labels = [];
    const monthsData = [];
    
    // 開始年月から12ヶ月分のラベルと日付データを生成
    for (let i = 0; i < 12; i++) {
        const targetDate = new Date(startYear, startMonth + i, 15);
        const y = targetDate.getFullYear();
        const m = targetDate.getMonth() + 1;
        
        // 年が変わるタイミング、あるいは最初の月には年を表示する
        if (i === 0 || m === 1) {
            labels.push(`${y}年${m}月`);
        } else {
            labels.push(`${m}月`);
        }
        monthsData.push(targetDate);
    }
    
    const datasets = [];
    const catKeys = Object.keys(categoryMeta);
    catKeys.forEach(k => {
        datasets.push({
            label: categoryMeta[k].label,
            backgroundColor: categoryMeta[k].color,
            borderColor: categoryMeta[k].color,
            borderWidth: 0,
            data: new Array(12).fill(0),
            stack: 'budget-stack'
        });
    });
    
    // 各月の予算データを入れる
    monthsData.forEach((monthDate, monthIdx) => {
        const activeBudget = getActiveBudgetForMonth(monthDate);
        Object.entries(activeBudget).forEach(([cat, val]) => {
            const catIdx = catKeys.indexOf(cat);
            if (catIdx > -1) {
                datasets[catIdx].data[monthIdx] = val;
            }
        });
    });
    
    const ctx = canvas.getContext('2d');
    if (budgetTrendChartInstance) {
        budgetTrendChartInstance.destroy();
    }
    
    budgetTrendChartInstance = new Chart(ctx, {
        type: 'bar',
        data: { labels: labels, datasets: datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { stacked: true, grid: { color: getChartGridColor() }, ticks: { color: getChartTextColor(), font: { size: 9 } } },
                y: { 
                    stacked: true, 
                    grid: { color: getChartGridColor() }, 
                    ticks: { 
                        color: getChartTextColor(), 
                        font: { size: 9 },
                        // Y軸の縦軸（合計金額）に通貨単位を付与する
                        callback: function(value) {
                            return '¥' + value.toLocaleString();
                        }
                    }, 
                    beginAtZero: true 
                }
            },
            plugins: {
                legend: {
                    position: 'right',
                    labels: { boxWidth: 10, color: getChartTextColor(), font: { size: 9, family: 'Plus Jakarta Sans' } }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.raw === 0 ? null : `${context.dataset.label}: ¥${context.raw.toLocaleString()}`;
                        }
                    }
                }
            }
        }
    });
}

function resetDatabase() {
    if (!confirm("すべての家計簿データ、予算、固定費設定を完全に消去します。この操作は取り消せません。本当によろしいですか？")) {
        return;
    }
    localStorage.removeItem('receipt_transactions');
    localStorage.removeItem('receipt_budgets');
    localStorage.removeItem('receipt_recurring');
    
    transactions = [];
    budgets = [];
    recurringExpenses = [];
    
    // 空の状態でローカルストレージを同期
    saveData('transactions');
    saveData('budgets');
    saveData('recurring');
    
    // UI の更新
    updateDashboard();
    updateBudgetTrendChart();
    updateAnalyticsView();
    
    // API設定画面を含む設定モーダルを閉じる
    closeModal('settingsModal');
    showToast("データベースを初期化しました。", "success");
}
