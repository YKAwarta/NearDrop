import React, { useState, useEffect } from 'react'
import FilePicker from './components/FilePicker' //Pull in our subcomponents pt.1
import DeviceList from './components/DeviceList' //Pull in our subcomponents pt.2

function App() {
  const [file, setFile] = useState(null) //Creates a React state to hold the actual File Object in "file" and update it with "setFile" whenever something changes.
  const [sendStatus, setSendStatus] = useState(null) //Creates a React state to hold the status of the send operatio
  const [notification, setNotification] = useState(null) // State for file received notifications
  const [sendResultPopup, setSendResultPopup] = useState(null) // State for send result popup

  // Set up listener for file received notifications
  useEffect(() => {
    window.api.onFileReceived((fileInfo) => {
      console.log('File received notification:', fileInfo)
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

    // Cleanup listeners on component unmount
    return () => {
      window.api.removeFileReceivedListener()
      window.api.removeTransferRejectedListener()
    }
  }, [])

  const handleFileSelect = selectedFiles => {
    //Callback passed to FilePicker. When a file is selected, FilePicker calls this and updates the file state.
    const selectedFile = selectedFiles[0] //Assuming single file selection, we take the first
    console.log('Selected file:', selectedFile) //Log the selected file for debugging
    setFile(selectedFile)
    setSendStatus(null) //Reset send status when a new file is selected
    setSendResultPopup(null) //Reset send result popup
  }

  const handleSend = async device => {
    if (!file) {
      console.error('No file selected for sending')
      return
    }

    console.log('Sending file:', file, 'to device:', device) //Log the file and device for debugging
    setSendStatus('sending')
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
      
      // Auto-hide popup after 4 seconds
      setTimeout(() => {
        setSendResultPopup(null)
      }, 4000)
      
    } catch (error) {
      console.error('Error sending file:', error)
      setSendStatus(null)
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
          {sendStatus === 'sending' && <p>🔄 Sending file...</p>}
        </div>
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
      `}</style>
    </div>
  )
}

export default App
