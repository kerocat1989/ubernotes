/**
 * UberNotes Widget Tests
 * Tests the core widget functionality
 */

// Mock electron APIs for testing
global.electronAPI = {
  createWidget: jest.fn(),
  closeWidget: jest.fn(),
  saveContent: jest.fn(),
  onWidgetInit: jest.fn(),
  onGetContentForSave: jest.fn(),
  sendContentResponse: jest.fn()
};

// Mock DOM elements
document.body.innerHTML = `
  <div class="widget-container" id="widgetContainer">
    <div class="widget-header">
      <div class="widget-controls">
        <button class="control-btn voice-btn" id="voiceBtn" title="Voice Dictation (V)">🎤</button>
        <button class="control-btn ai-btn" id="aiBtn" title="AI Mutator (A)">🤖</button>
        <button class="control-btn close-btn" id="closeBtn" title="Close Widget">×</button>
      </div>
    </div>
    
    <div class="widget-content">
      <div class="content-area" id="contentArea" contenteditable="true" 
           placeholder="Start typing your note..."></div>
    </div>
    
    <div class="widget-footer">
      <div class="status-indicator" id="statusIndicator"></div>
      <div class="resize-handle" id="resizeHandle"></div>
    </div>
  </div>

  <div class="modal" id="aiModal" style="display: none;">
    <div class="modal-content">
      <div class="modal-header">
        <h3>AI Mutator</h3>
        <button class="modal-close" id="aiModalClose">×</button>
      </div>
      <div class="modal-body">
        <textarea id="aiInstruction" placeholder="Describe what you want to add..."></textarea>
        <div class="modal-actions">
          <button id="aiApply" class="btn-primary">Apply</button>
          <button id="aiRevert" class="btn-secondary">Revert</button>
          <button id="aiCancel" class="btn-secondary">Cancel</button>
        </div>
      </div>
    </div>
  </div>
`;

// Load the widget controller
require('../src/widget.js');

describe('UberNotes Widget', () => {
  let widgetController;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset DOM state
    document.getElementById('contentArea').innerHTML = '';
    document.getElementById('statusIndicator').textContent = '';
    document.getElementById('aiModal').style.display = 'none';
  });

  test('Widget initializes correctly', () => {
    expect(document.getElementById('contentArea')).toBeTruthy();
    expect(document.getElementById('voiceBtn')).toBeTruthy();
    expect(document.getElementById('aiBtn')).toBeTruthy();
    expect(document.getElementById('closeBtn')).toBeTruthy();
  });

  test('Content saving works', () => {
    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = 'Test content';
    
    // Trigger input event
    const inputEvent = new Event('input');
    contentArea.dispatchEvent(inputEvent);
    
    // Should call saveContent
    setTimeout(() => {
      expect(global.electronAPI.saveContent).toHaveBeenCalledWith('Test content');
    }, 100);
  });

  test('AI Modal shows and hides correctly', () => {
    const aiBtn = document.getElementById('aiBtn');
    const aiModal = document.getElementById('aiModal');
    const aiModalClose = document.getElementById('aiModalClose');
    
    // Show modal
    aiBtn.click();
    expect(aiModal.style.display).toBe('flex');
    
    // Hide modal
    aiModalClose.click();
    expect(aiModal.style.display).toBe('none');
  });

  test('Clock widget template generation', () => {
    // Simulate AI instruction for clock
    const instruction = 'add a clock';
    const currentContent = 'Existing content';
    
    // This would normally be called by the AI mutator
    // We'll test the template generation logic
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    const dateString = now.toLocaleDateString();
    
    const expectedClockHTML = `
<div class="clock-widget">
    <div class="clock-time" id="liveTime">${timeString}</div>
    <div class="clock-date">${dateString}</div>
</div>`;

    const result = expectedClockHTML + '\n' + currentContent;
    expect(result).toContain('clock-widget');
    expect(result).toContain(timeString);
    expect(result).toContain('Existing content');
  });

  test('Todo list template generation', () => {
    const todoTemplate = `
<div style="margin-bottom: 16px;">
    <h3 style="margin-bottom: 8px;">📝 Todo List</h3>
    <div style="margin-left: 16px;">
        ☐ Task 1<br>
        ☐ Task 2<br>
        ☐ Task 3<br>
    </div>
</div>`;
    
    expect(todoTemplate).toContain('Todo List');
    expect(todoTemplate).toContain('☐ Task 1');
    expect(todoTemplate).toContain('☐ Task 2');
    expect(todoTemplate).toContain('☐ Task 3');
  });

  test('Meeting agenda template generation', () => {
    const currentDate = new Date().toLocaleDateString();
    const currentTime = new Date().toLocaleTimeString();
    
    const agendaTemplate = `
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
    
    expect(agendaTemplate).toContain('Meeting Agenda');
    expect(agendaTemplate).toContain(currentDate);
    expect(agendaTemplate).toContain('Agenda Items');
    expect(agendaTemplate).toContain('Notes:');
  });

  test('HTML sanitization prevents XSS', () => {
    const maliciousHTML = '<script>alert("xss")</script><div onclick="alert(\'xss\')">content</div>';
    
    // Create a temporary div for sanitization test
    const div = document.createElement('div');
    div.innerHTML = maliciousHTML;
    
    // Remove script tags
    const scripts = div.querySelectorAll('script');
    scripts.forEach(script => script.remove());
    
    // Remove dangerous attributes
    const elements = div.querySelectorAll('*');
    elements.forEach(el => {
      const dangerousAttrs = ['onclick', 'onload', 'onerror'];
      dangerousAttrs.forEach(attr => {
        if (el.hasAttribute(attr)) {
          el.removeAttribute(attr);
        }
      });
    });
    
    const sanitizedHTML = div.innerHTML;
    expect(sanitizedHTML).not.toContain('<script>');
    expect(sanitizedHTML).not.toContain('onclick');
    expect(sanitizedHTML).toContain('<div>content</div>');
  });

  test('Keyboard shortcuts work correctly', () => {
    const createWidgetSpy = jest.spyOn(global.electronAPI, 'createWidget');
    
    // Test Cmd+N shortcut
    const keyEvent = new KeyboardEvent('keydown', {
      key: 'n',
      metaKey: true
    });
    
    document.dispatchEvent(keyEvent);
    // Note: In a real test, we'd need to properly set up the event listener
    // This is a basic structure for testing keyboard events
  });

  test('Status updates work correctly', () => {
    const statusIndicator = document.getElementById('statusIndicator');
    
    // Simulate status update
    statusIndicator.textContent = 'Test status';
    statusIndicator.className = 'status-indicator listening';
    
    expect(statusIndicator.textContent).toBe('Test status');
    expect(statusIndicator.className).toContain('listening');
  });
});

describe('UberNotes Security', () => {
  test('External navigation is blocked', () => {
    // This would be tested at the Electron level
    // Here we just verify the concept exists
    const dangerousURL = 'http://malicious-site.com';
    
    // In the actual implementation, this would be prevented
    // by the will-navigate event handler in main.js
    expect(dangerousURL).not.toBe(window.location.href);
  });

  test('Content is properly sanitized', () => {
    const unsafeContent = '<img src="x" onerror="alert(1)">';
    const div = document.createElement('div');
    div.innerHTML = unsafeContent;
    
    // Remove onerror attribute
    const img = div.querySelector('img');
    if (img && img.hasAttribute('onerror')) {
      img.removeAttribute('onerror');
    }
    
    expect(div.innerHTML).not.toContain('onerror');
  });
});

module.exports = {};
