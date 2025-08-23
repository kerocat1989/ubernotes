class UberNotesWidget {
    constructor() {
        this.widget = null;
        this.contentArea = null;
        this.lastContent = '';
        this.recognition = null;
        this.isListening = false;
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
        this.widget = document.getElementById('widgetContainer');
        this.contentArea = document.getElementById('contentArea');
        this.setupEventListeners();
        this.setupVoiceRecognition();
        
        console.log('UberNotes widget initialized');
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

        // Voice button
        const voiceBtn = document.getElementById('voiceBtn');
        voiceBtn.addEventListener('click', () => this.toggleVoiceRecognition());

        // AI button
        const aiBtn = document.getElementById('aiBtn');
        aiBtn.addEventListener('click', () => this.showAIModal());

        // AI modal controls
        const aiModalClose = document.getElementById('aiModalClose');
        const aiCancel = document.getElementById('aiCancel');
        const aiApply = document.getElementById('aiApply');
        const aiRevert = document.getElementById('aiRevert');

        aiModalClose.addEventListener('click', () => this.hideAIModal());
        aiCancel.addEventListener('click', () => this.hideAIModal());
        aiApply.addEventListener('click', () => this.applyAIInstruction());
        aiRevert.addEventListener('click', () => this.revertContent());

        // Content area events
        this.contentArea.addEventListener('input', () => this.saveContent());
        this.contentArea.addEventListener('focus', () => this.updateStatus(''));

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'v' || e.key === 'V') {
                if (document.activeElement === this.contentArea) {
                    e.preventDefault();
                    this.toggleVoiceRecognition();
                }
            }
            if (e.key === 'a' || e.key === 'A') {
                if (document.activeElement === this.contentArea) {
                    e.preventDefault();
                    this.showAIModal();
                }
            }
        });

        // Listen for widget initialization from main process
        if (window.electronAPI) {
            window.electronAPI.onWidgetInit((data) => {
                console.log('Widget initialized with data:', data);
                if (data.content) {
                    this.contentArea.innerHTML = data.content;
                    this.lastContent = data.content;
                }
            });

            // Listen for content save requests
            window.electronAPI.onGetContentForSave(() => {
                window.electronAPI.sendContentResponse(this.contentArea.innerHTML);
            });
        }
    }

    setupVoiceRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';

            this.recognition.onstart = () => {
                this.isListening = true;
                this.updateStatus('Listening...', 'listening');
            };

            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                this.insertTextAtCursor(transcript);
                this.updateStatus('Voice input added');
                this.saveContent();
            };

            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.updateStatus('Voice recognition error', 'error');
                this.isListening = false;
            };

            this.recognition.onend = () => {
                this.isListening = false;
                this.updateStatus('');
            };
        }
    }

    toggleVoiceRecognition() {
        if (!this.recognition) {
            this.updateStatus('Voice recognition not supported', 'error');
            return;
        }

        if (this.isListening) {
            this.recognition.stop();
        } else {
            try {
                this.recognition.start();
            } catch (error) {
                console.error('Error starting voice recognition:', error);
                this.updateStatus('Could not start voice recognition', 'error');
            }
        }
    }

    showAIModal() {
        const modal = document.getElementById('aiModal');
        const instruction = document.getElementById('aiInstruction');
        modal.style.display = 'flex';
        instruction.focus();
    }

    hideAIModal() {
        const modal = document.getElementById('aiModal');
        const instruction = document.getElementById('aiInstruction');
        modal.style.display = 'none';
        instruction.value = '';
    }

    applyAIInstruction() {
        const instruction = document.getElementById('aiInstruction').value.trim();
        if (!instruction) return;

        this.updateStatus('Processing AI instruction...', 'processing');
        
        // Store current content for revert
        this.lastContent = this.contentArea.innerHTML;
        
        // Apply AI instruction
        const newContent = this.processAIInstruction(instruction, this.lastContent);
        this.contentArea.innerHTML = newContent;
        
        this.hideAIModal();
        this.updateStatus('AI template applied');
        this.saveContent();
    }

    processAIInstruction(instruction, currentContent) {
        const lowerInstruction = instruction.toLowerCase();
        
        if (lowerInstruction.includes('clock') || lowerInstruction.includes('time')) {
            return this.addClockTemplate() + '\n' + currentContent;
        }
        
        if (lowerInstruction.includes('date')) {
            const today = new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
            return `<p><strong>Date:</strong> ${today}</p>\n` + currentContent;
        }
        
        if (lowerInstruction.includes('todo') || lowerInstruction.includes('task')) {
            return this.addTodoTemplate() + '\n' + currentContent;
        }
        
        if (lowerInstruction.includes('meeting') || lowerInstruction.includes('agenda')) {
            return this.addMeetingTemplate() + '\n' + currentContent;
        }
        
        if (lowerInstruction.includes('header')) {
            return this.makeHeader(currentContent);
        }
        
        // Default fallback
        return `<p><em>AI Suggestion for "${instruction}":</em></p>\n` + currentContent;
    }

    addClockTemplate() {
        const now = new Date();
        const timeString = now.toLocaleTimeString();
        const dateString = now.toLocaleDateString();
        
        return `
<div class="clock-widget">
    <div class="clock-time" id="liveTime">${timeString}</div>
    <div class="clock-date">${dateString}</div>
</div>`;
    }

    addTodoTemplate() {
        return `
<div style="margin-bottom: 16px;">
    <h3 style="margin-bottom: 8px;">📝 Todo List</h3>
    <div style="margin-left: 16px;">
        ☐ Task 1<br>
        ☐ Task 2<br>
        ☐ Task 3<br>
    </div>
</div>`;
    }

    addMeetingTemplate() {
        const currentDate = new Date().toLocaleDateString();
        const currentTime = new Date().toLocaleTimeString();
        
        return `
<div style="margin-bottom: 16px;">
    <h2 style="margin-bottom: 8px;">📅 Meeting Agenda</h2>
    <p><strong>Date:</strong> ${currentDate}</p>
    <p><strong>Time:</strong> ${currentTime}</p>
    <br>
    <h3>Agenda Items:</h3>
    <ol style="margin-left: 20px;">
        <li>Item 1</li>
        <li>Item 2</li>
        <li>Item 3</li>
    </ol>
    <br>
    <h3>Notes:</h3>
</div>`;
    }

    makeHeader(content) {
        const lines = content.split('\n');
        if (lines.length > 0) {
            lines[0] = `<h1>${lines[0].replace(/<[^>]*>/g, '')}</h1>`;
        }
        return lines.join('\n');
    }

    revertContent() {
        this.contentArea.innerHTML = this.lastContent;
        this.hideAIModal();
        this.updateStatus('Reverted to previous content');
        this.saveContent();
    }

    insertTextAtCursor(text) {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            range.deleteContents();
            range.insertNode(document.createTextNode(text + ' '));
            range.collapse(false);
        } else {
            // Fallback: append to end
            this.contentArea.insertAdjacentText('beforeend', text + ' ');
        }
    }

    updateStatus(message, type = '') {
        const statusIndicator = document.getElementById('statusIndicator');
        statusIndicator.textContent = message;
        statusIndicator.className = `status-indicator ${type}`;
        
        // Clear status after 3 seconds (except for listening state)
        if (type !== 'listening') {
            setTimeout(() => {
                if (statusIndicator.textContent === message) {
                    statusIndicator.textContent = '';
                    statusIndicator.className = 'status-indicator';
                }
            }, 3000);
        }
    }

    saveContent() {
        if (window.electronAPI) {
            const content = this.contentArea.innerHTML;
            window.electronAPI.saveContent(content);
        }
    }

    startLiveClock() {
        setInterval(() => {
            const liveTimeElement = document.getElementById('liveTime');
            if (liveTimeElement) {
                const now = new Date();
                liveTimeElement.textContent = now.toLocaleTimeString();
            }
        }, 1000);
    }
}

// Initialize widget when script loads
const uberNotesWidget = new UberNotesWidget();

// Start live clock updates
uberNotesWidget.startLiveClock();

// Make it draggable by clicking and dragging the header
let isDragging = false;
let dragOffset = { x: 0, y: 0 };

document.addEventListener('mousedown', (e) => {
    if (e.target.closest('.widget-header') && 
        !e.target.closest('.control-btn') &&
        !e.target.closest('#contentArea')) {
        isDragging = true;
        dragOffset.x = e.clientX;
        dragOffset.y = e.clientY;
        document.body.style.cursor = 'grabbing';
    }
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

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { UberNotesWidget };
}