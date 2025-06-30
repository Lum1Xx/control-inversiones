// Variables globales para ARS
let operations = [];
let journalEntries = [];
let totalCapital = 1000000; // Capital inicial en ARS
let performanceHistory = [];
let chart = null;

// DOM Elements (igual que en el original)
const totalCapitalElement = document.getElementById('total-capital');
const investedCapitalElement = document.getElementById('invested-capital');
const monthlyReturnElement = document.getElementById('monthly-return');
const totalReturnElement = document.getElementById('total-return');
const openTradesElement = document.getElementById('open-trades');
const closedTradesElement = document.getElementById('closed-trades');
const operationsTable = document.querySelector('#operations-table tbody');
const journalTable = document.querySelector('#journal-table tbody');
const operationForm = document.getElementById('operation-form');
const journalForm = document.getElementById('journal-form');
const operationModal = document.getElementById('operation-modal');
const journalModal = document.getElementById('journal-modal');
const addOperationBtn = document.getElementById('add-operation-btn');
const addJournalBtn = document.getElementById('add-journal-btn');
const exportBtn = document.getElementById('export-btn');
const importBtn = document.getElementById('import-btn');
const importFile = document.getElementById('import-file');
const assetFilter = document.getElementById('asset-filter');
const platformFilter = document.getElementById('platform-filter');
const statusFilter = document.getElementById('status-filter');
const themeSwitch = document.getElementById('checkbox');
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    setupEventListeners();
    updateDashboard();
    renderOperationsTable();
    renderJournalTable();
    initializeChart();
});

// Cargar datos del localStorage con prefijo ARS
function loadData() {
    const savedCapital = localStorage.getItem('ars_totalCapital');
    if (savedCapital) {
        totalCapital = parseFloat(savedCapital);
        totalCapitalElement.textContent = formatCurrency(totalCapital);
    }

    const savedOperations = localStorage.getItem('ars_operations');
    if (savedOperations) {
        operations = JSON.parse(savedOperations);
    }

    const savedJournal = localStorage.getItem('ars_journalEntries');
    if (savedJournal) {
        journalEntries = JSON.parse(savedJournal);
    }

    const savedPerformance = localStorage.getItem('ars_performanceHistory');
    if (savedPerformance) {
        performanceHistory = JSON.parse(savedPerformance);
    } else {
        // Inicializar con datos de ejemplo si no hay historial
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            performanceHistory.push({
                date: date.toISOString().split('T')[0],
                value: totalCapital
            });
        }
        savePerformanceHistory();
    }

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        themeSwitch.checked = false;
        document.querySelector('.theme-text').textContent = 'Modo claro';
    }
}

// Configurar event listeners (igual que en el original, pero guardando con prefijo ARS)
function setupEventListeners() {
    // Editar capital total
    totalCapitalElement.addEventListener('click', () => {
        const currentValue = parseFloat(totalCapitalElement.textContent.replace(/[^0-9.-]+/g, ''));
        const newValue = prompt('Ingrese el nuevo capital total:', currentValue);
        if (newValue !== null && !isNaN(newValue)) {
            totalCapital = parseFloat(newValue);
            totalCapitalElement.textContent = formatCurrency(totalCapital);
            localStorage.setItem('ars_totalCapital', totalCapital.toString());
            
            if (performanceHistory.length > 0) {
                performanceHistory[performanceHistory.length - 1].value = totalCapital;
                savePerformanceHistory();
                updateChart();
            }
            
            updateDashboard();
        }
    });

    // Operaciones
    addOperationBtn.addEventListener('click', () => openOperationModal());
    operationForm.addEventListener('submit', handleOperationSubmit);
    document.querySelector('.close').addEventListener('click', () => operationModal.style.display = 'none');

    // Diario
    addJournalBtn.addEventListener('click', () => openJournalModal());
    journalForm.addEventListener('submit', handleJournalSubmit);
    document.querySelectorAll('.close')[1].addEventListener('click', () => journalModal.style.display = 'none');

    // Filtros
    assetFilter.addEventListener('change', renderOperationsTable);
    platformFilter.addEventListener('change', renderOperationsTable);
    statusFilter.addEventListener('change', renderOperationsTable);

    // Importar/Exportar
    exportBtn.addEventListener('click', exportData);
    importBtn.addEventListener('click', () => importFile.click());
    importFile.addEventListener('change', importData);

    // Tema
    themeSwitch.addEventListener('change', toggleTheme);

    // Tabs
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            switchTab(tabId);
        });
    });

    // Cerrar modales al hacer clic fuera
    window.addEventListener('click', (event) => {
        if (event.target === operationModal) {
            operationModal.style.display = 'none';
        }
        if (event.target === journalModal) {
            journalModal.style.display = 'none';
        }
    });
}

// Funciones de operaciones (igual que en el original, pero guardando con prefijo ARS)
function openOperationModal(operationId = null) {
    const modalTitle = document.getElementById('modal-title');
    const form = document.getElementById('operation-form');
    
    if (operationId) {
        modalTitle.textContent = 'Editar Operación';
        const operation = operations.find(op => op.id === operationId);
        
        document.getElementById('operation-id').value = operation.id;
        document.getElementById('asset').value = operation.asset;
        document.getElementById('platform').value = operation.platform;
        document.getElementById('amount').value = operation.amount;
        document.getElementById('entry-price').value = operation.entryPrice;
        document.getElementById('entry-date').value = operation.entryDate;
        document.getElementById('current-price').value = operation.currentPrice || '';
        document.getElementById('exit-price').value = operation.exitPrice || '';
        document.getElementById('exit-date').value = operation.exitDate || '';
        document.getElementById('status').value = operation.status;
    } else {
        modalTitle.textContent = 'Nueva Operación';
        form.reset();
        document.getElementById('operation-id').value = '';
        document.getElementById('entry-date').value = new Date().toISOString().split('T')[0];
        document.getElementById('status').value = 'Abierta';
    }
    
    operationModal.style.display = 'block';
}

function handleOperationSubmit(e) {
    e.preventDefault();
    
    const id = document.getElementById('operation-id').value || generateId();
    const asset = document.getElementById('asset').value;
    const platform = document.getElementById('platform').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const entryPrice = parseFloat(document.getElementById('entry-price').value);
    const entryDate = document.getElementById('entry-date').value;
    const currentPrice = document.getElementById('current-price').value ? 
        parseFloat(document.getElementById('current-price').value) : null;
    const exitPrice = document.getElementById('exit-price').value ? 
        parseFloat(document.getElementById('exit-price').value) : null;
    const exitDate = document.getElementById('exit-date').value || null;
    const status = document.getElementById('status').value;
    
    let profitLoss = null;
    let profitLossPercent = null;
    
    if (status === 'Cerrada' && exitPrice) {
        profitLoss = (exitPrice - entryPrice) * (amount / entryPrice);
        profitLossPercent = ((exitPrice - entryPrice) / entryPrice) * 100;
    } else if (currentPrice) {
        profitLoss = (currentPrice - entryPrice) * (amount / entryPrice);
        profitLossPercent = ((currentPrice - entryPrice) / entryPrice) * 100;
    }
    
    const operation = {
        id,
        asset,
        platform,
        amount,
        entryPrice,
        entryDate,
        currentPrice,
        exitPrice,
        exitDate,
        status,
        profitLoss,
        profitLossPercent
    };
    
    const index = operations.findIndex(op => op.id === id);
    if (index !== -1) {
        operations[index] = operation;
    } else {
        operations.push(operation);
    }
    
    saveOperations();
    updateDashboard();
    renderOperationsTable();
    operationModal.style.display = 'none';
    updateFilters();
}

function deleteOperation(id) {
    if (confirm('¿Estás seguro de que quieres eliminar esta operación?')) {
        operations = operations.filter(op => op.id !== id);
        saveOperations();
        updateDashboard();
        renderOperationsTable();
        updateFilters();
    }
}

function renderOperationsTable() {
    operationsTable.innerHTML = '';
    
    const assetFilterValue = assetFilter.value;
    const platformFilterValue = platformFilter.value;
    const statusFilterValue = statusFilter.value;
    
    const filteredOperations = operations.filter(op => {
        return (assetFilterValue === '' || op.asset === assetFilterValue) &&
               (platformFilterValue === '' || op.platform === platformFilterValue) &&
               (statusFilterValue === '' || op.status === statusFilterValue);
    });
    
    if (filteredOperations.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="11" style="text-align: center;">No hay operaciones que coincidan con los filtros</td>`;
        operationsTable.appendChild(row);
        return;
    }
    
    filteredOperations.forEach(op => {
        const row = document.createElement('tr');
        
        let currentPriceDisplay = op.currentPrice ? op.currentPrice.toFixed(6) : '-';
        let exitPriceDisplay = op.exitPrice ? op.exitPrice.toFixed(6) : '-';
        
        let profitLossDisplay = '-';
        let profitLossClass = 'neutral';
        
        if (op.profitLoss !== null) {
            profitLossDisplay = `${op.profitLossPercent.toFixed(2)}% (${formatCurrency(op.profitLoss)})`;
            profitLossClass = op.profitLoss >= 0 ? 'positive' : 'negative';
        }
        
        row.innerHTML = `
            <td>${op.asset}</td>
            <td>${op.platform}</td>
            <td>${formatCurrency(op.amount)}</td>
            <td>${op.entryPrice.toFixed(6)}</td>
            <td>${formatDate(op.entryDate)}</td>
            <td>${currentPriceDisplay}</td>
            <td>${exitPriceDisplay}</td>
            <td>${op.exitDate ? formatDate(op.exitDate) : '-'}</td>
            <td>${op.status}</td>
            <td class="${profitLossClass}">${profitLossDisplay}</td>
            <td>
                <button class="action-btn edit" onclick="openOperationModal('${op.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete" onclick="deleteOperation('${op.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        operationsTable.appendChild(row);
    });
}

// Funciones del diario (igual que en el original, pero guardando con prefijo ARS)
function openJournalModal(entryId = null) {
    const modalTitle = document.getElementById('journal-modal-title');
    const form = document.getElementById('journal-form');
    
    if (entryId) {
        modalTitle.textContent = 'Editar Entrada del Diario';
        const entry = journalEntries.find(e => e.id === entryId);
        
        document.getElementById('journal-id').value = entry.id;
        document.getElementById('journal-date').value = entry.date;
        document.getElementById('journal-asset').value = entry.asset;
        document.getElementById('journal-reason').value = entry.reason;
        document.getElementById('journal-result').value = entry.result;
        document.getElementById('journal-reflection').value = entry.reflection;
        document.getElementById('journal-emotion').value = entry.emotion;
    } else {
        modalTitle.textContent = 'Nueva Entrada en el Diario';
        form.reset();
        document.getElementById('journal-id').value = '';
        document.getElementById('journal-date').value = new Date().toISOString().split('T')[0];
    }
    
    journalModal.style.display = 'block';
}

function handleJournalSubmit(e) {
    e.preventDefault();
    
    const id = document.getElementById('journal-id').value || generateId();
    const date = document.getElementById('journal-date').value;
    const asset = document.getElementById('journal-asset').value;
    const reason = document.getElementById('journal-reason').value;
    const result = document.getElementById('journal-result').value;
    const reflection = document.getElementById('journal-reflection').value;
    const emotion = document.getElementById('journal-emotion').value;
    
    const entry = {
        id,
        date,
        asset,
        reason,
        result,
        reflection,
        emotion
    };
    
    const index = journalEntries.findIndex(e => e.id === id);
    if (index !== -1) {
        journalEntries[index] = entry;
    } else {
        journalEntries.push(entry);
    }
    
    journalEntries.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    saveJournal();
    renderJournalTable();
    journalModal.style.display = 'none';
}

function deleteJournalEntry(id) {
    if (confirm('¿Estás seguro de que quieres eliminar esta entrada del diario?')) {
        journalEntries = journalEntries.filter(e => e.id !== id);
        saveJournal();
        renderJournalTable();
    }
}

function renderJournalTable() {
    journalTable.innerHTML = '';
    
    if (journalEntries.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="7" style="text-align: center;">No hay entradas en el diario</td>`;
        journalTable.appendChild(row);
        return;
    }
    
    journalEntries.forEach(entry => {
        const row = document.createElement('tr');
        
        const resultClass = entry.result === 'Ganancia' ? 'positive' : 
                          entry.result === 'Pérdida' ? 'negative' : 'neutral';
        
        row.innerHTML = `
            <td>${formatDate(entry.date)}</td>
            <td>${entry.asset}</td>
            <td>${entry.reason.substring(0, 50)}${entry.reason.length > 50 ? '...' : ''}</td>
            <td class="${resultClass}">${entry.result}</td>
            <td>${entry.reflection.substring(0, 50)}${entry.reflection.length > 50 ? '...' : ''}</td>
            <td>${entry.emotion}</td>
            <td>
                <button class="action-btn edit" onclick="openJournalModal('${entry.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete" onclick="deleteJournalEntry('${entry.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        journalTable.appendChild(row);
    });
}

// Funciones del dashboard (igual que en el original)
function updateDashboard() {
    totalCapitalElement.textContent = formatCurrency(totalCapital);
    
    const investedCapital = operations
        .filter(op => op.status === 'Abierta')
        .reduce((sum, op) => sum + op.amount, 0);
    investedCapitalElement.textContent = formatCurrency(investedCapital);
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthlyProfit = operations
        .filter(op => {
            if (op.status === 'Cerrada' && op.exitDate) {
                const exitDate = new Date(op.exitDate);
                return exitDate.getMonth() === currentMonth && exitDate.getFullYear() === currentYear;
            }
            return false;
        })
        .reduce((sum, op) => sum + (op.profitLoss || 0), 0);
    
    const monthlyReturnPercent = totalCapital > 0 ? (monthlyProfit / totalCapital) * 100 : 0;
    monthlyReturnElement.textContent = `${monthlyReturnPercent.toFixed(2)}%`;
    
    const totalProfit = operations
        .filter(op => op.status === 'Cerrada')
        .reduce((sum, op) => sum + (op.profitLoss || 0), 0);
    totalReturnElement.textContent = formatCurrency(totalProfit);
    
    const openTrades = operations.filter(op => op.status === 'Abierta').length;
    const closedTrades = operations.filter(op => op.status === 'Cerrada').length;
    openTradesElement.textContent = openTrades;
    closedTradesElement.textContent = closedTrades;
    
    updatePerformanceHistory();
}

function updatePerformanceHistory() {
    const today = new Date().toISOString().split('T')[0];
    const lastEntry = performanceHistory[performanceHistory.length - 1];
    
    if (lastEntry && lastEntry.date === today) {
        lastEntry.value = totalCapital;
    } else {
        performanceHistory.push({
            date: today,
            value: totalCapital
        });
        
        if (performanceHistory.length > 30) {
            performanceHistory.shift();
        }
    }
    
    savePerformanceHistory();
    updateChart();
}

// Funciones del gráfico (igual que en el original)
function initializeChart() {
    const ctx = document.getElementById('performance-chart').getContext('2d');
    
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: performanceHistory.map(entry => formatDate(entry.date)),
            datasets: [{
                label: 'Evolución del Capital',
                data: performanceHistory.map(entry => entry.value),
                borderColor: '#4e73df',
                backgroundColor: 'rgba(78, 115, 223, 0.05)',
                borderWidth: 2,
                fill: true,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return formatCurrency(context.raw);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            }
        }
    });
}

function updateChart() {
    if (!chart) return;
    
    chart.data.labels = performanceHistory.map(entry => formatDate(entry.date));
    chart.data.datasets[0].data = performanceHistory.map(entry => entry.value);
    chart.update();
}

// Funciones de filtros (igual que en el original)
function updateFilters() {
    const assets = [...new Set(operations.map(op => op.asset))].sort();
    assetFilter.innerHTML = '<option value="">Todos los activos</option>';
    assets.forEach(asset => {
        assetFilter.innerHTML += `<option value="${asset}">${asset}</option>`;
    });
    
    const platforms = [...new Set(operations.map(op => op.platform))].sort();
    platformFilter.innerHTML = '<option value="">Todas las plataformas</option>';
    platforms.forEach(platform => {
        platformFilter.innerHTML += `<option value="${platform}">${platform}</option>`;
    });
}

// Funciones de importación/exportación (igual que en el original, pero con prefijo ARS)
function exportData() {
    const data = {
        operations,
        journalEntries,
        totalCapital,
        performanceHistory,
        version: '1.0',
        exportedAt: new Date().toISOString(),
        currency: 'ARS'
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `investment-dashboard-ars-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            
            if (confirm('¿Estás seguro de que quieres importar estos datos? Se sobrescribirán los datos actuales.')) {
                if (data.operations) operations = data.operations;
                if (data.journalEntries) journalEntries = data.journalEntries;
                if (data.totalCapital) {
                    totalCapital = data.totalCapital;
                    totalCapitalElement.textContent = formatCurrency(totalCapital);
                    localStorage.setItem('ars_totalCapital', totalCapital.toString());
                }
                if (data.performanceHistory) {
                    performanceHistory = data.performanceHistory;
                    savePerformanceHistory();
                }
                
                saveOperations();
                saveJournal();
                updateDashboard();
                renderOperationsTable();
                renderJournalTable();
                updateFilters();
                updateChart();
                
                alert('Datos importados correctamente.');
            }
        } catch (error) {
            alert('Error al importar los datos: ' + error.message);
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

// Funciones de tema (igual que en el original)
function toggleTheme() {
    document.body.classList.toggle('light-mode');
    
    if (document.body.classList.contains('light-mode')) {
        localStorage.setItem('theme', 'light');
        document.querySelector('.theme-text').textContent = 'Modo claro';
    } else {
        localStorage.setItem('theme', 'dark');
        document.querySelector('.theme-text').textContent = 'Modo oscuro';
    }
    
    if (chart) {
        chart.update();
    }
}

// Funciones de tabs (igual que en el original)
function switchTab(tabId) {
    tabButtons.forEach(button => {
        if (button.getAttribute('data-tab') === tabId) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
    
    tabContents.forEach(content => {
        if (content.id === tabId) {
            content.classList.add('active');
        } else {
            content.classList.remove('active');
        }
    });
}

// Funciones de persistencia (con prefijo ARS)
function saveOperations() {
    localStorage.setItem('ars_operations', JSON.stringify(operations));
}

function saveJournal() {
    localStorage.setItem('ars_journalEntries', JSON.stringify(journalEntries));
}

function savePerformanceHistory() {
    localStorage.setItem('ars_performanceHistory', JSON.stringify(performanceHistory));
}

// Funciones de utilidad (igual que en el original)
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function formatCurrency(value) {
    return '$' + value.toLocaleString('es-AR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('es-ES', options);
}