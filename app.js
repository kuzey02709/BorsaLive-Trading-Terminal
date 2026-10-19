let stocks = [
    { symbol: 'BTCUSDT', name: 'Bitcoin', price: 65420.00, change: 2.45, currency: '$', history: [64000, 64500, 64800, 65000, 65200, 65100, 65300, 65420], isCrypto: true },
    { symbol: 'ETHUSDT', name: 'Ethereum', price: 3450.00, change: 1.80, currency: '$', history: [3380, 3400, 3420, 3410, 3430, 3440, 3445, 3450], isCrypto: true },
    { symbol: 'SOLUSDT', name: 'Solana', price: 152.50, change: -0.90, currency: '$', history: [156, 155, 154, 153.5, 153, 152.8, 152.2, 152.5], isCrypto: true },
    { symbol: 'THYAO', name: 'Türk Hava Yolları', price: 294.50, change: 1.85, currency: '₺', history: [285, 288, 290, 291, 292, 291.5, 293, 294.5], isCrypto: false },
    { symbol: 'EREGL', name: 'Ereğli Demir Çelik', price: 48.20, change: -0.65, currency: '₺', history: [50.2, 49.8, 49.5, 49.2, 48.8, 48.5, 48.3, 48.2], isCrypto: false },
    { symbol: 'AAPL', name: 'Apple Inc.', price: 228.40, change: 2.10, currency: '$', history: [218, 220, 222, 224, 225, 226, 227.5, 228.4], isCrypto: false }
];

let newsDatabase = {
    'BTCUSDT': [
        { title: 'FED faiz kararının ardından Bitcoin yükseliş ivmesini koruyor.', time: '10 dk önce', sentiment: 'POSITIVE' },
        { title: 'Kurumsal yatırımcılar spot ETF verilerine göre alımları artırdı.', time: '42 dk önce', sentiment: 'POSITIVE' },
        { title: 'Kripto madencilik zorluğu rekor seviyeye ulaştı.', time: '2 saat önce', sentiment: 'NEUTRAL' }
    ],
    'ETHUSDT': [
        { title: 'Ethereum ağında günlük aktif cüzdan sayısı rekor tazeledi.', time: '18 dk önce', sentiment: 'POSITIVE' },
        { title: 'Staking miktarı toplam arzın %28 seviyesini aştı.', time: '1 saat önce', sentiment: 'POSITIVE' }
    ],
    'THYAO': [
        { title: 'THY yeni filo yatırımı ve yolcu taşıma hedeflerini açıkladı.', time: '25 dk önce', sentiment: 'POSITIVE' },
        { title: 'Havacılık sektöründe jet yakıtı maliyetleri yatay seyrediyor.', time: '3 saat önce', sentiment: 'NEUTRAL' }
    ]
};

let selectedStock = stocks[0];
let userBalance = parseFloat(localStorage.getItem('bl_balance')) || 25000;
let portfolio = JSON.parse(localStorage.getItem('bl_portfolio')) || [];
let pendingOrders = JSON.parse(localStorage.getItem('bl_pending')) || [];
let tradeHistory = JSON.parse(localStorage.getItem('bl_history')) || [];

let currentModalDirection = 'BUY';
let currentOrderType = 'MARKET';
let currentTimeframe = '1G';
let showSMA = true;
let showRSI = true;
let stockChart;
let binanceSocket = null;

document.addEventListener('DOMContentLoaded', () => {
    initChart();
    renderStockList();
    renderPortfolio();
    renderPendingOrders();
    renderTradeHistory();
    renderOrderBook();
    renderNews();
    updateRSI();
    connectBinanceWebSocket();

    document.getElementById('inputLotAmount')?.addEventListener('input', updateModalTotal);
    document.getElementById('inputLimitPrice')?.addEventListener('input', updateModalTotal);
});

function saveToStorage() {
    localStorage.setItem('bl_balance', userBalance);
    localStorage.setItem('bl_portfolio', JSON.stringify(portfolio));
    localStorage.setItem('bl_pending', JSON.stringify(pendingOrders));
    localStorage.setItem('bl_history', JSON.stringify(tradeHistory));
}

function resetData() {
    if (confirm('Tüm simülasyon verileri ve portföy sıfırlanacak. Onaylıyor musunuz?')) {
        localStorage.clear();
        userBalance = 25000;
        portfolio = [];
        pendingOrders = [];
        tradeHistory = [];
        saveToStorage();
        location.reload();
    }
}

function calculateSMA(data, period = 5) {
    let sma = [];
    for (let i = 0; i < data.length; i++) {
        if (i < period - 1) {
            sma.push(null);
        } else {
            let sum = 0;
            for (let j = 0; j < period; j++) {
                sum += data[i - j];
            }
            sma.push(sum / period);
        }
    }
    return sma;
}

function calculateRSIValue(data) {
    if (data.length < 2) return 50;
    let gains = 0;
    let losses = 0;
    for (let i = 1; i < data.length; i++) {
        let diff = data[i] - data[i - 1];
        if (diff >= 0) gains += diff;
        else losses += Math.abs(diff);
    }
    if (losses === 0) return 100;
    let rs = (gains / data.length) / (losses / data.length);
    return 100 - (100 / (1 + rs));
}

function updateRSI() {
    const rsiVal = calculateRSIValue(selectedStock.history);
    const rsiValEl = document.getElementById('rsiValue');
    const rsiBarEl = document.getElementById('rsiBar');
    const rsiStatusEl = document.getElementById('rsiStatus');

    if (!rsiValEl || !rsiBarEl) return;

    rsiValEl.textContent = rsiVal.toFixed(2);
    rsiBarEl.style.width = `${Math.min(100, Math.max(0, rsiVal))}%`;

    if (rsiVal >= 70) {
        rsiStatusEl.textContent = 'Aşırı Alım';
        rsiStatusEl.className = 'text-[11px] font-semibold text-rose-400';
        rsiBarEl.className = 'bg-rose-500 h-full transition-all duration-300';
    } else if (rsiVal <= 30) {
        rsiStatusEl.textContent = 'Aşırı Satım';
        rsiStatusEl.className = 'text-[11px] font-semibold text-emerald-400';
        rsiBarEl.className = 'bg-emerald-500 h-full transition-all duration-300';
    } else {
        rsiStatusEl.textContent = 'Nötr Bölge';
        rsiStatusEl.className = 'text-[11px] font-semibold text-slate-300';
        rsiBarEl.className = 'bg-indigo-500 h-full transition-all duration-300';
    }
}

function renderNews() {
    const listEl = document.getElementById('newsList');
    if (!listEl) return;

    listEl.innerHTML = '';
    const newsItems = newsDatabase[selectedStock.symbol] || [
        { title: `${selectedStock.name} hakkında piyasalarda olumlu beklenti hakim.`, time: '15 dk önce', sentiment: 'POSITIVE' },
        { title: 'Genel makroekonomik veriler hisse performansını destekliyor.', time: '1 saat önce', sentiment: 'NEUTRAL' }
    ];

    let posCount = 0;
    newsItems.forEach(news => {
        if (news.sentiment === 'POSITIVE') posCount++;

        const div = document.createElement('div');
        div.className = 'p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/80 space-y-1';
        div.innerHTML = `
            <p class="text-xs text-slate-200 leading-snug">${news.title}</p>
            <div class="flex justify-between items-center text-[10px]">
                <span class="text-slate-500">${news.time}</span>
                <span class="${news.sentiment === 'POSITIVE' ? 'text-emerald-400' : news.sentiment === 'NEGATIVE' ? 'text-rose-400' : 'text-amber-400'} font-semibold">
                    ${news.sentiment === 'POSITIVE' ? 'Olumlu' : news.sentiment === 'NEGATIVE' ? 'Olumsuz' : 'Nötr'}
                </span>
            </div>
        `;
        listEl.appendChild(div);
    });

    const score = Math.round((posCount / newsItems.length) * 100);
    const badgeEl = document.getElementById('sentimentScoreBadge');
    const labelEl = document.getElementById('sentimentLabel');
    const barEl = document.getElementById('sentimentProgressBar');

    if (badgeEl && labelEl && barEl) {
        badgeEl.textContent = `%${score} Olumlu`;
        barEl.style.width = `${score}%`;

        if (score >= 70) {
            badgeEl.className = 'text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-md font-bold';
            labelEl.textContent = 'Güçlü Alım';
            labelEl.className = 'font-bold text-emerald-400';
            barEl.className = 'bg-emerald-500 h-full transition-all duration-500';
        } else if (score <= 40) {
            badgeEl.className = 'text-xs bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded-md font-bold';
            labelEl.textContent = 'Satış Baskısı';
            labelEl.className = 'font-bold text-rose-400';
            barEl.className = 'bg-rose-500 h-full transition-all duration-500';
        } else {
            badgeEl.className = 'text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-md font-bold';
            labelEl.textContent = 'Nötr Piyasa';
            labelEl.className = 'font-bold text-amber-400';
            barEl.className = 'bg-amber-500 h-full transition-all duration-500';
        }
    }
}

function initChart() {
    const ctx = document.getElementById('stockChart').getContext('2d');
    const smaData = calculateSMA(selectedStock.history, 4);

    stockChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['09:30', '10:30', '11:30', '12:30', '13:30', '14:30', '15:30', 'Anlık'],
            datasets: [
                {
                    label: selectedStock.symbol,
                    data: selectedStock.history,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.08)',
                    fill: true,
                    tension: 0.25,
                    borderWidth: 2,
                    pointRadius: 4
                },
                {
                    label: 'SMA (20)',
                    data: smaData,
                    borderColor: '#f59e0b',
                    borderWidth: 1.5,
                    borderDash: [4, 4],
                    pointRadius: 0,
                    fill: false,
                    hidden: !showSMA
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748b' } },
                y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748b' } }
            }
        }
    });
}

function connectBinanceWebSocket() {
    const streams = stocks.filter(s => s.isCrypto).map(s => `${s.symbol.toLowerCase()}@ticker`).join('/');
    binanceSocket = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`);

    binanceSocket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (!message.data) return;

        const ticker = message.data;
        const symbol = ticker.s;
        const newPrice = parseFloat(ticker.c);
        const priceChangePercent = parseFloat(ticker.P);

        const targetStock = stocks.find(s => s.symbol === symbol);
        if (targetStock) {
            targetStock.price = newPrice;
            targetStock.change = priceChangePercent;
            targetStock.history.shift();
            targetStock.history.push(newPrice);

            checkPendingOrders(targetStock);
            checkRiskManagement(targetStock);

            if (targetStock.symbol === selectedStock.symbol) {
                updateChart();
                renderOrderBook();
            }

            renderStockList();
            renderPortfolio();
            updateKPIs();
        }
    };

    binanceSocket.onerror = () => {
        document.getElementById('connectionStatus').className = 'flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs px-3 py-1.5 rounded-full';
        document.getElementById('connectionStatus').innerHTML = '<span class="w-2 h-2 rounded-full bg-rose-500"></span> Bağlantı Hatası';
    };
}

function setTimeframe(tf) {
    currentTimeframe = tf;
    ['1G', '1H', '1A', '1Y'].forEach(t => {
        const btn = document.getElementById(`tf${t}`);
        if (btn) {
            btn.className = t === tf 
                ? 'px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-semibold cursor-pointer'
                : 'px-2.5 py-1 rounded-lg text-slate-400 hover:text-white cursor-pointer';
        }
    });
    updateChart();
}

function toggleIndicator(type) {
    if (type === 'SMA') {
        showSMA = document.getElementById('toggleSMA').checked;
        stockChart.data.datasets[1].hidden = !showSMA;
    } else if (type === 'RSI') {
        showRSI = document.getElementById('toggleRSI').checked;
        document.getElementById('rsiContainer').style.display = showRSI ? 'flex' : 'none';
    }
    stockChart.update();
}

function renderStockList() {
    const listEl = document.getElementById('stockList');
    listEl.innerHTML = '';

    stocks.forEach(stock => {
        const isSelected = stock.symbol === selectedStock.symbol;
        const isPos = stock.change >= 0;

        const item = document.createElement('div');
        item.className = `p-3 rounded-xl border transition cursor-pointer flex justify-between items-center ${
            isSelected 
            ? 'bg-indigo-600/10 border-indigo-500/40' 
            : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700'
        }`;

        item.innerHTML = `
            <div>
                <span class="font-bold text-slate-200 block text-sm">${stock.symbol}</span>
                <span class="text-xs text-slate-500">${stock.name}</span>
            </div>
            <div class="text-right">
                <span class="font-semibold text-sm block">${stock.currency}${stock.price.toFixed(2)}</span>
                <span class="text-xs font-bold ${isPos ? 'text-emerald-400' : 'text-rose-400'}">
                    ${isPos ? '+' : ''}${stock.change.toFixed(2)}%
                </span>
            </div>
        `;

        item.addEventListener('click', () => {
            selectedStock = stock;
            updateChart();
            renderStockList();
            renderOrderBook();
            renderNews();
            updateRSI();
        });

        listEl.appendChild(item);
    });
}

function updateChart() {
    document.getElementById('chartStockName').textContent = `${selectedStock.symbol} - ${selectedStock.name}`;
    document.getElementById('chartStockPrice').textContent = `${selectedStock.currency}${selectedStock.price.toFixed(2)}`;
    
    stockChart.data.datasets[0].label = selectedStock.symbol;
    stockChart.data.datasets[0].data = selectedStock.history;
    stockChart.data.datasets[0].borderColor = selectedStock.change >= 0 ? '#10b981' : '#f43f5e';

    const newSMA = calculateSMA(selectedStock.history, 4);
    stockChart.data.datasets[1].data = newSMA;

    stockChart.update();
    updateRSI();
}

function openTradeModal(direction) {
    currentModalDirection = direction;
    const modal = document.getElementById('tradeModal');
    const badge = document.getElementById('modalTypeBadge');
    const confirmBtn = document.getElementById('modalConfirmBtn');

    document.getElementById('modalStockTitle').textContent = `${selectedStock.symbol} - ${selectedStock.name}`;
    document.getElementById('modalCurrentPrice').textContent = `${selectedStock.currency}${selectedStock.price.toFixed(2)}`;

    if (direction === 'BUY') {
        badge.textContent = 'AL';
        badge.className = 'px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
        confirmBtn.className = 'w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition cursor-pointer shadow-lg shadow-emerald-600/30';
        confirmBtn.textContent = 'Alış Emrini Onayla';
    } else {
        badge.textContent = 'SAT';
        badge.className = 'px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30';
        confirmBtn.className = 'w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm rounded-xl transition cursor-pointer shadow-lg shadow-rose-600/30';
        confirmBtn.textContent = 'Satış Emrini Onayla';
    }

    setOrderType('MARKET');
    updateModalTotal();
    modal.classList.remove('hidden');
}

function closeTradeModal() {
    document.getElementById('tradeModal').classList.add('hidden');
}

function setOrderType(type) {
    currentOrderType = type;
    const btnMarket = document.getElementById('btnOrderMarket');
    const btnLimit = document.getElementById('btnOrderLimit');
    const limitGroup = document.getElementById('limitPriceGroup');

    if (type === 'MARKET') {
        btnMarket.className = 'py-2 rounded-lg bg-indigo-600 text-white cursor-pointer transition';
        btnLimit.className = 'py-2 rounded-lg text-slate-400 hover:text-white cursor-pointer transition';
        limitGroup.classList.add('hidden');
    } else {
        btnLimit.className = 'py-2 rounded-lg bg-indigo-600 text-white cursor-pointer transition';
        btnMarket.className = 'py-2 rounded-lg text-slate-400 hover:text-white cursor-pointer transition';
        limitGroup.classList.remove('hidden');
        document.getElementById('inputLimitPrice').value = selectedStock.price.toFixed(2);
    }
    updateModalTotal();
}

function updateModalTotal() {
    const lots = parseFloat(document.getElementById('inputLotAmount')?.value) || 0;
    const price = currentOrderType === 'LIMIT' 
        ? (parseFloat(document.getElementById('inputLimitPrice')?.value) || selectedStock.price)
        : selectedStock.price;

    const total = lots * price;
    document.getElementById('modalTotalAmount').textContent = `${selectedStock.currency}${total.toFixed(2)}`;
}

function executeOrder() {
    const lots = parseFloat(document.getElementById('inputLotAmount').value);
    const stopLoss = parseFloat(document.getElementById('inputStopLoss').value) || null;
    const takeProfit = parseFloat(document.getElementById('inputTakeProfit').value) || null;

    if (!lots || lots <= 0) {
        alert('Lütfen geçerli bir miktar girin.');
        return;
    }

    if (currentOrderType === 'MARKET') {
        const executionPrice = selectedStock.price;
        const totalCost = lots * executionPrice;

        if (currentModalDirection === 'BUY') {
            if (userBalance < totalCost) {
                alert('Yetersiz Bakiye!');
                return;
            }
            userBalance -= totalCost;

            const existing = portfolio.find(p => p.symbol === selectedStock.symbol);
            if (existing) {
                existing.avgCost = ((existing.amount * existing.avgCost) + totalCost) / (existing.amount + lots);
                existing.amount += lots;
            } else {
                portfolio.push({
                    symbol: selectedStock.symbol,
                    amount: lots,
                    avgCost: executionPrice,
                    stopLoss: stopLoss,
                    takeProfit: takeProfit
                });
            }
        } else {
            const existing = portfolio.find(p => p.symbol === selectedStock.symbol);
            if (!existing || existing.amount < lots) {
                alert('Portföyünüzde yeterli varlık bulunmuyor!');
                return;
            }
            userBalance += totalCost;
            existing.amount -= lots;
            if (existing.amount <= 0) {
                portfolio = portfolio.filter(p => p.symbol !== selectedStock.symbol);
            }
        }

        tradeHistory.unshift({
            date: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
            symbol: selectedStock.symbol,
            direction: currentModalDirection,
            amount: lots,
            price: executionPrice,
            total: totalCost,
            currency: selectedStock.currency
        });

    } else {
        const targetPrice = parseFloat(document.getElementById('inputLimitPrice').value);
        if (!targetPrice || targetPrice <= 0) {
            alert('Lütfen geçerli bir limit fiyat girin.');
            return;
        }

        pendingOrders.push({
            id: Date.now(),
            symbol: selectedStock.symbol,
            direction: currentModalDirection,
            orderType: 'LIMIT',
            targetPrice: targetPrice,
            amount: lots,
            stopLoss: stopLoss,
            takeProfit: takeProfit
        });
        alert('Emriniz başarıyla iletildi!');
    }

    saveToStorage();
    updateKPIs();
    renderPortfolio();
    renderPendingOrders();
    renderTradeHistory();
    closeTradeModal();
}

function renderOrderBook() {
    const askEl = document.getElementById('askOrders');
    const bidEl = document.getElementById('bidOrders');
    if (!askEl || !bidEl) return;

    askEl.innerHTML = '';
    bidEl.innerHTML = '';

    document.getElementById('orderBookCurrentPrice').textContent = `${selectedStock.currency}${selectedStock.price.toFixed(2)}`;

    for (let i = 4; i >= 1; i--) {
        const p = selectedStock.price + (i * (selectedStock.price * 0.0005));
        const qty = (Math.random() * 2).toFixed(4);
        const div = document.createElement('div');
        div.className = 'flex justify-between items-center px-2 py-0.5 rounded order-bar-ask text-rose-400';
        div.innerHTML = `<span>${selectedStock.currency}${p.toFixed(2)}</span><span class="text-slate-400 font-mono">${qty}</span>`;
        askEl.appendChild(div);
    }

    for (let i = 1; i <= 4; i++) {
        const p = selectedStock.price - (i * (selectedStock.price * 0.0005));
        const qty = (Math.random() * 2).toFixed(4);
        const div = document.createElement('div');
        div.className = 'flex justify-between items-center px-2 py-0.5 rounded order-bar-bid text-emerald-400';
        div.innerHTML = `<span>${selectedStock.currency}${p.toFixed(2)}</span><span class="text-slate-400 font-mono">${qty}</span>`;
        bidEl.appendChild(div);
    }
}

function checkPendingOrders(stock) {
    pendingOrders.forEach((ord, index) => {
        if (ord.symbol !== stock.symbol) return;

        let triggered = false;
        if (ord.direction === 'BUY' && stock.price <= ord.targetPrice) {
            triggered = true;
        } else if (ord.direction === 'SELL' && stock.price >= ord.targetPrice) {
            triggered = true;
        }

        if (triggered) {
            const totalCost = ord.amount * stock.price;
            if (ord.direction === 'BUY') {
                if (userBalance >= totalCost) {
                    userBalance -= totalCost;
                    const existing = portfolio.find(p => p.symbol === stock.symbol);
                    if (existing) {
                        existing.avgCost = ((existing.amount * existing.avgCost) + totalCost) / (existing.amount + ord.amount);
                        existing.amount += ord.amount;
                    } else {
                        portfolio.push({ symbol: stock.symbol, amount: ord.amount, avgCost: stock.price });
                    }

                    tradeHistory.unshift({
                        date: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
                        symbol: stock.symbol,
                        direction: 'BUY',
                        amount: ord.amount,
                        price: stock.price,
                        total: totalCost,
                        currency: stock.currency
                    });
                }
            }
            pendingOrders.splice(index, 1);
            saveToStorage();
            renderPendingOrders();
            renderTradeHistory();
        }
    });
}

function checkRiskManagement(stock) {
    portfolio.forEach((item, index) => {
        if (item.symbol !== stock.symbol) return;

        let triggered = false;
        let direction = '';

        if (item.stopLoss && stock.price <= item.stopLoss) {
            triggered = true;
            direction = 'SELL (Stop-Loss)';
        } else if (item.takeProfit && stock.price >= item.takeProfit) {
            triggered = true;
            direction = 'SELL (Take-Profit)';
        }

        if (triggered) {
            const totalCost = item.amount * stock.price;
            userBalance += totalCost;
            portfolio.splice(index, 1);

            tradeHistory.unshift({
                date: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
                symbol: stock.symbol,
                direction: direction,
                amount: item.amount,
                price: stock.price,
                total: totalCost,
                currency: stock.currency
            });

            saveToStorage();
            renderPortfolio();
            renderTradeHistory();
        }
    });
}

function renderPortfolio() {
    const tableEl = document.getElementById('portfolioTable');
    if (!tableEl) return;
    tableEl.innerHTML = '';

    portfolio.forEach(item => {
        const curStock = stocks.find(s => s.symbol === item.symbol);
        if (!curStock) return;

        const totalVal = item.amount * curStock.price;
        const pnl = totalVal - (item.amount * item.avgCost);
        const isPos = pnl >= 0;

        const row = document.createElement('tr');
        row.className = 'hover:bg-slate-800/30 transition';

        row.innerHTML = `
            <td class="p-3 font-bold text-slate-200">${item.symbol}</td>
            <td class="p-3">${item.amount}</td>
            <td class="p-3">${curStock.currency}${item.avgCost.toFixed(2)}</td>
            <td class="p-3">${curStock.currency}${curStock.price.toFixed(2)}</td>
            <td class="p-3 font-semibold">${curStock.currency}${totalVal.toFixed(2)}</td>
            <td class="p-3 font-bold ${isPos ? 'text-emerald-400' : 'text-rose-400'}">
                ${isPos ? '+' : ''}${curStock.currency}${pnl.toFixed(2)}
            </td>
            <td class="p-3 text-right">
                <button onclick="quickSell('${item.symbol}')" class="text-xs px-3 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-lg hover:bg-rose-500/30 transition cursor-pointer">Piyasadan Sat</button>
            </td>
        `;

        tableEl.appendChild(row);
    });
}

function quickSell(symbol) {
    const item = portfolio.find(p => p.symbol === symbol);
    if (!item) return;

    const curStock = stocks.find(s => s.symbol === symbol);
    const totalCost = item.amount * curStock.price;
    userBalance += totalCost;

    tradeHistory.unshift({
        date: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        symbol: symbol,
        direction: 'SELL',
        amount: item.amount,
        price: curStock.price,
        total: totalCost,
        currency: curStock.currency
    });

    portfolio = portfolio.filter(p => p.symbol !== symbol);

    saveToStorage();
    updateKPIs();
    renderPortfolio();
    renderTradeHistory();
}

function renderPendingOrders() {
    const tableEl = document.getElementById('pendingOrdersTable');
    document.getElementById('pendingCount').textContent = pendingOrders.length;
    if (!tableEl) return;
    tableEl.innerHTML = '';

    pendingOrders.forEach(ord => {
        const curStock = stocks.find(s => s.symbol === ord.symbol);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="p-3 font-bold text-slate-200">${ord.symbol}</td>
            <td class="p-3 font-bold ${ord.direction === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}">${ord.direction === 'BUY' ? 'ALIŞ' : 'SATIŞ'}</td>
            <td class="p-3 text-xs bg-slate-800 rounded">${ord.orderType}</td>
            <td class="p-3 font-semibold">${curStock.currency}${ord.targetPrice.toFixed(2)}</td>
            <td class="p-3">${curStock.currency}${curStock.price.toFixed(2)}</td>
            <td class="p-3">${ord.amount}</td>
            <td class="p-3 text-right">
                <button onclick="cancelPendingOrder(${ord.id})" class="text-xs text-rose-400 hover:text-rose-300 underline cursor-pointer">İptal</button>
            </td>
        `;
        tableEl.appendChild(row);
    });
}

function renderTradeHistory() {
    const tableEl = document.getElementById('tradeHistoryTable');
    if (!tableEl) return;
    tableEl.innerHTML = '';

    tradeHistory.forEach(h => {
        const isBuy = h.direction.includes('BUY') || h.direction === 'AL';
        const row = document.createElement('tr');
        row.className = 'hover:bg-slate-800/30 transition text-xs';
        row.innerHTML = `
            <td class="p-3 text-slate-400">${h.date}</td>
            <td class="p-3 font-bold text-slate-200">${h.symbol}</td>
            <td class="p-3 font-bold ${isBuy ? 'text-emerald-400' : 'text-rose-400'}">${h.direction}</td>
            <td class="p-3">${h.amount}</td>
            <td class="p-3">${h.currency}${h.price.toFixed(2)}</td>
            <td class="p-3 text-right font-semibold">${h.currency}${h.total.toFixed(2)}</td>
        `;
        tableEl.appendChild(row);
    });
}

function cancelPendingOrder(id) {
    pendingOrders = pendingOrders.filter(o => o.id !== id);
    saveToStorage();
    renderPendingOrders();
}

function switchTab(tab) {
    const tabPort = document.getElementById('tabPortfolio');
    const tabPend = document.getElementById('tabPending');
    const tabHist = document.getElementById('tabHistory');
    const btnPort = document.getElementById('tabBtnPortfolio');
    const btnPend = document.getElementById('tabBtnPending');
    const btnHist = document.getElementById('tabBtnHistory');

    [tabPort, tabPend, tabHist].forEach(t => t?.classList.add('hidden'));
    [btnPort, btnPend, btnHist].forEach(b => b && (b.className = 'text-sm font-bold text-slate-400 hover:text-slate-200 pb-1 cursor-pointer'));

    if (tab === 'portfolio') {
        tabPort.classList.remove('hidden');
        btnPort.className = 'text-sm font-bold text-indigo-400 border-b-2 border-indigo-500 pb-1 cursor-pointer';
    } else if (tab === 'pending') {
        tabPend.classList.remove('hidden');
        btnPend.className = 'text-sm font-bold text-indigo-400 border-b-2 border-indigo-500 pb-1 cursor-pointer';
    } else if (tab === 'history') {
        tabHist.classList.remove('hidden');
        btnHist.className = 'text-sm font-bold text-indigo-400 border-b-2 border-indigo-500 pb-1 cursor-pointer';
    }
}

function updateKPIs() {
    let portfolioValue = 0;
    portfolio.forEach(p => {
        const curStock = stocks.find(s => s.symbol === p.symbol);
        if (curStock) portfolioValue += p.amount * curStock.price;
    });

    const totalAssetVal = userBalance + portfolioValue;

    document.getElementById('userBalance').textContent = `$${userBalance.toFixed(2)}`;
    document.getElementById('kpiBalance').textContent = `$${userBalance.toFixed(2)}`;
    document.getElementById('totalPortfolioVal').textContent = `$${totalAssetVal.toFixed(2)}`;
    document.getElementById('activePositionsCount').textContent = `${portfolio.length} Sembol`;
}