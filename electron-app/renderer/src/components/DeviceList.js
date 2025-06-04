import React from 'react'

function DeviceList({ devices, file, onSend }) { //Accepts 3 props: devices, the array of nearby devices (including a name + id. Will eventually be dynamically assigned, but for now is hardcoded), file: currently selected file, onSend: function to be called when the device is selected.
  return (
    <div>
      <h2>🖥️ Nearby Devices</h2>
      <ul>
        {devices.map((device) => (
          <li key={device.id}> {/*Creates a list by looping over the list of available devices.*/}
            {device.name} {/*Displays the name of each device*/}
            <button
              style={{ marginLeft: '1rem' }}
              disabled={!file}
              onClick={() => onSend(device)}
            >
              Send
            </button> {/*Adds a Send button next to each device. Button is auto-disabled if there is no file currently selected. When clicked, it calls onSend and passes the selected device back to App.js*/}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default DeviceList
