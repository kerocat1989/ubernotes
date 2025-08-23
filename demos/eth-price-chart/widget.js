class EthereumPriceWidget {
    constructor() {
        this.widget = null;
        this.priceData = [];
        this.chart = null;
        this.currentRange = '7d';
        this.lastPrice = null;
        this.init();
    }

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeWidget());
        } else {
            this.initializeWidget();
        }
    }

    initializeWidget() {
        this.widget = document.getElementById('ethWidget');
        this.setupEventListeners();
        this.setupChart();
        this.loadPriceData();
        
        // Update price every 30 seconds
        setInterval(() => this.loadPriceData(), 30000);
        
        console.log('Ethereum price widget initialized');
    }

    setupEventListeners() {
        // Close button
        const closeBtn = document.getElementById('closeBtn');
        closeBtn.addEventListener('click', () => {
            if (window.electronAPI) {
                window.electronAPI.closeWidget();
            } else {
                window.close();
            }
        });

        // Range buttons
        const rangeButtons = document.querySelectorAll('.range-btn');
        rangeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const range = e.target.dataset.range;
                this.setTimeRange(range);
            });
        });

        // Listen for widget initialization from main process
        if (window.electronAPI) {
            window.electronAPI.onWidgetInit((data) => {
                console.log('ETH widget initialized with data:', data);
            });

            // Auto-save position periodically
            setInterval(() => this.saveState(), 2000);
        }
    }

    setupChart() {
        const canvas = document.getElementById('priceChart');
        const ctx = canvas.getContext('2d');
        
        // Set up high DPI display
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        
        this.chart = {
            canvas: canvas,
            ctx: ctx,
            width: rect.width,
            height: rect.height
        };
    }

    async loadPriceData() {
        try {
            // For demo purposes, we'll generate realistic ETH price data
            // In production, you'd use: https://api.coingecko.com/api/v3/coins/ethereum/market_chart?vs_currency=usd&days=7
            
            const now = Date.now();
            const days = this.currentRange === '7d' ? 7 : 30;
            const dataPoints = this.currentRange === '7d' ? 168 : 720; // hourly data
            
            this.priceData = this.generateRealisticPriceData(now, days, dataPoints);
            this.updatePriceDisplay();
            this.renderChart();
            this.updateLastUpdated();
            
        } catch (error) {
            console.error('Failed to load ETH price data:', error);
            this.displayError();
        }
    }

    generateRealisticPriceData(endTime, days, dataPoints) {
        const data = [];
        const basePrice = 2400; // Base ETH price around $2400
        const millisecondsPerPoint = (days * 24 * 60 * 60 * 1000) / dataPoints;
        
        let currentPrice = basePrice;
        
        for (let i = 0; i < dataPoints; i++) {
            const timestamp = endTime - (dataPoints - i - 1) * millisecondsPerPoint;
            
            // Generate realistic price movement
            const randomWalk = (Math.random() - 0.5) * 0.03; // ±3% random walk
            const trend = Math.sin(i / dataPoints * Math.PI * 4) * 0.01; // Cyclical trend
            const volatility = 1 + (Math.random() - 0.5) * 0.1; // ±10% volatility
            
            currentPrice = currentPrice * (1 + randomWalk + trend) * volatility;
            
            // Keep price in reasonable range
            currentPrice = Math.max(1800, Math.min(3200, currentPrice));
            
            data.push({
                timestamp: timestamp,
                price: currentPrice
            });
        }
        
        return data;
    }

    updatePriceDisplay() {
        if (this.priceData.length === 0) return;
        
        const latestData = this.priceData[this.priceData.length - 1];
        const previousData = this.priceData.length > 1 ? this.priceData[this.priceData.length - 2] : latestData;
        
        const currentPrice = latestData.price;
        const priceChange = currentPrice - previousData.price;
        const priceChangePercent = (priceChange / previousData.price) * 100;
        
        const priceElement = document.getElementById('currentPrice');
        const changeElement = document.getElementById('priceChange');
        
        priceElement.textContent = `$${currentPrice.toFixed(2)}`;
        
        const changeText = `${priceChangePercent >= 0 ? '+' : ''}${priceChangePercent.toFixed(2)}%`;
        changeElement.textContent = changeText;
        changeElement.className = `price-change ${priceChangePercent >= 0 ? 'positive' : 'negative'}`;
        
        this.lastPrice = currentPrice;
    }

    renderChart() {
        if (!this.chart || this.priceData.length === 0) return;
        
        const { ctx, width, height } = this.chart;
        const padding = 20;
        const chartWidth = width - padding * 2;
        const chartHeight = height - padding * 2;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Get price range
        const prices = this.priceData.map(d => d.price);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const priceRange = maxPrice - minPrice || 1;
        
        // Create gradient
        const gradient = ctx.createLinearGradient(0, padding, 0, height - padding);
        gradient.addColorStop(0, 'rgba(34, 197, 94, 0.3)');
        gradient.addColorStop(1, 'rgba(34, 197, 94, 0.05)');
        
        // Draw price line and area
        ctx.beginPath();
        
        this.priceData.forEach((point, index) => {
            const x = padding + (index / (this.priceData.length - 1)) * chartWidth;
            const y = padding + (1 - (point.price - minPrice) / priceRange) * chartHeight;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        // Fill area under curve
        const lastX = padding + chartWidth;
        const lastY = padding + (1 - (prices[prices.length - 1] - minPrice) / priceRange) * chartHeight;
        
        ctx.lineTo(lastX, height - padding);
        ctx.lineTo(padding, height - padding);
        ctx.closePath();
        
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Draw price line
        ctx.beginPath();
        this.priceData.forEach((point, index) => {
            const x = padding + (index / (this.priceData.length - 1)) * chartWidth;
            const y = padding + (1 - (point.price - minPrice) / priceRange) * chartHeight;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw current price dot
        if (this.priceData.length > 0) {
            const lastPoint = this.priceData[this.priceData.length - 1];
            const x = padding + chartWidth;
            const y = padding + (1 - (lastPoint.price - minPrice) / priceRange) * chartHeight;
            
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, 2 * Math.PI);
            ctx.fillStyle = '#22c55e';
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }

    setTimeRange(range) {
        if (range === this.currentRange) return;
        
        this.currentRange = range;
        
        // Update button states
        document.querySelectorAll('.range-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.range === range);
        });
        
        // Reload data for new range
        this.loadPriceData();
    }

    updateLastUpdated() {
        const lastUpdatedElement = document.getElementById('lastUpdated');
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', { 
            hour12: true, 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        lastUpdatedElement.textContent = `Last updated: ${timeString}`;
    }

    displayError() {
        const priceElement = document.getElementById('currentPrice');
        const changeElement = document.getElementById('priceChange');
        
        priceElement.textContent = 'Error';
        priceElement.classList.add('error');
        changeElement.textContent = 'Unable to load data';
        changeElement.className = 'price-change error';
    }

    saveState() {
        if (window.electronAPI) {
            // Save any widget state if needed
            window.electronAPI.saveContent(JSON.stringify({
                timestamp: new Date().toISOString(),
                range: this.currentRange,
                lastPrice: this.lastPrice
            }));
        }
    }
}

// Initialize widget when script loads
const ethWidget = new EthereumPriceWidget();

// Make it draggable by clicking and dragging anywhere except interactive elements
let isDragging = false;
let dragOffset = { x: 0, y: 0 };

document.addEventListener('mousedown', (e) => {
    if (e.target.id === 'closeBtn' || 
        e.target.classList.contains('range-btn') ||
        e.target.id === 'resizeHandle') return;
    
    isDragging = true;
    dragOffset.x = e.clientX;
    dragOffset.y = e.clientY;
    document.body.style.cursor = 'grabbing';
});

document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - dragOffset.x;
    const deltaY = e.clientY - dragOffset.y;
    
    // Move window (this would be handled by Electron in the main process)
    if (window.electronAPI) {
        // In a real implementation, you'd send move commands to main process
    }
});

document.addEventListener('mouseup', () => {
    isDragging = false;
    document.body.style.cursor = 'default';
});
