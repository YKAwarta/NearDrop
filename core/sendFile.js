const net = require('net')
const fs = require('fs')

function sendFile({ filePath, targetIP, port = 17010 }) {
  return new Promise((resolve, reject) => {
    const client = new net.Socket() //Create a new unconnected TCP client

    client.connect(port, targetIP, () => {
        console.log(`🚀 Connected to receiver at ${targetIP}:${port}!`) //Log the connection once it is open
        const readStream = fs.createReadStream(filePath) //Open a read stream from the file
      readStream.pipe(client) //Pipe the read stream into the client socket. This sends the file content as raw TCP data.

      readStream.on('end', () => { //When the read stream ends, we log success and close the client connection
        client.end()
        console.log('✅ File sent successfully!')
        resolve('✅ File sent successfully!')
      })

      //Handle read stream errors
      readStream.on('error', (err) => {
        console.error('❌ Read stream error: ', err)
        reject('❌ Read stream error: ' + err.message)
      })
    })

    //Handle connection errors
    client.on('error', (err) => {
        console.error('❌ Connection error: ', err)
      reject('❌ Connection error: ' + err.message)
    })
  })
}

module.exports = { sendFile }
