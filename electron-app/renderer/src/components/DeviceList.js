import React, { useState, useEffect } from 'react'

function DeviceList({ file, onSend }) {
  const [devices, setDevices] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState(null)

  const discoverDevices = async () => {
    setIsSearching(true)
    setError(null)

    try {
      const discoveredDevices = await window.api.discoverDevices()
      setDevices(discoveredDevices)
    } catch (err) {
      console.error('Error discovering devices:', err)
      setError('Failed to discover devices')
    } finally {
      setIsSearching(false)
    }
  }

  useEffect(() => {
    discoverDevices()
  }, [])

  return (
    <div>
      <div
        style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}
      >
        <h2 style={{ margin: 0 }}>🖥️ Nearby Devices</h2>
        <button
          onClick={discoverDevices}
          disabled={isSearching}
          style={{ marginLeft: '1rem', padding: '0.5rem 1rem' }}
        >
          {isSearching ? 'Searching...' : 'Refresh'}
        </button>
      </div>

      {isSearching && (
        <div style={{ display: 'flex', alignItems: 'center', padding: '1rem' }}>
          <div
            style={{
              width: '20px',
              height: '20px',
              border: '2px solid #f3f3f3',
              borderTop: '2px solid #3498db',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              marginRight: '0.5rem',
            }}
          ></div>
          <span>Searching for peers…</span>
        </div>
      )}

      {error && (
        <div style={{ color: 'red', padding: '0.5rem', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {!isSearching && devices.length === 0 && (
        <div style={{ padding: '1rem', color: '#666' }}>
          No devices found. Make sure other NearDrop devices are running on the
          same network.
        </div>
      )}

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {devices.map((device) => (
          <li
            key={device.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.75rem',
              margin: '0.5rem 0',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer',
              backgroundColor: '#f9f9f9',
            }}
            onClick={() => file && onSend(device)}
          >
            <span>
              <strong>{device.name}</strong> ({device.address})
            </span>
            <button
              disabled={!file}
              onClick={(e) => {
                e.stopPropagation()
                onSend(device)
              }}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: file ? '#007bff' : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: file ? 'pointer' : 'not-allowed',
              }}
            >
              Send
            </button>
          </li>
        ))}
      </ul>

      <style jsx>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  )
}

export default DeviceList
