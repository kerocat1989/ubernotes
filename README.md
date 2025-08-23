# UberNotes

Floating note widgets with AI assistance and voice dictation for macOS.

## Features

✅ **No Dock Icon**: The app runs invisibly in the background during normal use  
✅ **Resizable Borderless Widgets**: Create floating note windows that can be resized and positioned anywhere  
✅ **Persistent State**: All widget positions and content are automatically saved and restored after quit/relaunch  
✅ **Voice Dictation**: Press 'V' or click the microphone to insert text via speech recognition  
✅ **AI Mutator**: Press 'A' or click the robot icon to add templates like clocks, todo lists, meeting agendas  
✅ **Autostart**: Automatically restores all widgets in their last positions on system login  
✅ **Unsafe Changes Blocking**: Prevents navigation to external URLs and other security risks  
✅ **One-Minute Setup**: Install from DMG and create your first widget immediately  

## Quick Start

1. **Install**: Download and open the DMG, drag UberNotes to Applications
2. **Create Widget**: Press `Cmd+Shift+N` to create your first floating note widget
3. **Voice Input**: Focus a widget and press `V` to start voice dictation
4. **AI Templates**: Press `A` to add templates like "add a clock" or "create a todo list"
5. **Shortcuts**: 
   - `Cmd+N` or `Cmd+Shift+N`: New widget
   - `V`: Voice dictation (when widget focused)
   - `A`: AI mutator (when widget focused)

## Voice Dictation

The voice dictation feature uses the built-in Web Speech API:
- Press `V` key or click the microphone icon
- Speak clearly into your microphone
- Text will be inserted at your cursor position
- Press the microphone again or wait for silence to stop

## AI Mutator

The AI mutator provides intelligent template insertion:

### Available Commands
- **"Add a clock"** - Inserts a live updating clock widget
- **"Add current date"** - Inserts today's date
- **"Create todo list"** - Adds a checkbox-style todo list template
- **"Meeting agenda"** - Creates a structured meeting agenda with date/time
- **"Make this a header"** - Formats the first line as a header

### Usage
1. Click the 🤖 button or press `A`
2. Type your instruction in plain English
3. Click "Apply" to add the template
4. Use "Revert" to undo the last change

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Create DMG
./build-dmg.sh
```

## Architecture

- **Main Process** (`src/main.js`): Electron main process, widget management, state persistence
- **Widget Windows**: Borderless, resizable windows with individual HTML/CSS/JS
- **Preload Script** (`src/preload.js`): Secure communication bridge between main and renderer
- **Widget UI** (`src/widget.html/css/js`): Individual widget interface and functionality
- **State Storage**: Uses `electron-store` for persistent configuration and widget states

## Cross-Platform Considerations

### Current Implementation (macOS)
- Uses macOS-specific features like `app.dock.hide()`
- Voice recognition via WebKit Speech API
- Native autostart through `app.setLoginItemSettings()`

### Future Linux Support
To maintain compatibility for future Linux/Electron versions:

1. **Folder Structure**: The current `src/` and widget storage format is platform-agnostic
2. **Configuration Format**: `electron-store` data is JSON-based and portable
3. **Widget Manifests**: All widget state (position, content, templates) uses standard formats

### Recommended Linux Adaptations
```javascript
// Platform detection
if (process.platform === 'linux') {
  // Use tray icon instead of hiding dock
  // Implement autostart via .desktop files
  // Ensure voice recognition fallbacks
}
```

### Stable Data Formats
- **Widget State**: `{ x, y, width, height, content, template }`
- **Configuration**: `{ widgets: {}, settings: {} }`
- **Templates**: HTML-based with CSS classes for styling

This structure ensures that widget data and configurations can be shared between macOS and Linux implementations without migration.

## Security

UberNotes implements several security measures:
- **Content Sanitization**: HTML content is sanitized to prevent XSS
- **Navigation Blocking**: Prevents navigation to external URLs
- **Context Isolation**: Renderer processes run in isolated contexts
- **Safe IPC**: All main/renderer communication uses secure IPC channels

## License

MIT License - feel free to use and modify as needed.
