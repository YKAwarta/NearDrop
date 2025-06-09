import React, { useState, useEffect } from 'react'
import FilePicker from './components/FilePicker' //Pull in our subcomponents pt.1
import DeviceList from './components/DeviceList' //Pull in our subcomponents pt.2

// Helper function to format file sizes
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Helper function to format transfer speed
const formatSpeed = (bytesPerSecond) => {
  return formatFileSize(bytesPerSecond) + '/s'
}

// Minimalistic Progress Bar Component
const ProgressBar = ({ progress, fileName, deviceName, speed, type, totalSize, transferredBytes }) => {
  const progressBlocks = Math.round(progress / 10) // 10 blocks total
  const filledBlocks = '▓'.repeat(progressBlocks)
  const emptyBlocks = '░'.repeat(10 - progressBlocks)
  const isComplete = progress >= 100
  
  return (
    <div style={{
      backgroundColor: type === 'sending' ? '#e3f2fd' : '#f3e5f5',
      border: `1px solid ${type === 'sending' ? '#2196f3' : '#9c27b0'}`,
      borderRadius: '8px',
      padding: '1rem',
      margin: '1rem 0',
      fontFamily: 'monospace',
      animation: isComplete ? 'completePulse 0.5s ease-in-out' : 'fadeIn 0.3s ease-in',
      boxShadow: isComplete ? '0 0 15px rgba(76, 175, 80, 0.4)' : '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      <div style={{ 
        fontWeight: 'bold', 
        color: isComplete ? '#388e3c' : (type === 'sending' ? '#1976d2' : '#7b1fa2'),
        marginBottom: '0.5rem' 
      }}>
        {isComplete ? '✅' : (type === 'sending' ? '📤' : '📥')} 
        {isComplete ? 'Transfer Complete!' : 
         `${type === 'sending' ? 'Sending to' : 'Receiving from'} ${deviceName}`}
      </div>
      
      <div style={{ 
        fontSize: '1.2rem', 
        fontWeight: 'bold',
        marginBottom: '0.5rem',
        letterSpacing: '1px',
        color: isComplete ? '#4caf50' : 'inherit'
      }}>
        {filledBlocks}{emptyBlocks} {progress}%
      </div>
      
      <div style={{ 
        fontSize: '0.9rem',
        color: '#666',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span>📄 {fileName}</span>
        <span>{formatFileSize(transferredBytes)} / {formatFileSize(totalSize)}</span>
      </div>
      
      {speed > 0 && !isComplete && (
        <div style={{ 
          fontSize: '0.8rem',
          color: '#888',
          marginTop: '0.25rem',
          textAlign: 'center'
        }}>
          ⚡ {formatSpeed(speed)}
        </div>
      )}
      
      {isComplete && (
        <div style={{ 
          fontSize: '0.8rem',
          color: '#4caf50',
          marginTop: '0.25rem',
          textAlign: 'center',
          fontWeight: 'bold'
        }}>
          🎉 Success!
        </div>
      )}
    </div>
  )
}

function App() {
  const [file, setFile] = useState(null) //Creates a React state to hold the actual File Object in "file" and update it with "setFile" whenever something changes.
  const [sendStatus, setSendStatus] = useState(null) //Creates a React state to hold the status of the send operatio
  const [notification, setNotification] = useState(null) // State for file received notifications
  const [sendResultPopup, setSendResultPopup] = useState(null) // State for send result popup
  const [sendProgress, setSendProgress] = useState(null) // State for sending progress
  const [receiveProgress, setReceiveProgress] = useState(null) // State for receiving progress

  // Set up listener for file received notifications
  useEffect(() => {
    window.api.onFileReceived((fileInfo) => {
      console.log('File received notification:', fileInfo)
      setReceiveProgress(null) // Clear progress when done
      setNotification({
        type: 'received',
        message: `📥 File received: ${fileInfo.fileName}`,
        details: `From: ${fileInfo.senderAddress} • Saved to: ${fileInfo.savePath}`,
        timestamp: Date.now()
      })
      
      // Auto-hide notification after 5 seconds
      setTimeout(() => {
        setNotification(null)
      }, 5000)
    })

    // Set up listener for transfer rejection notifications
    window.api.onTransferRejected((rejectionInfo) => {
      console.log('Transfer rejected notification:', rejectionInfo)
      setNotification({
        type: 'rejected',
        message: `❌ Transfer rejected: ${rejectionInfo.fileName}`,
        details: `${rejectionInfo.senderName} declined your file transfer`,
        timestamp: Date.now()
      })
      
      // Auto-hide notification after 5 seconds
      setTimeout(() => {
        setNotification(null)
      }, 5000)
    })

    // Set up listener for send progress
    window.api.onSendProgress((progressInfo) => {
      setSendProgress(progressInfo)
      
      // Clear progress when complete, but with minimum display time
      if (progressInfo.progress >= 100) {
        setTimeout(() => {
          setSendProgress(null)
        }, 3000) // Show for at least 3 seconds
      }
    })

    // Set up listener for receive progress
    window.api.onReceiveProgress((progressInfo) => {
      setReceiveProgress(progressInfo)
      
      // Clear progress when complete, but with minimum display time
      if (progressInfo.progress >= 100) {
        setTimeout(() => {
          setReceiveProgress(null)
        }, 3000) // Show for at least 3 seconds
      }
    })

    // Cleanup listeners on component unmount
    return () => {
      window.api.removeFileReceivedListener()
      window.api.removeTransferRejectedListener()
      window.api.removeSendProgressListener()
      window.api.removeReceiveProgressListener()
    }
  }, [])

  const handleFileSelect = selectedFiles => {
    //Callback passed to FilePicker. When a file is selected, FilePicker calls this and updates the file state.
    const selectedFile = selectedFiles[0] //Assuming single file selection, we take the first
    console.log('Selected file:', selectedFile) //Log the selected file for debugging
    setFile(selectedFile)
    setSendStatus(null) //Reset send status when a new file is selected
    setSendResultPopup(null) //Reset send result popup
    setSendProgress(null) //Reset send progress
  }

  const handleSend = async device => {
    if (!file) {
      console.error('No file selected for sending')
      return
    }

    console.log('Sending file:', file, 'to device:', device) //Log the file and device for debugging
    setSendStatus('sending')
    setSendProgress(null) // Reset progress
    try {
      const result = await window.api.sendFile(device, file.path)
      console.log('Send file result:', result)
      setSendStatus(null) // Clear sending status
      
      // Show result popup
      setSendResultPopup({
        success: result.success,
        message: result.message,
        timestamp: Date.now()
      })
      
      // Clear selected file after successful transfer
      if (result.success) {
        setFile(null)
      }
      
      // Auto-hide popup after 4 seconds
      setTimeout(() => {
        setSendResultPopup(null)
      }, 4000)
      
    } catch (error) {
      console.error('Error sending file:', error)
      setSendStatus(null)
      setSendProgress(null) // Clear progress on error
      setSendResultPopup({
        success: false,
        message: 'Error: ' + error.message,
        timestamp: Date.now()
      })
      
      setTimeout(() => {
        setSendResultPopup(null)
      }, 4000)
    }
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial' }}>
      <h1>📡 NearDrop</h1>
      <FilePicker onFileSelect={handleFileSelect} />
      {file && (
        <div>
          <p>📄 File Selected: {file.name}</p>
          {sendStatus === 'sending' && !sendProgress && <p>🔄 Preparing to send...</p>}
        </div>
      )}
      
      {/* Send Progress Bar */}
      {sendProgress && (
        <ProgressBar
          progress={sendProgress.progress}
          fileName={sendProgress.fileName}
          deviceName={sendProgress.deviceName}
          speed={sendProgress.speed}
          totalSize={sendProgress.totalSize}
          transferredBytes={sendProgress.sentBytes}
          type="sending"
        />
      )}
      
      {/* Receive Progress Bar */}
      {receiveProgress && (
        <ProgressBar
          progress={receiveProgress.progress}
          fileName={receiveProgress.fileName}
          deviceName={receiveProgress.senderName}
          speed={receiveProgress.speed}
          totalSize={receiveProgress.totalSize}
          transferredBytes={receiveProgress.receivedBytes}
          type="receiving"
        />
      )}
      
      <DeviceList file={file} onSend={handleSend} />
      
      {/* File Received/Rejected Notification */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: notification.type === 'received' ? '#4CAF50' : '#f44336',
          color: 'white',
          padding: '1rem',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          zIndex: 1000,
          maxWidth: '350px',
          animation: 'slideIn 0.3s ease-out'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
            {notification.message}
          </div>
          <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
            {notification.details}
          </div>
          <button 
            onClick={() => setNotification(null)}
            style={{
              position: 'absolute',
              top: '5px',
              right: '8px',
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '1.2rem',
              cursor: 'pointer',
              padding: '0',
              width: '20px',
              height: '20px'
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Send Result Popup */}
      {sendResultPopup && (
        <div style={{
          position: 'fixed',
          top: '80px',
          right: '20px',
          backgroundColor: sendResultPopup.success ? '#4CAF50' : '#f44336',
          color: 'white',
          padding: '1rem',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          zIndex: 1000,
          maxWidth: '300px',
          animation: 'slideIn 0.3s ease-out'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
            {sendResultPopup.success ? '✅' : '❌'} {sendResultPopup.message}
          </div>
          <button 
            onClick={() => setSendResultPopup(null)}
            style={{
              position: 'absolute',
              top: '5px',
              right: '8px',
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '1.2rem',
              cursor: 'pointer',
              padding: '0',
              width: '20px',
              height: '20px'
            }}
          >
            ×
          </button>
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes completePulse {
          0% {
            transform: scale(1);
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          50% {
            transform: scale(1.02);
            box-shadow: 0 0 20px rgba(76, 175, 80, 0.6);
          }
          100% {
            transform: scale(1);
            box-shadow: 0 0 15px rgba(76, 175, 80, 0.4);
          }
        }
      `}</style>
    </div>
  )
}

export default App
