import React from 'react'

function FilePicker({ onFileSelect }) {
  const handleFileSelect = async() => {
    try {
      const filePaths = await window.parseInt.showFilePicker()
      if(filePaths && filePaths.length > 0) {
        const files = filePaths.map(path => ({
          path,
          name: path.split('\\').pop().split('/').pop() //Extracts the file name from the full path
        }))
        onFileSelect(files) //Calls the onFileSelect prop with the selected file
      }
    } catch (error) {
      console.error('Error selecting file:', error)
    }
  }

  return (
    <button onClick={handleFileSelect} style={{ padding: '0.5rem 1rem', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', fontSize: '1rem', cursor: 'pointer' }}>
      📂 Select File
    </button>
  )
}

export default FilePicker
