const os = require('os')
const crypto = require('crypto')
const DiscoveryProvider = require('./discovery-provider')

/**
 * BLE Discovery Provider
 * Handles device discovery using Bluetooth Low Energy
 * 
 * Note: BLE support varies by platform and requires appropriate permissions
 */
class BLEDiscoveryProvider extends DiscoveryProvider {
  constructor() {
    super('BLE')
    this.noble = null
    this.bleno = null
    this.scanInterval = null
    this.advertisingInterval = null
    this.deviceId = this.generateDeviceId()
    this.serviceUUID = 'a5a5a5a5-a5a5-a5a5-a5a5-a5a5a5a5a5a5' // NearDrop service UUID
    this.characteristicUUID = 'b5b5b5b5-b5b5-b5b5-b5b5-b5b5b5b5b5b5'
  }

  generateDeviceId() {
    const identifiers = [
      os.hostname(),
      os.platform(),
      'BLE',
      Date.now().toString()
    ]
    
    return crypto
      .createHash('md5')
      .update(identifiers.join('|'))
      .digest('hex')
      .slice(0, 12)
  }

  async initialize() {
    try {
      // Try to load BLE libraries
      // Using dynamic imports to handle optional dependencies
      if (process.platform === 'darwin' || process.platform === 'linux') {
        try {
          // For scanning (central role)
          this.noble = require('@abandonware/noble')
          // For advertising (peripheral role)
          this.bleno = require('@abandonware/bleno')
          console.log('[BLE] Successfully loaded BLE libraries')
          return true
        } catch (err) {
          console.warn('[BLE] Could not load @abandonware libraries:', err.message)
        }
      }

      // Platform-specific fallbacks could be added here
      console.warn('[BLE] No suitable BLE library found for platform:', process.platform)
      return false
    } catch (error) {
      console.error('[BLE] Failed to initialize:', error)
      return false
    }
  }

  async isAvailable() {
    // Check if BLE is available on this platform
    if (!await this.initialize()) {
      return false
    }

    // Check if Bluetooth is powered on
    if (this.noble) {
      return new Promise((resolve) => {
        const checkState = () => {
          if (this.noble.state === 'poweredOn') {
            resolve(true)
          } else {
            resolve(false)
          }
        }

        if (this.noble.state === 'unknown') {
          this.noble.once('stateChange', checkState)
          // Timeout after 3 seconds
          setTimeout(() => resolve(false), 3000)
        } else {
          checkState()
        }
      })
    }

    return false
  }

  async startAdvertising(config = {}) {
    const { port = 5001, name = os.hostname() } = config

    if (!this.bleno) {
      console.warn('[BLE] Advertising not available - bleno not loaded')
      return
    }

    console.log(`[BLE] Starting advertising as "${name}"`)

    // Create service data
    const serviceData = JSON.stringify({
      name: name,
      port: port,
      deviceId: this.deviceId,
      platform: process.platform,
      version: '1.0.0',
      discoveryType: 'ble'
    })

    // Start advertising
    this.bleno.on('stateChange', (state) => {
      if (state === 'poweredOn') {
        this.bleno.startAdvertising('NearDrop-' + name, [this.serviceUUID], (error) => {
          if (error) {
            console.error('[BLE] Advertising start error:', error)
          } else {
            console.log('[BLE] Started advertising')
            this.isActive = true
          }
        })
      } else {
        this.bleno.stopAdvertising()
      }
    })

    // Handle advertising start
    this.bleno.on('advertisingStart', (error) => {
      if (!error) {
        console.log('[BLE] Advertising started successfully')
        // Set up the service with our data
        const PrimaryService = this.bleno.PrimaryService
        const Characteristic = this.bleno.Characteristic

        const dataCharacteristic = new Characteristic({
          uuid: this.characteristicUUID,
          properties: ['read'],
          value: Buffer.from(serviceData),
          onReadRequest: (offset, callback) => {
            callback(Characteristic.RESULT_SUCCESS, Buffer.from(serviceData))
          }
        })

        const primaryService = new PrimaryService({
          uuid: this.serviceUUID,
          characteristics: [dataCharacteristic]
        })

        this.bleno.setServices([primaryService])
      }
    })
  }

  async stopAdvertising() {
    if (this.bleno) {
      this.bleno.stopAdvertising()
      console.log('[BLE] Stopped advertising')
    }
  }

  async startBrowsing(onDeviceFound) {
    if (!this.noble) {
      console.warn('[BLE] Scanning not available - noble not loaded')
      return
    }

    console.log('[BLE] Starting device scanning')

    // Set up discovery handlers
    this.noble.on('discover', async (peripheral) => {
      // Filter by our service UUID
      if (!peripheral.advertisement.serviceUuids.includes(this.serviceUUID)) {
        return
      }

      console.log(`[BLE] Discovered device: ${peripheral.advertisement.localName}`)

      try {
        // Connect to read device info
        await this.connectAndReadDevice(peripheral, onDeviceFound)
      } catch (error) {
        console.error('[BLE] Error reading device:', error)
      }
    })

    // Start scanning
    this.noble.on('stateChange', (state) => {
      if (state === 'poweredOn') {
        this.noble.startScanning([this.serviceUUID], false)
        this.isActive = true
      } else {
        this.noble.stopScanning()
      }
    })

    // If already powered on, start immediately
    if (this.noble.state === 'poweredOn') {
      this.noble.startScanning([this.serviceUUID], false)
      this.isActive = true
    }
  }

  async connectAndReadDevice(peripheral, onDeviceFound) {
    return new Promise((resolve, reject) => {
      peripheral.connect((error) => {
        if (error) {
          reject(error)
          return
        }

        peripheral.discoverServices([this.serviceUUID], (error, services) => {
          if (error) {
            peripheral.disconnect()
            reject(error)
            return
          }

          const service = services[0]
          if (!service) {
            peripheral.disconnect()
            reject(new Error('Service not found'))
            return
          }

          service.discoverCharacteristics([this.characteristicUUID], (error, characteristics) => {
            if (error) {
              peripheral.disconnect()
              reject(error)
              return
            }

            const characteristic = characteristics[0]
            if (!characteristic) {
              peripheral.disconnect()
              reject(new Error('Characteristic not found'))
              return
            }

            characteristic.read((error, data) => {
              peripheral.disconnect()

              if (error) {
                reject(error)
                return
              }

              try {
                const deviceInfo = JSON.parse(data.toString())
                const device = {
                  id: deviceInfo.deviceId,
                  name: deviceInfo.name,
                  address: peripheral.address || peripheral.id, // BLE uses MAC address
                  port: deviceInfo.port,
                  platform: deviceInfo.platform,
                  discoveryType: 'ble',
                  rssi: peripheral.rssi, // Signal strength
                  lastSeen: Date.now()
                }

                // Update cache
                this.discoveredDevices.set(device.id, device)

                // Notify
                if (onDeviceFound) {
                  onDeviceFound(device)
                }

                resolve(device)
              } catch (parseError) {
                reject(parseError)
              }
            })
          })
        })
      })
    })
  }

  async stopBrowsing() {
    if (this.noble) {
      this.noble.stopScanning()
      console.log('[BLE] Stopped scanning')
    }
  }

  async cleanup() {
    await super.cleanup()
    
    // Clean up event listeners
    if (this.noble) {
      this.noble.removeAllListeners()
    }
    if (this.bleno) {
      this.bleno.removeAllListeners()
    }
  }
}

module.exports = BLEDiscoveryProvider 