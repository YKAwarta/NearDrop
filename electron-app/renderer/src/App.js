import React, { useState } from 'react'
import FilePicker from './components/FilePicker' //Pull in our subcomponents pt.1
import DeviceList from './components/DeviceList' //Pull in our subcomponents pt.2

function App() {
  const [file, setFile] = useState(null) //Creates a React state to hold the actual File Object in "file" and update it with "setFile" whenever something changes.

  const handleFileSelect = (selectedFile) => {
    //Callback passed to FilePicker. When a file is selected, FilePicker calls this and updates the file state.
    setFile(selectedFile)
  }

  const handleSend = (device) => {
    //Callback passed to DeviceList. When the Send button is clicked, this is triggered. Right now, it only displays an alert, but eventually, we'll have actual file sharing logic here.
    alert(
      `Sending ${file.name} to ${device.name} at ${device.address}:${device.port}...`,
    )
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial' }}>
      <h1>📡 NearDrop</h1>
      <FilePicker onFileSelect={handleFileSelect} />{' '}
      {/*Renders actual file picker input*/}
      {file && <p>📄 File Selected: {file.name}</p>}
      <DeviceList file={file} onSend={handleSend} />{' '}
      {/*Renders the list of nearby devices and their send buttons*/}
    </div>
  )
}

export default App
