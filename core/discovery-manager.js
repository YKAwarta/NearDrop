const EventEmitter = require('events')
const MDNSDiscoveryProvider = require('./discovery-mdns')
const BLEDiscoveryProvider = require('./discovery-ble')

/**
 * Discovery Manager
 * Orchestrates multiple discovery providers to work in parallel
 * Provides a unified interface for device discovery
 */
class DiscoveryManager extends EventEmitter {
  constructor() {
    super()
    this.providers = new Map()
    this.discoveredDevices = new Map()
    this.isRunning = false
    this.advertisingConfig = null
    this.initialized = false
    this.initPromise = null
  }

  async initialize() {
    if (this.initialized) return
    if (this.initPromise) return this.initPromise

    this.initPromise = this._doInitialize()
    await this.initPromise
    this.initialized = true
  }

  async _doInitialize() {
    // Always add mDNS provider
    const mdnsProvider = new MDNSDiscoveryProvider()
    this.providers.set('mdns', mdnsProvider)

    // Add BLE provider if available
    const bleProvider = new BLEDiscoveryProvider()
    if (await bleProvider.isAvailable()) {
      this.providers.set('ble', bleProvider)
      console.log('[DiscoveryManager] BLE discovery available')
    } else {
      console.log('[DiscoveryManager] BLE discovery not available on this platform')
    }
  }

  /**
   * Start advertising this device on all available providers
   * @param {Object} config - Advertising configuration
   */
  async startAdvertising(config = {}) {
    await this.initialize()
    
    this.advertisingConfig = config
    console.log('[DiscoveryManager] Starting advertising on all providers')

    const promises = []
    for (const [name, provider] of this.providers) {
      promises.push(
        provider.startAdvertising(config)
          .then(() => console.log(`[DiscoveryManager] ${name} advertising started`))
          .catch(err => console.error(`[DiscoveryManager] ${name} advertising failed:`, err))
      )
    }

    await Promise.allSettled(promises)
    this.isRunning = true
  }

  /**
   * Stop advertising on all providers
   */
  async stopAdvertising() {
    if (!this.initialized) return
    
    console.log('[DiscoveryManager] Stopping advertising on all providers')

    const promises = []
    for (const [name, provider] of this.providers) {
      promises.push(
        provider.stopAdvertising()
          .catch(err => console.error(`[DiscoveryManager] ${name} stop advertising failed:`, err))
      )
    }

    await Promise.allSettled(promises)
  }

  /**
   * Browse for devices using all available providers
   * @returns {Promise<Array>} Array of discovered devices
   */
  async browseForDevices() {
    await this.initialize()
    
    console.log('[DiscoveryManager] Starting device discovery on all providers')
    
    // Clear previous discoveries
    this.discoveredDevices.clear()

    // Set up discovery timeout
    const discoveryTimeout = 5000 // 5 seconds

    return new Promise((resolve) => {
      // Device found handler
      const onDeviceFound = (device) => {
        const existingDevice = this.discoveredDevices.get(device.id)
        
        if (!existingDevice || existingDevice.lastSeen < device.lastSeen) {
          // New device or updated info
          this.discoveredDevices.set(device.id, device)
          console.log(`[DiscoveryManager] Device discovered via ${device.discoveryType}:`, device.name)
          
          // Emit event for real-time updates
          this.emit('deviceFound', device)
        }
      }

      // Start browsing on all providers
      const browsingPromises = []
      for (const [name, provider] of this.providers) {
        browsingPromises.push(
          provider.startBrowsing(onDeviceFound)
            .then(() => console.log(`[DiscoveryManager] ${name} browsing started`))
            .catch(err => console.error(`[DiscoveryManager] ${name} browsing failed:`, err))
        )
      }

      Promise.allSettled(browsingPromises).then(() => {
        // Wait for discovery timeout
        setTimeout(async () => {
          // Stop all providers
          await this.stopBrowsing()
          
          // Return discovered devices
          const devices = Array.from(this.discoveredDevices.values())
          console.log(`[DiscoveryManager] Discovery complete. Found ${devices.length} devices`)
          resolve(devices)
        }, discoveryTimeout)
      })
    })
  }

  /**
   * Start continuous browsing with real-time updates
   * Use this for live discovery instead of one-time browse
   */
  async startContinuousBrowsing() {
    await this.initialize()
    
    console.log('[DiscoveryManager] Starting continuous browsing')

    const onDeviceFound = (device) => {
      const existingDevice = this.discoveredDevices.get(device.id)
      
      if (!existingDevice || existingDevice.lastSeen < device.lastSeen) {
        this.discoveredDevices.set(device.id, device)
        this.emit('deviceFound', device)
      }
    }

    // Start browsing on all providers
    for (const [name, provider] of this.providers) {
      try {
        await provider.startBrowsing(onDeviceFound)
      } catch (err) {
        console.error(`[DiscoveryManager] ${name} continuous browsing failed:`, err)
      }
    }

    // Periodically clean up stale devices
    this.cleanupInterval = setInterval(() => {
      this.cleanupStaleDevices()
    }, 30000) // Every 30 seconds
  }

  /**
   * Stop browsing on all providers
   */
  async stopBrowsing() {
    if (!this.initialized) return
    
    console.log('[DiscoveryManager] Stopping browsing on all providers')

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }

    const promises = []
    for (const [name, provider] of this.providers) {
      promises.push(
        provider.stopBrowsing()
          .catch(err => console.error(`[DiscoveryManager] ${name} stop browsing failed:`, err))
      )
    }

    await Promise.allSettled(promises)
  }

  /**
   * Clean up devices that haven't been seen recently
   */
  cleanupStaleDevices() {
    const staleTimeout = 60000 // 1 minute
    const now = Date.now()
    
    for (const [id, device] of this.discoveredDevices) {
      if (now - device.lastSeen > staleTimeout) {
        this.discoveredDevices.delete(id)
        this.emit('deviceLost', device)
      }
    }
  }

  /**
   * Get currently discovered devices
   * @returns {Array} Array of discovered devices
   */
  getDiscoveredDevices() {
    return Array.from(this.discoveredDevices.values())
  }

  /**
   * Get device by ID
   * @param {string} deviceId - Device ID
   * @returns {Object|null} Device object or null
   */
  getDevice(deviceId) {
    return this.discoveredDevices.get(deviceId) || null
  }

  /**
   * Get available discovery providers
   * @returns {Array} Array of provider names
   */
  getAvailableProviders() {
    return Array.from(this.providers.keys())
  }

  /**
   * Clean up all resources
   */
  async cleanup() {
    if (!this.initialized) return
    
    console.log('[DiscoveryManager] Cleaning up all providers')

    await this.stopAdvertising()
    await this.stopBrowsing()

    // Cleanup all providers
    const promises = []
    for (const [name, provider] of this.providers) {
      promises.push(
        provider.cleanup()
          .catch(err => console.error(`[DiscoveryManager] ${name} cleanup failed:`, err))
      )
    }

    await Promise.allSettled(promises)
    
    this.providers.clear()
    this.discoveredDevices.clear()
    this.removeAllListeners()
    this.isRunning = false
    this.initialized = false
    this.initPromise = null
  }
}

// Export as singleton
module.exports = new DiscoveryManager() 