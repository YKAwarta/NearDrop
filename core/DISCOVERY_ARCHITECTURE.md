# Discovery Architecture with BLE Support

## Overview

NearDrop now supports multiple discovery methods working in parallel:
- **mDNS/Bonjour**: Works over local network (WiFi/Ethernet)
- **BLE (Bluetooth Low Energy)**: Works over Bluetooth for proximity-based discovery

## Architecture Components

### 1. Discovery Provider Interface (`discovery-provider.js`)
Base class that defines the common interface for all discovery methods:
- `startAdvertising()`: Advertise this device
- `stopAdvertising()`: Stop advertising
- `startBrowsing()`: Start discovering devices
- `stopBrowsing()`: Stop discovering
- `isAvailable()`: Check if the discovery method is available
- `cleanup()`: Clean up resources

### 2. mDNS Provider (`discovery-mdns.js`)
- Uses Bonjour protocol for network discovery
- Works on all platforms
- Discovers devices on the same network subnet

### 3. BLE Provider (`discovery-ble.js`)
- Uses Bluetooth Low Energy for proximity discovery
- Platform support varies (best on macOS and Linux)
- Works without network connectivity
- Includes signal strength (RSSI) for proximity estimation

### 4. Discovery Manager (`discovery-manager.js`)
- Orchestrates multiple providers in parallel
- Provides unified API for device discovery
- Handles de-duplication of discovered devices
- Emits real-time events for device found/lost

## Installation

```bash
# Install with optional BLE dependencies
npm install

# BLE libraries are optional and may require additional setup:
# macOS: Requires Bluetooth permissions
# Linux: May require sudo or bluetooth group membership
# Windows: Limited support
```

## Usage Examples

### Basic Discovery (One-time)
```javascript
const discoveryManager = require('./core/discovery-manager')

// Start advertising
await discoveryManager.startAdvertising({ 
  port: 5001, 
  name: 'My Device' 
})

// Discover devices (returns after 5 seconds)
const devices = await discoveryManager.browseForDevices()
console.log('Found devices:', devices)
```

### Continuous Discovery with Events
```javascript
// Listen for real-time discovery events
discoveryManager.on('deviceFound', (device) => {
  console.log('New device found:', device)
  console.log('Discovery method:', device.discoveryType) // 'mdns' or 'ble'
})

discoveryManager.on('deviceLost', (device) => {
  console.log('Device lost:', device)
})

// Start continuous browsing
await discoveryManager.startContinuousBrowsing()
```

### Device Object Structure
```javascript
{
  id: 'unique-device-id',
  name: 'Device Name',
  address: '192.168.1.100', // IP for mDNS, MAC for BLE
  port: 5001,
  platform: 'darwin',
  discoveryType: 'mdns' | 'ble',
  rssi: -50, // Signal strength (BLE only)
  lastSeen: 1234567890, // Timestamp
  txt: {} // Additional metadata
}
```

## Platform-Specific Notes

### macOS
- BLE requires Bluetooth permissions in System Preferences
- Both mDNS and BLE should work well

### Linux
- BLE may require:
  - User to be in `bluetooth` group
  - `sudo setcap cap_net_raw+eip $(which node)`
  - BlueZ 5.x installed

### Windows
- BLE support is limited
- mDNS works well
- Consider using only mDNS on Windows

## Troubleshooting

### BLE Not Available
```javascript
// Check available providers
const providers = discoveryManager.getAvailableProviders()
console.log('Available providers:', providers) // ['mdns'] or ['mdns', 'ble']
```

### Permissions Issues
- macOS: Check System Preferences > Security & Privacy > Bluetooth
- Linux: Run `sudo usermod -a -G bluetooth $USER` and relogin
- All platforms: May need to run with elevated privileges initially

### Discovery Not Working
1. Check if services are running:
   ```javascript
   console.log('Is running:', discoveryManager.isRunning)
   ```

2. Enable debug logging:
   ```javascript
   // Set DEBUG=* environment variable
   DEBUG=* npm start
   ```

3. Test individual providers:
   ```javascript
   const BLEProvider = require('./core/discovery-ble')
   const ble = new BLEProvider()
   console.log('BLE available:', await ble.isAvailable())
   ```

## Benefits of Parallel Discovery

1. **Redundancy**: If one method fails, the other continues working
2. **Extended Range**: BLE works for nearby devices, mDNS for network devices
3. **Offline Support**: BLE works without network connectivity
4. **Better Discovery**: Finds devices that might be missed by single method
5. **Cross-Platform**: At least one method works on every platform 