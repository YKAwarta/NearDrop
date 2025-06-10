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

// Minimalistic Progress Bar Component - Dark Theme
const ProgressBar = ({ progress, fileName, deviceName, speed, type, totalSize, transferredBytes, onCancel }) => {
  const progressBlocks = Math.round(progress / 10) // 10 blocks total
  const filledBlocks = '▓'.repeat(progressBlocks)
  const emptyBlocks = '░'.repeat(10 - progressBlocks)
  const isComplete = progress >= 100
  
  return (
    <div style={{
      backgroundColor: type === 'sending' ? '#1a2332' : '#2a1a32',
      border: `1px solid ${type === 'sending' ? '#3b82f6' : '#a855f7'}`,
      borderRadius: '12px',
      padding: '1.5rem',
      margin: '1rem 0',
      fontFamily: 'SF Pro Display, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, monospace',
      animation: isComplete ? 'completePulse 0.5s ease-in-out' : 'fadeIn 0.3s ease-in',
      boxShadow: isComplete ? '0 0 20px rgba(34, 197, 94, 0.3)' : '0 4px 20px rgba(0, 0, 0, 0.3)',
      backdropFilter: 'blur(10px)',
      position: 'relative'
    }}>
      <div style={{ 
        fontWeight: '600', 
        color: isComplete ? '#22c55e' : (type === 'sending' ? '#60a5fa' : '#c084fc'),
        marginBottom: '0.8rem',
        fontSize: '0.9rem'
      }}>
        {isComplete ? '✅' : (type === 'sending' ? '📤' : '📥')} 
        {isComplete ? 'Transfer Complete!' : 
         `${type === 'sending' ? 'Sending to' : 'Receiving from'} ${deviceName}`}
      </div>
      
      <div style={{ 
        fontSize: '1.4rem', 
        fontWeight: '700',
        marginBottom: '0.8rem',
        letterSpacing: '2px',
        color: isComplete ? '#22c55e' : '#ffffff',
        fontFamily: 'SF Mono, Monaco, Consolas, monospace'
      }}>
        {filledBlocks}{emptyBlocks} {progress}%
      </div>
      
      <div style={{ 
        fontSize: '0.85rem',
        color: '#9ca3af',
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
          color: '#6b7280',
          marginTop: '0.5rem',
          textAlign: 'center',
          fontWeight: '500'
        }}>
          ⚡ {formatSpeed(speed)}
        </div>
      )}
      
      {isComplete && (
        <div style={{ 
          fontSize: '0.8rem',
          color: '#22c55e',
          marginTop: '0.5rem',
          textAlign: 'center',
          fontWeight: '600'
        }}>
          🎉 Success!
        </div>
      )}
      
      {!isComplete && (
        <button
          onClick={onCancel}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            backgroundColor: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid #ef4444',
            borderRadius: '6px',
            color: '#ef4444',
            padding: '0.4rem 0.8rem',
            fontSize: '0.75rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem'
          }}
          onMouseOver={(e) => {
            e.target.style.backgroundColor = 'rgba(239, 68, 68, 0.3)'
            e.target.style.transform = 'scale(1.05)'
          }}
          onMouseOut={(e) => {
            e.target.style.backgroundColor = 'rgba(239, 68, 68, 0.2)'
            e.target.style.transform = 'scale(1)'
          }}
        >
          ✕ Cancel
        </button>
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

  // Handle cancel sending
  const handleCancelSend = async () => {
    console.log('Canceling send transfer...')
    try {
      await window.api.cancelSend()
      setSendProgress(null)
      setSendStatus(null)
      setSendResultPopup({
        success: false,
        message: 'Transfer canceled',
        timestamp: Date.now()
      })
      setTimeout(() => {
        setSendResultPopup(null)
      }, 3000)
    } catch (error) {
      console.error('Error canceling send:', error)
    }
  }

  // Handle cancel receiving
  const handleCancelReceive = async () => {
    console.log('Canceling receive transfer...')
    try {
      await window.api.cancelReceive()
      setReceiveProgress(null)
      setNotification({
        type: 'rejected',
        message: '❌ Transfer canceled',
        details: 'You canceled the incoming file transfer',
        timestamp: Date.now()
      })
      setTimeout(() => {
        setNotification(null)
      }, 3000)
    } catch (error) {
      console.error('Error canceling receive:', error)
    }
  }

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
    <div style={{ 
      padding: '2rem', 
      fontFamily: 'SF Pro Display, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
      backgroundColor: '#0f0f0f',
      color: '#ffffff',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: '700',
          background: 'linear-gradient(135deg, #3b82f6 0%, #a855f7 100%)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '2rem',
          textAlign: 'center'
        }}>📡 NearDrop</h1>
        
        <FilePicker onFileSelect={handleFileSelect} />
        
        {file && (
          <div style={{
            backgroundColor: '#1a1a1a',
            border: '1px solid #374151',
            borderRadius: '12px',
            padding: '1.5rem',
            margin: '1rem 0',
            backdropFilter: 'blur(10px)',
            userSelect: 'none'
          }}>
            <p style={{ 
              margin: '0',
              fontSize: '1rem',
              color: '#e5e7eb',
              userSelect: 'none'
            }}>📄 <span style={{ fontWeight: '600' }}>Selected:</span> {file.name}</p>
            {sendStatus === 'sending' && !sendProgress && (
              <p style={{ 
                margin: '0.5rem 0 0 0',
                fontSize: '0.9rem',
                color: '#60a5fa',
                userSelect: 'none'
              }}>🔄 Preparing to send...</p>
            )}
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
            onCancel={handleCancelSend}
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
            onCancel={handleCancelReceive}
          />
        )}
        
        <DeviceList file={file} onSend={handleSend} />
      </div>
      
      {/* File Received/Rejected Notification */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: notification.type === 'received' ? 'rgba(34, 197, 94, 0.95)' : 'rgba(239, 68, 68, 0.95)',
          color: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(10px)',
          border: `1px solid ${notification.type === 'received' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          zIndex: 1000,
          maxWidth: '380px',
          animation: 'slideIn 0.3s ease-out'
        }}>
          <div style={{ fontWeight: '600', marginBottom: '0.5rem', fontSize: '1rem' }}>
            {notification.message}
          </div>
          <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>
            {notification.details}
          </div>
          <button 
            onClick={() => setNotification(null)}
            style={{
              position: 'absolute',
              top: '8px',
              right: '12px',
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '1.4rem',
              cursor: 'pointer',
              padding: '0',
              width: '24px',
              height: '24px',
              opacity: 0.7,
              transition: 'opacity 0.2s'
            }}
            onMouseOver={(e) => e.target.style.opacity = '1'}
            onMouseOut={(e) => e.target.style.opacity = '0.7'}
          >
            ×
          </button>
        </div>
      )}

      {/* Send Result Popup */}
      {sendResultPopup && (
        <div style={{
          position: 'fixed',
          top: '90px',
          right: '20px',
          backgroundColor: sendResultPopup.success ? 'rgba(34, 197, 94, 0.95)' : 'rgba(239, 68, 68, 0.95)',
          color: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(10px)',
          border: `1px solid ${sendResultPopup.success ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          zIndex: 1000,
          maxWidth: '320px',
          animation: 'slideIn 0.3s ease-out'
        }}>
          <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>
            {sendResultPopup.success ? '✅' : '❌'} {sendResultPopup.message}
          </div>
          <button 
            onClick={() => setSendResultPopup(null)}
            style={{
              position: 'absolute',
              top: '8px',
              right: '12px',
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '1.4rem',
              cursor: 'pointer',
              padding: '0',
              width: '24px',
              height: '24px',
              opacity: 0.7,
              transition: 'opacity 0.2s'
            }}
            onMouseOver={(e) => e.target.style.opacity = '1'}
            onMouseOut={(e) => e.target.style.opacity = '0.7'}
          >
            ×
          </button>
        </div>
      )}

      <style>{`
        * {
          -webkit-user-select: none !important;
          -moz-user-select: none !important;
          -ms-user-select: none !important;
          user-select: none !important;
        }
        
        input, textarea {
          -webkit-user-select: text !important;
          -moz-user-select: text !important;
          -ms-user-select: text !important;
          user-select: text !important;
        }
        
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
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
          }
          50% {
            transform: scale(1.02);
            box-shadow: 0 0 30px rgba(34, 197, 94, 0.6);
          }
          100% {
            transform: scale(1);
            box-shadow: 0 0 20px rgba(34, 197, 94, 0.3);
          }
        }
      `}</style>
    </div>
  )
}

export default App
