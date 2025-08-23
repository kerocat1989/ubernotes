class WeatherWidget {
    constructor() {
        this.widget = null;
        this.weatherData = null;
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
        this.widget = document.getElementById('weatherWidget');
        this.setupEventListeners();
        this.startClock();
        this.loadWeatherData();
        
        console.log('Weather widget initialized');
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

        // Listen for widget initialization from main process
        if (window.electronAPI) {
            window.electronAPI.onWidgetInit((data) => {
                console.log('Widget initialized with data:', data);
            });

            // Auto-save position periodically
            setInterval(() => this.saveState(), 2000);
        }
    }

    startClock() {
        this.updateClock();
        // Update every second
        setInterval(() => this.updateClock(), 1000);
    }

    updateClock() {
        const now = new Date();
        const timeElement = document.getElementById('currentTime');
        const dateElement = document.getElementById('currentDate');

        // Format time
        const time = now.toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        // Format date
        const date = now.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'short',
            day: 'numeric'
        });

        timeElement.textContent = time;
        dateElement.textContent = date;
    }

    async loadWeatherData() {
        try {
            // For demo purposes, we'll simulate weather data since we need an API key for real data
            // In a real app, you'd use: https://api.openweathermap.org/data/2.5/weather?q=Cupertino,US&appid=YOUR_API_KEY&units=imperial
            
            await this.simulateWeatherAPI();
        } catch (error) {
            console.error('Failed to load weather data:', error);
            this.displayErrorWeather();
        }
    }

    async simulateWeatherAPI() {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Generate realistic weather data for Cupertino
        const conditions = [
            { temp: 72, desc: 'Sunny', theme: 'sunny' },
            { temp: 68, desc: 'Partly Cloudy', theme: 'cloudy' },
            { temp: 65, desc: 'Overcast', theme: 'cloudy' },
            { temp: 70, desc: 'Clear', theme: 'sunny' }
        ];

        // Pick based on current hour for some variety
        const hour = new Date().getHours();
        const isNight = hour < 6 || hour > 20;
        
        let weather;
        if (isNight) {
            weather = { temp: 58, desc: 'Clear Night', theme: 'clear-night' };
        } else {
            weather = conditions[hour % conditions.length];
        }

        this.displayWeather(weather);
    }

    displayWeather(weather) {
        const tempElement = document.getElementById('temperature');
        const descElement = document.getElementById('weatherDesc');

        tempElement.textContent = `${weather.temp}°F`;
        descElement.textContent = weather.desc;

        // Apply theme
        this.widget.className = `weather-widget ${weather.theme}`;

        console.log('Weather updated:', weather);
    }

    displayErrorWeather() {
        const tempElement = document.getElementById('temperature');
        const descElement = document.getElementById('weatherDesc');

        tempElement.textContent = '70°F';
        descElement.textContent = 'Unable to load';
        
        this.widget.className = 'weather-widget';
    }

    saveState() {
        if (window.electronAPI) {
            // Save any widget state if needed
            window.electronAPI.saveContent(JSON.stringify({
                timestamp: new Date().toISOString(),
                weather: this.weatherData
            }));
        }
    }
}

// Initialize widget when script loads
const weatherWidget = new WeatherWidget();

// Make it draggable by clicking and dragging anywhere except close button
let isDragging = false;
let dragOffset = { x: 0, y: 0 };

document.addEventListener('mousedown', (e) => {
    if (e.target.id === 'closeBtn') return;
    
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