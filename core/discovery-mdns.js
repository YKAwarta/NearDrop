const { Bonjour } = require('bonjour-service')
const os = require('os')
const net = require('net')
const crypto = require('crypto')
const DiscoveryProvider = require('./discovery-provider')

/**
 * mDNS/Bonjour Discovery Provider
 * Handles device discovery using mDNS (Bonjour) protocol
 */
class MDNSDiscoveryProvider extends DiscoveryProvider {
  constructor() {
    super('mDNS')
    this.bonjour = new Bonjour()
    this.service = null
    this.browser = null
    this.deviceId = this.generateDeviceId()
  }

  generateDeviceId() {
    const identifiers = [
      os.hostname(),
      os.platform(),
      os.networkInterfaces().en0?.[0]?.mac || 'NO_MAC'
    ]
    
    return crypto
      .createHash('md5')
      .update(identifiers.join('|'))
      .digest('hex')
      .slice(0, 12)
  }

  getLocalIPAddresses() {
    const interfaces = os.networkInterfaces()
    const ipAddresses = []

    Object.keys(interfaces).forEach(interfaceName => {
      interfaces[interfaceName].forEach(details => {
        if (
          !details.internal &&
          details.family === 'IPv4' &&
          !details.address.startsWith('127.') &&
          !details.address.startsWith('169.254.')
        ) {
          ipAddresses.push(details.address)
        }
      })
    })
    return ipAddresses
  }

  async startAdvertising(config = {}) {
    const { port = 5001, name = os.hostname() } = config
    
    // Stop any existing service
    if (this.service) {
      this.service.stop()
    }

    const localIPs = this.getLocalIPAddresses()
    console.log(`[mDNS] Advertising on port ${port} as "${name}"`)

    this.service = this.bonjour.publish({
      name: name,
      type: 'neardrop',
      port: port,
      txt: {
        version: '1.0.0',
        platform: process.platform,
        ips: localIPs.join(','),
        deviceId: this.deviceId,
        discoveryType: 'mdns'
      }
    })

    this.isActive = true
  }

  async stopAdvertising() {
    if (this.service) {
      this.service.stop()
      this.service = null
    }
  }

  async startBrowsing(onDeviceFound) {
    // Stop any existing browser
    if (this.browser) {
      this.browser.stop()
    }

    const localIPs = this.getLocalIPAddresses()
    console.log('[mDNS] Starting device browsing')

    this.browser = this.bonjour.find({ type: 'neardrop' }, service => {
      // Skip our own service
      if (service.txt?.deviceId === this.deviceId) {
        return
      }

      // Validate addresses
      const serviceAddresses = (service.addresses || []).filter(addr => {
        return net.isIPv4(addr) &&
               !localIPs.includes(addr) &&
               !addr.startsWith('127.') &&
               !addr.startsWith('169.254.')
      })

      const validAddress = serviceAddresses[0] || 
                          service.referer?.address || 
                          service.host

      if (!validAddress) {
        console.warn('[mDNS] No valid address found for service:', service.name)
        return
      }

      const device = {
        id: service.txt?.deviceId || service.name,
        name: service.name.replace('-local', ''),
        address: validAddress,
        port: service.port || 5001,
        txt: service.txt || {},
        discoveryType: 'mdns',
        lastSeen: Date.now()
      }

      // Update our cache
      this.discoveredDevices.set(device.id, device)

      // Notify about the discovered device
      if (onDeviceFound) {
        onDeviceFound(device)
      }
    })

    this.isActive = true
  }

  async stopBrowsing() {
    if (this.browser) {
      this.browser.stop()
      this.browser = null
    }
  }

  async cleanup() {
    await super.cleanup()
    if (this.bonjour) {
      this.bonjour.destroy()
    }
  }
}

module.exports = MDNSDiscoveryProvider 