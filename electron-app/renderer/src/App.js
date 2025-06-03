import React, {useState} from 'react';

function App(){
  const [file, setFile] = useState(null);
  const [devices] = useState([
    {name: "Yousef's PC", id:"1"},
    {name: "Test Device", id:"2"},
  ]);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  return(
    <div style={{padding: '2rem', fontFamily: 'Arial'}}>
      <h1>NearDrop</h1>

      <label>
        <strong>Select a file to send:</strong><br />
        <input type="file" onChange={handleFileChange} />
      </label>

      {file && <p>File Selected: {file.name}</p>}

      <h2>Nearby Devices</h2>
      <ul>
        {devices.map(device => (
          <li key={device.id}>
            {device.name}
            <button style={{marginLeft:'1rem'}} dsiabled={!file}>Send</button>
          </li>
        ))}
      </ul>
    </div>
  );

}

export default App;