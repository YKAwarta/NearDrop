import net from 'net'
import fs from 'fs'
import path from 'path'

const HOST = '127.0.0.1' //Hardcoded for now. We'll eventually replace this with the device's actual LAN IP
const PORT = 17010

const filePath = path.resolve('./example.txt') //Path of the file we want to send. Hardcoded for now, but we'll eventually hook it up to FilePicker and App.js
const client = new net.Socket() //Create a new unconnected TCP client

client.connect(PORT, HOST, () => {
  console.log('🚀 Connected to receiver!') //Log the connection once it is open

  const readStream = fs.createReadStream(filePath) //Open a read stream from the file
  readStream.pipe(client) //Pipe the read stream into the client socket. This sends the file content as raw TCP data.

  readStream.on('end', () => {
    //Log successes when the file is fully sent.
    console.log('✅ File sent successfully')
    client.end
  })

  readStream.on('error', (err) => {
    //Handle file read errors.
    console.error('❌ Read stream error: ', err)
  })

  client.on('error', (err) => {
    //Handle connection errors.
    console.error('❌ Connection error: ', err)
  })
})
