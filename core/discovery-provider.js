/**
 * Abstract base class for discovery providers
 * Defines the common interface that all discovery methods must implement
 */
class DiscoveryProvider {
  constructor(name) {
    this.name = name
    this.isActive = false
    this.discoveredDevices = new Map()
  }

  /**
   * Start advertising this device
   * @param {Object} config - Configuration for advertising
   * @returns {Promise<void>}
   */
  async startAdvertising(config) {
    throw new Error(`${this.name} provider must implement startAdvertising`)
  }

  /**
   * Stop advertising this device
   * @returns {Promise<void>}
   */
  async stopAdvertising() {
    throw new Error(`${this.name} provider must implement stopAdvertising`)
  }

  /**
   * Start browsing for devices
   * @param {Function} onDeviceFound - Callback when a device is found
   * @returns {Promise<void>}
   */
  async startBrowsing(onDeviceFound) {
    throw new Error(`${this.name} provider must implement startBrowsing`)
  }

  /**
   * Stop browsing for devices
   * @returns {Promise<void>}
   */
  async stopBrowsing() {
    throw new Error(`${this.name} provider must implement stopBrowsing`)
  }

  /**
   * Clean up all resources
   * @returns {Promise<void>}
   */
  async cleanup() {
    await this.stopAdvertising()
    await this.stopBrowsing()
    this.discoveredDevices.clear()
    this.isActive = false
  }

  /**
   * Check if this discovery method is available on the current platform
   * @returns {Promise<boolean>}
   */
  async isAvailable() {
    return true
  }
}

module.exports = DiscoveryProvider 