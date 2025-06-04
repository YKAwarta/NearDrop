import net from 'net'
import fs from 'fs'
import path from 'path'
import os from 'os'

const PORT = 17010 //Port isn't a huge deal for now, we're just using this to test.
const SAVE_DIR = path.join(os.homedir(), 'Downloads') //Create the default save directory, that being Downloads

const server = net.createServer((socket) => {
  console.log('🔄 Incoming connection...') //If a sender connects to a receiver, we log that.

  const filePath = path.join(SAVE_DIR, `received_${Date.now()}`) //Create a unique file name. This can be tweaked in the future, but I just left it as using a Date timestamp for now.
  const writeStream = fs.createWriteStream(filePath) //We open a write stream to the new file path. All incoming data will stream into this file.

  socket.pipe(writeStream) //Pipe the incoming socket stream from the sender into the file we're saving.

  socket.on('end', () => {
    //When the sender enters the end state (aka finishes sending), this fires, and we log the save location.
    console.log(`✅ File saved to ${filePath}`)
  })

  socket.on('error', (err) => {
    //Handle any unexpected errors/socket issues
    console.log('❌ Socket error: ', err)
  })
})

server.listen(PORT, () => {
  //Start the server and wait for incoming connections
  console.log(`📡 Receiver listening on port ${PORT}...`)
})
