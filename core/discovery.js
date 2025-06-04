const Bonjour = require('bonjour-service')

class DiscoveryService {
  constructor() {
    this.bonjour = new Bonjour()
    this.service = null
    this.browser = null
    this.discoveredDevices = new Map()
  }

  // Advertise this machine as a _neardrop._tcp service
  advertise(port = 5000, name = require('os').hostname()) {
    if (this.service) {
      this.service.stop()
    }

    this.service = this.bonjour.publish({
      name: name,
      type: 'neardrop',
      port: port,
      txt: {
        version: '1.0.0',
        platform: process.platform
      }
    })

    console.log(`Advertising NearDrop service on port ${port} as "${name}"`)
    return this.service
  }

  // Browse for other _neardrop._tcp services
  browseForDevices() {
    return new Promise((resolve) => {
      const devices = []
      
      if (this.browser) {
        this.browser.stop()
      }

      this.browser = this.bonjour.find({ type: 'neardrop' }, (service) => {
        // Skip our own service
        if (service.name === require('os').hostname()) {
          return
        }

        const device = {
          id: service.name,
          name: service.name,
          address: service.addresses && service.addresses.length > 0 ? service.addresses[0] : service.host,
          port: service.port,
          txt: service.txt || {}
        }

        devices.push(device)
        console.log('Discovered device:', device)
      })

      // Return results after 3 seconds of browsing
      setTimeout(() => {
        this.browser.stop()
        resolve(devices)
      }, 3000)
    })
  }

  // Stop all discovery services
  stop() {
    if (this.service) {
      this.service.stop()
      this.service = null
    }
    if (this.browser) {
      this.browser.stop()
      this.browser = null
    }
    this.bonjour.destroy()
  }
}

module.exports = DiscoveryService 