import React, { useState } from 'react'
import FilePicker from './components/FilePicker' //Pull in our subcomponents pt.1
import DeviceList from './components/DeviceList' //Pull in our subcomponents pt.2

function App() {
  const [file, setFile] = useState(null) //Creates a React state to hold the actual File Object in "file" and update it with "setFile" whenever something changes.
  const [sendStatus, setSendStatus] = useState(null) //Creates a React state to hold the status of the send operatio

  const handleFileSelect = (selectedFiles) => {
    //Callback passed to FilePicker. When a file is selected, FilePicker calls this and updates the file state.
    setFile(selectedFiles[0])
    setSendStatus(null) //Reset send status when a new file is selected
  }

  const handleSend = async (device) => {
    if(!file) return

    setSendStatus('sending')
    try{
      const success = await window.api.sendFile(device, file.path)
      setSendStatus(success ? 'success' : 'error')
    } catch (error) {
      console.error('Error sending file:', error)
      setSendStatus('error')
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
          {sendStatus === 'success' && <p>✅ File sent successfully!</p>}
          {sendStatus === 'error' && <p>❌ File send fialed.</p>}
        </div>
      )}
      <DeviceList file={file} onSend={handleSend} />
    </div>
  )
}

export default App
