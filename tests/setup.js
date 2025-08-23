// Test setup file for UberNotes

// Mock Web Speech API
global.SpeechRecognition = class MockSpeechRecognition {
  constructor() {
    this.continuous = false;
    this.interimResults = false;
    this.lang = 'en-US';
    this.onresult = null;
    this.onend = null;
    this.onerror = null;
  }

  start() {
    // Simulate successful recognition after a delay
    setTimeout(() => {
      if (this.onresult) {
        const mockEvent = {
          resultIndex: 0,
          results: [{
            0: { transcript: 'test transcription' },
            isFinal: true
          }]
        };
        this.onresult(mockEvent);
      }
      
      if (this.onend) {
        this.onend();
      }
    }, 100);
  }

  stop() {
    if (this.onend) {
      this.onend();
    }
  }
};

global.webkitSpeechRecognition = global.SpeechRecognition;

// Mock window methods that aren't available in jsdom
Object.defineProperty(window, 'getSelection', {
  value: () => ({
    rangeCount: 0,
    getRangeAt: () => null,
    removeAllRanges: () => {},
    addRange: () => {}
  })
});

// Mock electron APIs globally
global.require = jest.fn((module) => {
  if (module === 'electron') {
    return {
      contextBridge: {
        exposeInMainWorld: jest.fn()
      },
      ipcRenderer: {
        invoke: jest.fn(),
        on: jest.fn(),
        send: jest.fn()
      }
    };
  }
  return {};
});

// Suppress console.log during tests unless there's an error
const originalConsoleLog = console.log;
console.log = (...args) => {
  // Only log if it contains "error" or we're in verbose mode
  if (args.some(arg => typeof arg === 'string' && arg.toLowerCase().includes('error')) || process.env.VERBOSE) {
    originalConsoleLog(...args);
  }
};
