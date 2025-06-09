const { Bonjour } = require('bonjour-service')
const os = require('os')
const net = require('net')

class DiscoveryService {
  constructor() {
    this.bonjour = new Bonjour()
    this.service = null
    this.browser = null
    this.discoveredDevices = new Map()
  }

  getLocalIPAddresses() {
    const interfaces = os.networkInterfaces()
    const ipAddresses = []

    Object.keys(interfaces).forEach((interfaceName) => {
      interfaces[interfaceName].forEach((details) => {
        if(!details.internal && details.family === 'IPv4' && !details.address.startsWith('127.') && !details.address.startsWith('169.254.')) {
          ipAddresses.push(details.address)
        }
      })
    })
    return ipAddresses
  }

  // Advertise this machine as a _neardrop._tcp service
  advertise(port = 5001, name = os.hostname()) {
    if (this.service) {
      this.service.stop()
    }

    const localIPs = this.getLocalIPAddresses()
    console.log('Local IP Addresses:', localIPs)

    this.service = this.bonjour.publish({
      name: name,
      type: 'neardrop',
      port: port,
      txt: {
        version: '1.0.0',
        platform: process.platform,
        ips: localIPs.join(',')
      },
    })

    console.log(`Advertising NearDrop service on port ${port} as "${name}"`)
    return this.service
  }

  // Browse for other _neardrop._tcp services
  browseForDevices() {
    return new Promise((resolve) => {
      const devices = []
      const localIPs = this.getLocalIPAddresses()

      if (this.browser) {
        this.browser.stop()
      }

      this.browser = this.bonjour.find({ type: 'neardrop' }, (service) => {
        // Skip our own service
        if (service.name === os.hostname()) {
          return
        }

        const serviceAddresses = (service.addresses || [])
          .filter(addr => {
            return net.isIPv4(addr) &&
            !localIPs.includes(addr) &&
            !addr.startsWith('127.') && // Exclude loopback addresses
            !addr.startsWith('169.254.') // Exclude link-local addresses
          })

        const validAddress = serviceAddresses.length > 0 ? serviceAddresses[0] : (service.referer?.address || service.host)

        if(!validAddress) {
          console.warn('No valid address found for service:', service)
          return
        }

        const device = {
          id: service.name,
          name: service.name,
          address: validAddress,
          port: service.port || 5001,
          txt: service.txt || {},
        }

        console.log('Discovered device:', device)
        
        //Avoiding duplicates
        const existingDeviceIndex = devices.findIndex(d => d.address === device.address)
        if(existingDeviceIndex === -1) {
          devices.push(device)
        }
      })

      // Return results after 3 seconds of browsing
      setTimeout(() => {
        this.browser.stop()
        console.log('Discovery complete. Found devices:', devices)
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
