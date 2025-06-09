const net = require('net');
const fs = require('fs');
const path = require('path');
const os = require('os');

class FileTransferService {
    constructor(options = {}) {
        this.host = options.host || '0.0.0.0'
        this.port = options.port || 5001;
        this.downloadPath = options.downloadPath || path.join(os.homedir, 'Downloads');
    }

    sendFile(device, filePath){
        return new Promise((resolve, reject) => {
            console.log(`Attempting to send file: ${filePath} to device: ${device.name} at ${device.address}:${device.port}`)

            if (!device || !device.address) {
                return reject(new Error('Invalid device information provided'));
            }

            if (!fs.existsSync(filePath)) {
                return reject(new Error(`File does not exist: ${filePath}`));
            }

            const client = new net.Socket();
            client.setTimeout(30000); // Set a timeout for the connection

            client.connect(device.port, device.address, () => {
                console.log(`Connected to device: ${device.name} at ${device.address}:${device.port}`)
                
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
                    console.log(`File ${fileName} sent successfully to ${device.name}`)
                    client.end()
                    resolve()
                })
                fileStream.on('error', (err) => {
                    console.error(`Error reading file ${fileName}:`, err);
                    client.end();
                    reject();
                })
            })

            client.on('error', (err) => {
                reject(`Error sending file: ${err.message}`);
            })
            client.on('timeout', () => {
                console.error(`Connection to ${device.name} timed out`);
                client.destroy();
                reject(new Error('Connection timed out'));
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
                        try{
                            const metadataObj = JSON.parse(metadata.slice(0, metadataEndIndex))
                            const fullPath = path.join(this.downloadPath, metadataObj.fileName)

                            console.log(`Receiving file: ${metadataObj.fileName} (${metadataObj.fileSize} bytes)`)

                            fileStream = fs.createWriteStream(fullPath)
                            
                            const remainingChunk = metadata.slice(metadataEndIndex + 1);
                            if (remainingChunk) {
                                fileStream.write(Buffer.from(remainingChunk))
                            }
                        } catch (err) {
                            console.error('Error parsing metadata:', err);
                            socket.destroy();
                            return;
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

            socket.on('error', (err) => {
                console.error(`Error receiving file: ${err.message}`);
                if (fileStream) {
                    fileStream.end();
                }
            })
        })

        server.listen(this.port, this.host, () => {
            console.log(`File transfer server listening on ${this.host}:${this.port}`)
        })

        server.on('error', (err) => {
            console.error(`Server error: ${err.message}`);
            server.close();
        })

        return server
    }
}

module.exports = FileTransferService
