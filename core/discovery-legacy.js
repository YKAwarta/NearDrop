const { Bonjour } = require('bonjour-service')
const os = require('os')
const net = require('net')
const dns = require('dns')
const crypto = require('crypto')

 /**
  * DiscoveryService manages network device discovery using mDNS (Bonjour).
  * 
  * Key Responsibilities:
  * 1. Advertise the local device on the network
  * 2. Browse and discover other NearDrop/Jeeb devices
  * 3. Handle cross-platform network interface diagnostics
  **/
class DiscoveryService {
  constructor() {
    this.bonjour = new Bonjour() // Initialize Bonjour service for mDNS
    this.service = null // Holds the advertised service instance
    this.browser = null
    this.discoveredDevices = new Map() //Cache for discovered devices
    this.deviceId = this.generateDeviceId() // Generate a unique device ID
  }

  //Generate a consistent, unique device identifier
  generateDeviceId() {
    //Combine multiple system identified for uniqueness
    const identifiers = [os.hostname(), os.platform(), os.networkInterfaces().en0?.[0]?.mac || 'NO_MAC']
    
    //Create a hash to generate a unique ID
    return crypto
      .createHash('md5')
      .update(identifiers.join('|'))
      .digest('hex')
      .slice(0, 12) // Shorten to 16 characters for simplicity
  
  }

  
   /**
    * Retrieve local network IP addresses with filtering.
    * 
    * Eliminates loopback and link-local addresses,
    * Ensure we only get routable IPv4 addresses (Eventually maybe IPv6).
    * Handle different network interface configurations across platforms.
    * @returns {string[]} Array of valid local IP addresses.
    **/
  getLocalIPAddresses() {
    const interfaces = os.networkInterfaces()
    const ipAddresses = []

    //Detailed logging for network debugging
    console.log('Network Interfaces Debugging:')
    Object.keys(interfaces).forEach(interfaceName => {
      console.log(`Checking Interface: ${interfaceName}:`)
      interfaces[interfaceName].forEach(details => {
        console.log(`Interface Details: `, details)

        //Strict IP address validation
        // - Must be IPv4
        // - Must not be loopback (127.x.x.x)
        // - Must not be link-local (169.254.x.x)
        if (
          !details.internal &&
          details.family === 'IPv4' &&
          !details.address.startsWith('127.') &&
          !details.address.startsWith('169.254.')
        ) {
          ipAddresses.push(details.address)
          console.log(`Found valid IP: ${details.address} on interface ${interfaceName}`)
        }
      })
    })
    return ipAddresses
  }


   /**
    * Perform additional network diagnostics.
    * 
    * Helps diagnose network-related issues by resolving the local hostname.
    * Provides more contet about local network configuration for debugging.
    * @return {Promise} Resolves with hostname, address, and family/IP info.
    **/
  async performNetworkDiagnostics() {
    try {
      const hostname = os.hostname()
      console.log(`Resolving: ${hostname}`)

      return new Promise((resolve, reject) => {
        dns.lookup(hostname, (err, address, family) => {
          if (err) {
            console.error(`Hostname resolution error for ${hostname}:`, err)
            return reject(err)
          } else {
            console.log(`Hostname resolved: ${address} (IPv${family})`)
            resolve({ hostname, address, family })
          }
        })
      })
    } catch (error) {
      console.error('Network diagnostics failed:', error)
      throw error
    }
  }


  /**
   * Advertise this machine as a _neardrop._tcp service
   * 
   * @param {number} port - Port to advertise the service on (default: 5001)
   * @param {string} name - Name to advertise the service as (default: hostname)
   * @returns {Object} The advertised service instance.
   **/
  advertise(port = 5001, name = os.hostname()) {
    //Stop any existing service before starting a new one, to prevent duplicates
    if (this.service) {
      this.service.stop()
    }

    //Get local IP addresses for service metadata
    const localIPs = this.getLocalIPAddresses()
    console.log('Local IP Addresses:', localIPs)

    //OPTIONAL: Helps diagnose network issues
    this.performNetworkDiagnostics()

    //Publish Bonjour service with metadata
    this.service = this.bonjour.publish({
      name: name,
      type: 'neardrop',
      port: port,
      txt: {
        version: '1.0.0',
        platform: process.platform,
        ips: localIPs.join(','),
        deviceId: this.deviceId,
      },
    })

    console.log(`Advertising NearDrop service on port ${port} as "${name}" with ID ${this.deviceId}`)
    return this.service
  }


  /**
   * Browse and discover NearDrop devices on the local network
   * 
   * @returns {Promise<Array>} List of discovered devices
   **/
  browseForDevices() {
    return new Promise(resolve => {
      const devices = []
      const localIPs = this.getLocalIPAddresses()

      //Stop any existing browser instance to prevent conflicts
      if (this.browser) {
        this.browser.stop()
      }

      console.log('Starting device browsing with local IPS:', localIPs)

      //Use Bonjour to find NearDrop services
      this.browser = this.bonjour.find({ type: 'neardrop' }, service => {
        console.log('Found service:', service)

        const serviceId = service.txt?.deviceId

        // Skip discovering our own service
        if (serviceId === this.deviceId) {
          return
        }

        //Validate aand filter service addresses
        const serviceAddresses = (service.addresses || []).filter(addr => {
          //Address validation:
          const isValid =
            net.isIPv4(addr) &&
            !localIPs.includes(addr) &&
            !addr.startsWith('127.') && // Exclude loopback addresses
            !addr.startsWith('169.254.') // Exclude link-local addresses

          console.log(`Checking Address ${addr} is valid: ${isValid ? 'Valid' : 'Invalid'} `)
          return isValid
        })

        //FALLBACK: To alternative address sources
        const validAddress = serviceAddresses.length > 0
            ? serviceAddresses[0]
            : (service.referer?.address || service.host)

        if (!validAddress) {
          console.warn('No valid address found for service:', service)
          return
        }

        //Construct device object with essential properties
        const device = {
          id: serviceId || service.name,
          name: service.name.replace('-local', ''),
          address: validAddress,
          port: service.port || 5001,
          txt: service.txt || {},
        }

        console.log('Discovered device:', device)

        //Avoiding duplicates
        const existingDeviceIndex = devices.findIndex(d => d.address === device.address)
        if (existingDeviceIndex === -1) {
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
