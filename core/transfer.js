const net = require('net');
const fs = require('fs');
const path = require('path');
const os = require('os');

class FileTransferService {
    constructor(options = {}) {
        this.host = options.host || '0.0.0.0'
        this.port = Number(options.port) || 5001;
        this.downloadPath = this.getDownloadPath(options.downloadPath)
    }

    getDownloadPath(customPath) {
        if(typeof customPath === 'string' && customPath.trim() !== ''){
            try{
                fs.mkdirSync(customPath, { recursive: true });
                return customPath;
            } catch (err) {
                console.warn(`Error creating custom download path: ${err.message}`);
            }
        }

        const downloadPaths = [
            path.join(os.homedir(), 'Downloads'),
            path.join(os.homedir(), 'download'),
            path.join(os.tmpdir(), 'neardrop-downloads'),
        ]

        for (const downloadPath of downloadPaths){
            try{
                fs.mkdirSync(downloadPath, { recursive: true });
                return downloadPath;
            } catch (err) {
                console.warn(`Error creating download path ${downloadPath}: ${err.message}`);
            }
        }

        throw new Error('Unable to create a valid download path.')
    }
    
    normalizePath(filePath){
        if(!path.isAbsolute(filePath)){
            throw new Error(`Invalid file path: ${filePath} is not an absolute path.`);
        }
    return path.normalize(filePath);
}


    sendFile(device, filePath){
        return new Promise((resolve, reject) => {
            try {
                
            const normalizedPath = this.normalizePath(filePath)

            console.log(`Attempting to send file: ${normalizedPath} to device: ${device.name} at ${device.address}:${device.port}`)

            if (!device || !device.address) {
                return reject(new Error('Invalid device information provided'));
            }

            if (!fs.existsSync(normalizedPath)) {
                return reject(new Error(`File does not exist: ${normalizedPath}`));
            }

            const client = new net.Socket();
            client.setTimeout(60000); // Set a 1 minute timeout for the connection

            client.connect(device.port, device.address, () => {
                console.log(`Connected to device: ${device.name} at ${device.address}:${device.port}`)
                
                const fileName = path.basename(normalizedPath)
                const fileStats = fs.statSync(normalizedPath);
                
                const metadata = JSON.stringify({
                    fileName,
                    fileSize: fileStats.size,
                    fileType: path.extname(filePath),
                })

                client.write(Buffer.from(metadata + '\n'))

                const fileStream = fs.createReadStream(normalizedPath);
                fileStream.pipe(client)

                fileStream.on('end', () => {
                    console.log(`File ${fileName} sent successfully to ${device.name}`)
                    client.end()
                    resolve()
                })
                fileStream.on('error', (err) => {
                    console.error(`Error reading file ${fileName}:`, err);
                    client.destroy();
                    reject(err);
                })
            })

            client.on('error', (err) => {
                console.error(`Error connecting to device ${device.name}:`, err);
                reject(err);
            })

            client.on('timeout', () => {
                console.error(`Connection to ${device.name} timed out`);
                client.destroy();
                reject(new Error('Connection timed out'));
            })
        } catch (err) {
            console.error(`Error sending file: ${err.message}`);
            reject(err);
        }
    })
}

    startReceiver() {
        const server = net.createServer((socket) => {
            console.log(`New connection from ${socket.remoteAddress}:${socket.remotePort}`)
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
                            console.log(`Saving to: ${fullPath}`)

                            fs.mkdirSync(path.dirname(fullPath), { recursive: true });

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
