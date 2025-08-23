# Demo Widgets

This directory contains example widgets that showcase different use cases for UberNotes. Each demo widget is a self-contained example with its own HTML, CSS, and JavaScript files.

## Available Demo Widgets

### 🌤️ Cupertino Weather (`cupertino-weather`)
- **Description**: Live weather and time display for Cupertino, CA
- **Features**: 
  - Real-time clock updates
  - Simulated weather conditions with dynamic themes
  - Glassmorphism design with backdrop blur
- **Size**: 280x200px
- **Files**: `demos/cupertino-weather/`

### 📈 Ethereum Price Chart (`eth-price-chart`)
- **Description**: Live ETH/USD price tracking with interactive chart
- **Features**:
  - Real-time price updates (simulated)
  - Interactive canvas-based line chart
  - 7-day and 30-day time range selection
  - Price change indicators with color coding
- **Size**: 320x280px
- **Files**: `demos/eth-price-chart/`

## Usage

### From Application Menu
1. Launch UberNotes
2. Go to **UberNotes → Demo Widgets**
3. Select the demo widget you want to create

### From Code
```javascript
// Create a demo widget programmatically
widgetManager.createWidget({ template: 'cupertino-weather' });
widgetManager.createWidget({ template: 'eth-price-chart' });
```

## Creating New Demo Widgets

To add a new demo widget:

1. **Create Directory Structure**
   ```
   demos/your-widget-name/
   ├── widget.html
   ├── widget.css
   └── widget.js
   ```

2. **Register in main.js**
   ```javascript
   const DEMO_WIDGETS = {
     'your-widget-name': {
       name: 'Your Widget Display Name',
       description: 'Brief description of what it does',
       path: 'demos/your-widget-name',
       defaultSize: { width: 300, height: 200 }
     }
   };
   ```

3. **Widget Structure**
   - Each widget should be self-contained
   - Include a close button with id `closeBtn`
   - Add a resize handle with id `resizeHandle`
   - Handle drag and drop for repositioning
   - Support Electron IPC for state persistence

## Technical Notes

- Demo widgets use the same preload script and IPC channels as the main note widget
- State is automatically saved and restored between sessions
- Each widget runs in its own isolated browser window
- CSS should support both light and dark themes when possible
- JavaScript should handle graceful degradation for missing APIs

## Examples

The demo widgets serve as examples for:
- Real-time data visualization
- Canvas-based graphics
- API integration patterns
- Responsive widget design
- Theme adaptation
- State management
- User interaction handling
