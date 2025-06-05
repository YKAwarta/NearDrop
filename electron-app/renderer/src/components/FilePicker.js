import React from 'react'

function FilePicker({ onFileSelect }) {
  //Accepts onFileSelect prop from App.js, tells the function what to do when a file is selected
  const handleChange = (e) => {
    //File is selected, browser fires onChange event, that is handled here
    const file = e.target.files[0] //Grab the first file the user selects (assuming single-file upload for now)
    if (file) onFileSelect(file) //If the file is valid, we call onFileSelect and pass the file back to App.js
  }

  return (
    <div>
      <label>
        <strong>Select a file to send:</strong>
        <br />
        <input type="file" onChange={handleChange} />{' '}
        {/*onChange is bound to handleChange, so whenever the user picks a file, the component sends that file back up to App.js*/}
      </label>
    </div>
  )
}

export default FilePicker
