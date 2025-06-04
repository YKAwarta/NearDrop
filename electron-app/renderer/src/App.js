import React, { useState } from 'react'
import FilePicker from './components/FilePicker' //Pull in our subcomponents pt.1
import DeviceList from './components/DeviceList' //Pull in our subcomponents pt.2

function App() {
  const [file, setFile] = useState(null) //Creates a React state to hold the actual File Object in "file" and update it with "setFile" whenever something changes.
  const [devices] = useState([  //Manually hardcoded dummy devices for now. In the future, we'll replace this with actual devices discovered by mDNS.
    { name: "Yousef's PC", id: '1' , ip: '127.0.0.1'},
    { name: 'Test Device', id: '2' , ip: '127.0.0.1'}
  ])

  const handleFileSelect = (selectedFile) => {  //Callback passed to FilePicker. When a file is selected, FilePicker calls this and updates the file state.
    setFile(selectedFile)
  }

  const handleSend = async (device) => { //Callback passed to DeviceList. When the Send button is clicked, this is triggered. Right now, it only displays an alert, but eventually, we'll have actual file sharing logic here.
    if(!file) {
      alert('Please select a file to send first.')
      return
    }

    const filePath = 'C:\\Users\\user\\NearDrop\\example.txt' // For now, we hardcode the file path. In the future, we'll use the actual file selected by the user.
    const targetIP = device.ip // Get the IP of the selected device

    try{
      const result = await window.electron.sendFile(filePath, targetIP) //Call the sendFile function from preload.js, which will handle the actual file transfer logic.
      alert(result) //Display the result of the file transfer
    } catch (error) {
      alert(`❌ Error sending file: ${error.message}`) //Display any errors that occur during the file transfer
    }
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial' }}>
      <h1>📡 NearDrop</h1>
      <FilePicker onFileSelect={handleFileSelect} /> {/*Renders actual file picker input*/}
      {file && <p>📄 File Selected: {file.name}</p>} 
      <DeviceList devices={devices} file={file} onSend={handleSend} /> {/*Renders the list of nearby devices and their send buttons*/}
    </div>
  )
}

export default App
