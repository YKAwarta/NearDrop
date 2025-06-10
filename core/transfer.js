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
    this.onSendProgress = options.onSendProgress || (() => {}) // Callback for sending progress updates
    this.onReceiveProgress = options.onReceiveProgress || (() => {}) // Callback for receiving progress updates
    
    // Track active connections for cancellation
    this.activeSendSocket = null
    this.activeReceiveSocket = null
    this.isSendCanceled = false
    this.isReceiveCanceled = false
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
      const normalizedPath = path.resolve(filePath)
      console.log(
        `Requesting to send file: ${normalizedPath} to device: ${device.name} at ${device.address}:${device.port}`
      )
      
      // Reset cancellation flag
      this.isSendCanceled = false

      //Create TCP client connection to target device
      const client = new net.Socket()
      this.activeSendSocket = client // Track active socket
      
      client.connect(device.port, device.address, () => {
        console.log(`Connected to device: ${device.name} at ${device.address}:${device.port}`)
        
        // Check if canceled during connection
        if (this.isSendCanceled) {
          client.destroy()
          this.activeSendSocket = null
          reject(new Error('Transfer canceled'))
          return
        }

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
          
          //Now send the actual file with progress tracking
          const fileStats = fs.statSync(normalizedPath)
          const totalSize = fileStats.size
          let sentBytes = 0
          let lastProgressUpdate = 0
          const startTime = Date.now()
          
          const fileStream = fs.createReadStream(normalizedPath)
          
          // Track progress as data is sent (throttled to every 25ms)
          fileStream.on('data', (chunk) => {
            sentBytes += chunk.length
            const now = Date.now()
            
            // Check if canceled during transfer
            if (this.isSendCanceled) {
              fileStream.destroy()
              client.destroy()
              this.activeSendSocket = null
              reject(new Error('Transfer canceled'))
              return
            }
            
            // Only update progress every 25ms to make it visible
            if (now - lastProgressUpdate >= 25 || sentBytes === totalSize) {
              const progress = Math.round((sentBytes / totalSize) * 100)
              const elapsed = (now - startTime) / 1000 // seconds
              const speed = elapsed > 0 ? sentBytes / elapsed : 0 // bytes per second
              
              // Emit progress update
              this.onSendProgress({
                fileName: path.basename(normalizedPath),
                deviceName: device.name,
                progress: progress,
                sentBytes: sentBytes,
                totalSize: totalSize,
                speed: speed // bytes per second
              })
              
              lastProgressUpdate = now
            }
          })
          
          fileStream.pipe(client)

          fileStream.on('end', () => {
            console.log('File sent successfully to', device.name)
            client.end()
            this.activeSendSocket = null // Clear active socket
            this.isSendCanceled = false // Reset flag
            resolve({ success: true, message: 'File sent successfully!' })
          })
          
          fileStream.on('error', (streamErr) => {
            console.error('Error reading file:', streamErr)
            client.destroy()
            this.activeSendSocket = null // Clear active socket
            this.isSendCanceled = false // Reset flag
            reject(streamErr)
          })
          
        } else if (response === 'REJECT') {
          console.log('Transfer rejected by receiver!')
          client.end()
          this.activeSendSocket = null
          this.isSendCanceled = false // Reset flag
          resolve({ success: false, message: 'Transfer rejected by recipient' })
        } else {
          console.error('Unknown response from receiver:', response)
          client.destroy()
          reject(new Error('Unknown response from receiver'))
        }
      })

      //Error handling during transfer
      client.on('error', err => {
        console.error(`Socket error: ${err.message}`)
        this.activeSendSocket = null // Clear active socket
        this.isSendCanceled = false // Reset flag
        reject(new Error(`Connection error: ${err.message}`))
      })

      //Handle connection timeout
      client.on('timeout', () => {
        console.error('Connection timed out')
        client.destroy()
        this.activeSendSocket = null // Clear active socket
        this.isSendCanceled = false // Reset flag
        reject(new Error('Connection timed out'))
      })
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
      
      // Track active receive socket
      this.activeReceiveSocket = socket
      this.isReceiveCanceled = false

      let requestData = ''
      let fileStream = null
      let transferApproved = false
      let savePath = null
      let fileMetadata = null
      let receivedBytes = 0
      let startTime = null
      let lastProgressUpdate = 0

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
                  fileMetadata = request
                  receivedBytes = 0
                  startTime = Date.now()
                  lastProgressUpdate = 0
                  
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
          // We're in file transfer phase - write file data and track progress
          if (fileStream && fileMetadata) {
            // Check if canceled during transfer
            if (this.isReceiveCanceled) {
              fileStream.destroy()
              socket.destroy()
              this.activeReceiveSocket = null
              
              // Clean up partial file
              if (savePath && fs.existsSync(savePath)) {
                fs.unlinkSync(savePath)
              }
              
              console.log('Receive transfer canceled')
              return
            }
            
            fileStream.write(chunk)
            receivedBytes += chunk.length
            const now = Date.now()
            
            // Only update progress every 25ms to make it visible  
            if (now - lastProgressUpdate >= 25 || receivedBytes === fileMetadata.fileSize) {
              const progress = Math.round((receivedBytes / fileMetadata.fileSize) * 100)
              const elapsed = (now - startTime) / 1000 // seconds
              const speed = elapsed > 0 ? receivedBytes / elapsed : 0 // bytes per second
              
              // Emit progress update
              this.onReceiveProgress({
                fileName: fileMetadata.fileName,
                senderName: fileMetadata.senderName,
                progress: progress,
                receivedBytes: receivedBytes,
                totalSize: fileMetadata.fileSize,
                speed: speed // bytes per second
              })
              
              lastProgressUpdate = now // Update for next throttle check
            }
          }
        }
      })

      //Handle end of connection
      socket.on('end', () => {
        console.log('Connection closed')
        if (fileStream) {
          fileStream.end()
          
          // Clear active socket
          this.activeReceiveSocket = null
          this.isReceiveCanceled = false // Reset flag
          
          // Only notify on successful complete transfer
          if (fileMetadata && savePath && receivedBytes === fileMetadata.fileSize) {
            // Trigger notification callback
            this.onFileReceived({
              fileName: path.basename(savePath),
              fileSize: fs.statSync(savePath).size,
              senderAddress: socket.remoteAddress,
              savePath: savePath
            })
          }
        }
      })

      //Handle errors during transfer
      socket.on('error', (err) => {
        console.error('Socket error during receive:', err)
        this.activeReceiveSocket = null
        this.isReceiveCanceled = false // Reset flag
        if (fileStream) {
          fileStream.destroy()
        }
        // Clean up partial file on error
        if (savePath && fs.existsSync(savePath)) {
          fs.unlinkSync(savePath)
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

  /**
   * Cancel active send operation
   */
  cancelSend() {
    console.log('Canceling send operation...')
    this.isSendCanceled = true
    if (this.activeSendSocket) {
      this.activeSendSocket.destroy()
      this.activeSendSocket = null
    }
  }

  /**
   * Cancel active receive operation
   */
  cancelReceive() {
    console.log('Canceling receive operation...')
    this.isReceiveCanceled = true
    if (this.activeReceiveSocket) {
      this.activeReceiveSocket.destroy()
      this.activeReceiveSocket = null
    }
  }
}

module.exports = FileTransferService
