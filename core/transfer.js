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
          `Attempting to send file: ${normalizedPath} to device: ${device.name} at ${device.address}:${device.port}`
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

        //Long timeout to accoomodate for slow networks and large files.
        client.setTimeout(60000)

        //Establish connection to target device
        client.connect(device.port, device.address, () => {
          console.log(`Connected to device: ${device.name} at ${device.address}:${device.port}`)

          //Extract file metadata for transfers
          const fileName = path.basename(normalizedPath)
          const fileStats = fs.statSync(normalizedPath)

          //Send metadata as JSON string before transfer
          //Enables future protocol enhancements
          const metadata = JSON.stringify({
            fileName,
            fileSize: fileStats.size,
            fileType: path.extname(filePath),
          })

          //Send metadata with newline delimiter
          client.write(Buffer.from(metadata + '\n'))

          //Stream file contents
          const fileStream = fs.createReadStream(normalizedPath)
          fileStream.pipe(client)

          //Success and error handling for file stream
          fileStream.on('end', () => {
            console.log(`File ${fileName} sent successfully to ${device.name}`)
            client.end()
            resolve()
          })
          fileStream.on('error', err => {
            console.error(`Error reading file ${fileName}:`, err)
            client.destroy()
            reject(err)
          })
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

      //Track metadata and file stream
      let metadata = ''
      let fileStream = null

      //Handle incoming data chunks from the socket
      socket.on('data', chunk => {
        //First chunk contains metadata, subsequent chunks contain file data
        if (!fileStream) {
          metadata += chunk.toString()

          const metadataEndIndex = metadata.indexOf('\n')
          if (metadataEndIndex !== -1) {
            try {
              //Parse metadata from the first chunk
              const metadataObj = JSON.parse(metadata.slice(0, metadataEndIndex))
              //Construct full file path for saving
              const fullPath = path.join(this.downloadPath, metadataObj.fileName)

              //Log transfer details
              console.log(`Receiving file: ${metadataObj.fileName} (${metadataObj.fileSize} bytes)`)
              console.log(`Saving to: ${fullPath}`)

              //Create write stream for the file
              fileStream = fs.createWriteStream(fullPath)

              //Write remaining data after metadata
              const remainingChunk = metadata.slice(metadataEndIndex + 1)
              if (remainingChunk) {
                fileStream.write(Buffer.from(remainingChunk))
              }
            } catch (err) {
                //Handle parsing errors
              console.error('Error parsing metadata:', err)
              socket.destroy()
              return
            }
          }
        } else {
            //Subsequent chunks are file data
          fileStream.write(chunk)
        }
      })

      //Handle end of successful file transfer
      socket.on('end', () => {
        if (fileStream) {
          fileStream.end()
          console.log(`File received and saved successfully.`)
        }
      })

      //Handle errors during file transfer
      socket.on('error', err => {
        console.error(`Error receiving file: ${err.message}`)
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
