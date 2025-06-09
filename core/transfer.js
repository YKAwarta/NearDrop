const net = require('net')
const fs = require('fs')
const path = require('path')
const os = require('os')

/**
 * FileTransferService manages peer-to-peer file transfers
 * 
 * Key Responsibilities:
 * 1. Cross-platform file transfer to remote devices over TCP
 * 2. Robust error handling and connection management
 * 3. Automatic download path creation and normalization
 * 4. Detailed logging for debugging and diagnostics
 **/
class FileTransferService {
  constructor(options = {}) {
    this.host = options.host || '0.0.0.0' // Listen on all interfaces by default
    this.port = Number(options.port) || 5001 //Ensure port is a number, default to 5001
    this.downloadPath = this.getDownloadPath() //Robust download path handling
    this.onFileReceived = options.onFileReceived || (() => {}) // Callback for file received notifications
    this.onTransferRequest = options.onTransferRequest || (() => {}) // Callback for transfer requests (needs user approval)
    this.onTransferRejected = options.onTransferRejected || (() => {}) // Callback when transfer is rejected
  }

 /**
  * Determine most appropriate download path for the OS.
  * 
  * Handles different OS requirements for download directories.
  * Ensures download directory always exists.
  * Provides fallback to user's home directory if necessary.
  **/
  getDownloadPath() {
    //Use standard Downloads directory for the current user
    const downloadPath = path.join(os.homedir(), 'Downloads')

    try {
        //Recurisve: Creates parent directoreis if they do not exist
      fs.mkdirSync(downloadPath, { recursive: true })

      console.log(`Download path is set to: ${downloadPath}`)
      return downloadPath
    } catch (err) {
        //Fail-safe logging and error handling
      console.error(`Error creating download path: ${err.message}`)
      throw err
    }
  }

 /**
  * Validate and normalize file paths.
  * 
  * Prevent directory traversal attacks
  * Ensures conssitent path representration
  * Validate file is in absolute path
  **/
  normalizePath(filePath) {
    //Reject relative paths for security
    if (!path.isAbsolute(filePath)) {
      throw new Error(`Invalid file path: ${filePath} is not an absolute path.`)
    }
    //Resolve any '..' segments or duplicate separators
    return path.normalize(filePath)
  }

 /**
  * Send file to a specified device.
  * 
  * File transfer process:
  * 1. Validate file and device
  * 2. Establish TCP connection
  * 3. Send file metadata
  * 4. Stream file content to device
  * 5. Handle errors and timeouts gracefully
  **/
  sendFile(device, filePath) {
    return new Promise((resolve, reject) => {
      try {
        //Validate and normalize the file path
        const normalizedPath = this.normalizePath(filePath)

        console.log(
          `Requesting to send file: ${normalizedPath} to device: ${device.name} at ${device.address}:${device.port}`
        )

        //Input validation
        if (!device || !device.address) {
          return reject(new Error('Invalid device information provided'))
        }

        //Verify file exists before transfer
        if (!fs.existsSync(normalizedPath)) {
          return reject(new Error(`File does not exist: ${normalizedPath}`))
        }

        //Create a TCP socket connection to the device
        const client = new net.Socket()
        client.setTimeout(60000)

        //Establish connection to target device
        client.connect(device.port, device.address, () => {
          console.log(`Connected to device: ${device.name} at ${device.address}:${device.port}`)

          //Extract file metadata for request
          const fileName = path.basename(normalizedPath)
          const fileStats = fs.statSync(normalizedPath)

          //Send transfer request instead of direct file transfer
          const transferRequest = JSON.stringify({
            type: 'TRANSFER_REQUEST',
            fileName,
            fileSize: fileStats.size,
            fileType: path.extname(filePath),
            senderName: require('os').hostname()
          })

          console.log(`Sending transfer request for: ${fileName}`)
          client.write(Buffer.from(transferRequest + '\n'))
        })

        //Handle response from receiver
        client.on('data', (data) => {
          const response = data.toString().trim()
          console.log(`Received response: ${response}`)

          if (response === 'ACCEPT') {
            console.log('Transfer approved! Sending file...')
            
            //Now send the actual file
            const fileStream = fs.createReadStream(normalizedPath)
            fileStream.pipe(client)

            fileStream.on('end', () => {
              console.log(`File sent successfully to ${device.name}`)
              client.end()
              resolve({ success: true, message: 'File sent successfully!' })
            })
            
            fileStream.on('error', err => {
              console.error(`Error reading file:`, err)
              client.destroy()
              reject(err)
            })
            
          } else if (response === 'REJECT') {
            console.log('Transfer rejected by receiver')
            client.end()
            resolve({ success: false, message: 'Transfer rejected by recipient' })
          } else {
            console.error('Unknown response from receiver:', response)
            client.destroy()
            reject(new Error('Unknown response from receiver'))
          }
        })

        //Handle connection-level errors
        client.on('error', err => {
          console.error(`Error connecting to device ${device.name}:`, err)
          reject(err)
        })

        //Handle connection timeout
        client.on('timeout', () => {
          console.error(`Connection to ${device.name} timed out`)
          client.destroy()
          reject(new Error('Connection timed out'))
        })
      } catch (err) {
        console.error(`Error sending file: ${err.message}`)
        reject(err)
      }
    })
  }

 /**
  * Start TCP server to receive files.
  * 
  * Process:
  * 1. Listen for incoming connections
  * 2. Parse file metadata
  * 3. Save incoming files
  * 3. Handle connection and file errors
  **/
  startReceiver() {
    //Create TCP server for file reception
    const server = net.createServer(socket => {
      console.log(`New connection from ${socket.remoteAddress}:${socket.remotePort}`)

      let requestData = ''
      let fileStream = null
      let transferApproved = false
      let savePath = null

      //Handle incoming data chunks from the socket
      socket.on('data', async (chunk) => {
        if (!transferApproved) {
          // We're in request phase - accumulate request data
          requestData += chunk.toString()

          const requestEndIndex = requestData.indexOf('\n')
          if (requestEndIndex !== -1) {
            try {
              //Parse transfer request
              const request = JSON.parse(requestData.slice(0, requestEndIndex))
              
              if (request.type === 'TRANSFER_REQUEST') {
                console.log(`Transfer request from ${request.senderName}: ${request.fileName} (${request.fileSize} bytes)`)
                
                // Show approval prompt to user and get save path
                const userResponse = await this.onTransferRequest({
                  fileName: request.fileName,
                  fileSize: request.fileSize,
                  fileType: request.fileType,
                  senderName: request.senderName,
                  senderAddress: socket.remoteAddress
                })

                if (userResponse.approved && userResponse.savePath) {
                  // User approved and chose save location
                  transferApproved = true
                  savePath = userResponse.savePath
                  
                  console.log(`Transfer approved. Will save to: ${savePath}`)
                  socket.write('ACCEPT')
                  
                  // Create write stream for the chosen location
                  fileStream = fs.createWriteStream(savePath)
                  
                } else {
                  // User rejected
                  console.log('Transfer rejected by user')
                  socket.write('REJECT')
                  socket.end()
                  
                  // Notify about rejection
                  this.onTransferRejected({
                    fileName: request.fileName,
                    senderName: request.senderName,
                    reason: 'User declined'
                  })
                }
              }
            } catch (err) {
              console.error('Error parsing transfer request:', err)
              socket.write('REJECT')
              socket.end()
            }
          }
        } else {
          // We're in file transfer phase - write file data
          if (fileStream) {
            fileStream.write(chunk)
          }
        }
      })

      //Handle end of connection
      socket.on('end', () => {
        if (fileStream && transferApproved) {
          fileStream.end()
          console.log(`File received and saved successfully to: ${savePath}`)
          
          // Trigger notification callback
          this.onFileReceived({
            fileName: path.basename(savePath),
            fileSize: fs.statSync(savePath).size,
            senderAddress: socket.remoteAddress,
            savePath: savePath
          })
        }
      })

      //Handle errors during transfer
      socket.on('error', err => {
        console.error(`Error during transfer: ${err.message}`)
        if (fileStream) {
          fileStream.end()
        }
      })
    })

    //Start server listening
    server.listen(this.port, this.host, () => {
      console.log(`File transfer server listening on ${this.host}:${this.port}`)
    })

    //Handle server errors
    server.on('error', err => {
      console.error(`Server error: ${err.message}`)
      server.close()
    })

    return server
  }
}

module.exports = FileTransferService
