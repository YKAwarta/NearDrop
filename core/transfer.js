const net = require('net');
const fs = require('fs');
const path = require('path');

class FileTransferService {
    constructor(options = {}) {
        this.host = options.host || '0.0.0.0'
        this.port = options.port || 50001;
        this.downloadPath = options.downloadPath || path.join(process.env.HOME || process.env.USERPROFILE, 'Downloads');
    }

    sendFile(device, filePath){
        return new Promise((resolve, reject) => {
            const client = new net.Socket();

            client.connect(device.port, device.address, () => {
                const fileName = path.basename(filePath)
                const fileStats = fs.statSync(filePath);
                
                const metadata = JSON.stringify({
                    fileName,
                    fileSize: fileStats.size,
                    fileType: path.extname(filePath),
                })

                client.write(Buffer.from(metadata + '\n'))

                const fileStream = fs.createReadStream(filePath);
                fileStream.pipe(client)

                fileStream.on('end', () => {
                    client.end()
                    resolve(`File ${fileName} sent successfully to ${device.name}`)
                })
            })

            client.on('error', (err) => {
                reject(`Error sending file: ${err.message}`);
            })
        })
    }

    startReceiver() {
        const server = net.createServer((socket) => {
            let metadata = ''
            let fileStream = null

            socket.on('data', (chunk) => {
                if(!fileStream){
                    metadata += chunk.toString();

                    const metadataEndIndex = metadata.indexOf('\n');
                    if(metadataEndIndex !== -1){
                        const metadataObj = JSON.parse(metadata.slice(0, metadataEndIndex))
                        const fullPath = path.join(this.downloadPath, metadataObj.fileName)

                        fileStream = fs.createWriteStream(fullPath)

                        const remainingChunk = metadata.slice(metadataEndIndex + 1);
                        if (remainingChunk) {
                            fileStream.write(Buffer.from(remainingChunk))
                        }
                    }
                } else{
                    fileStream.write(chunk)
                }
            })

            socket.on('end', () => {
                if (fileStream) {
                    fileStream.end()
                    console.log(`File received and saved successfully.`)
                }
            })
        })

        server.listen(this.port, this.host, () => {
            console.log(`File transfer server listening on ${this.host}:${this.port}`)
        })

        return server
    }
}

module.exports = FileTransferService
