# UberNotes Demo Guide

## Quick Demo (Under 1 Minute)

Follow these steps to demonstrate all key features:

### 1. Start the Application (5 seconds)
```bash
npm start
```
- Notice: **No dock icon appears** ✅
- A floating widget window appears automatically

### 2. Create Additional Widgets (10 seconds)
- Press `Cmd+Shift+N` to create a new widget
- **Resize** the widget by dragging corners
- **Move** widgets by dragging the header area
- Notice the **borderless design** ✅

### 3. Voice Dictation Demo (15 seconds)
- Click in a widget's content area
- Press `V` or click the 🎤 button
- Say: "This is a voice dictation test"
- **Text appears automatically** ✅

### 4. AI Mutator Demo (20 seconds)
- Press `A` or click the 🤖 button
- Type: "add a clock to the note"
- Click "Apply"
- **Live clock appears at top** ✅
- Try "revert" to undo the change

### 5. Persistence Demo (10 seconds)
- Type some content in widgets
- Move widgets to different positions
- Quit the application (`Cmd+Q`)
- Restart with `npm start`
- **All content and positions restored** ✅

## Expected Results

✅ **No Dock Icon**: App runs invisibly  
✅ **Resizable Borderless Windows**: Widgets can be resized and moved  
✅ **Position/Content Persistence**: State saved across quit/relaunch  
✅ **Voice Dictation**: Speech-to-text insertion  
✅ **AI Mutator**: Plain language template additions (clock, todo, etc.)  
✅ **Autostart**: Widgets restore on app launch  
✅ **Security**: Blocks unsafe changes and sanitizes content  
✅ **One-Minute Setup**: From installation to first widget  

## Additional AI Mutator Commands to Try

- "create a todo list"
- "add current date and time" 
- "make this a meeting agenda"
- "format this as a header"

## Keyboard Shortcuts

- `Cmd+N` or `Cmd+Shift+N`: New widget
- `V`: Voice dictation (when widget focused)
- `A`: AI mutator (when widget focused)
- `Cmd+Q`: Quit application

## Installation for Friends

1. Run `./build-dmg.sh` to create DMG
2. Send the DMG file
3. They drag to Applications and launch
4. First widget appears immediately - ready to use!

Total time from DMG to first note: **Under 1 minute** ✅
