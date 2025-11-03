const discoveryManager = require('./discovery-manager')

/**
 * Backward compatibility wrapper for the old DiscoveryService API
 * This wraps the new discovery manager to maintain the old interface
 */
class DiscoveryService {
  constructor() {
    this.deviceId = null
    this.initialized = false
  }

  async _ensureInitialized() {
    if (!this.initialized) {
      await discoveryManager.initialize()
      // Get the device ID from the mDNS provider if available
      const mdnsProvider = discoveryManager.providers.get('mdns')
      if (mdnsProvider) {
        this.deviceId = mdnsProvider.deviceId
      }
      this.initialized = true
    }
  }

  /**
   * Advertise this machine as a service (backward compatibility)
   * @param {number} port - Port to advertise the service on
   * @param {string} name - Name to advertise the service as
   */
  async advertise(port = 5001, name) {
    await this._ensureInitialized()
    // Use the discovery manager's advertising
    return discoveryManager.startAdvertising({ port, name })
  }

  /**
   * Browse for devices (backward compatibility)
   * @returns {Promise<Array>} List of discovered devices
   */
  async browseForDevices() {
    await this._ensureInitialized()
    // Use the discovery manager's browsing
    const devices = await discoveryManager.browseForDevices()
    
    // Transform to match old format if needed
    return devices.map(device => ({
      id: device.id,
      name: device.name,
      address: device.address,
      port: device.port,
      txt: device.txt || {}
    }))
  }

  /**
   * Stop all discovery services (backward compatibility)
   */
  async stop() {
    // Use the discovery manager's cleanup
    return discoveryManager.cleanup()
  }

  /**
   * Get local IP addresses (backward compatibility)
   * @returns {string[]} Array of local IP addresses
   */
  getLocalIPAddresses() {
    // Get from mDNS provider if available
    const mdnsProvider = discoveryManager.providers.get('mdns')
    if (mdnsProvider && mdnsProvider.getLocalIPAddresses) {
      return mdnsProvider.getLocalIPAddresses()
    }
    return []
  }

  /**
   * Generate device ID (backward compatibility)
   * @returns {string} Device ID
   */
  generateDeviceId() {
    return this.deviceId
  }
}

module.exports = DiscoveryService 