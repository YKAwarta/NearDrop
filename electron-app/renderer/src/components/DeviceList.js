import React, { useState, useEffect } from 'react'

function DeviceList({ file, onSend }) {
  const [devices, setDevices] = useState([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [initialLoad, setInitialLoad] = useState(true)

  const fetchDevices = async () => {
    // Don't show full loading state if we already have devices
    if (devices.length === 0) {
      setInitialLoad(true)
    } else {
      setIsRefreshing(true)
    }
    
    setError(null)
    try {
      const discoveredDevices = await window.api.discoverDevices()
      console.log('DeviceList received devices:', discoveredDevices)
      setDevices(discoveredDevices)
    } catch (err) {
      console.error('Error fetching devices:', err)
      setError('Failed to discover devices')
    } finally {
      setInitialLoad(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchDevices()
    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchDevices, 10000)
    return () => clearInterval(interval)
  }, [])

  const getDeviceIcon = (platform) => {
    if (!platform) return '💻'
    
    switch (platform.toLowerCase()) {
      case 'darwin':
      case 'macos':
        return '🍎'
      case 'win32':
      case 'windows':
        return '🪟'
      case 'linux':
        return '🐧'
      default:
        return '💻'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return '#22c55e'
      case 'offline': return '#6b7280'
      default: return '#22c55e'
    }
  }

  // Only show initial loading state when we have no devices and it's the first load
  if (initialLoad && devices.length === 0) {
    return (
      <div style={{
        backgroundColor: '#1a1a1a',
        border: '1px solid #374151',
        borderRadius: '12px',
        padding: '2rem',
        margin: '1rem 0',
        textAlign: 'center',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ 
          fontSize: '1.2rem',
          color: '#60a5fa',
          marginBottom: '1rem'
        }}>🔄 Discovering devices...</div>
        <div style={{
          width: '32px',
          height: '32px',
          border: '3px solid #374151',
          borderTop: '3px solid #60a5fa',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto'
        }}></div>
      </div>
    )
  }

  if (error && devices.length === 0) {
    return (
      <div style={{
        backgroundColor: '#1a1a1a',
        border: '1px solid #ef4444',
        borderRadius: '12px',
        padding: '2rem',
        margin: '1rem 0',
        textAlign: 'center',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ 
          color: '#ef4444',
          fontSize: '1.1rem',
          marginBottom: '1rem'
        }}>❌ {error}</div>
        <button
          onClick={fetchDevices}
          style={{
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '0.75rem 1.5rem',
            fontSize: '0.9rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
          }}
          onMouseOver={(e) => {
            e.target.style.backgroundColor = '#2563eb'
            e.target.style.transform = 'translateY(-1px)'
          }}
          onMouseOut={(e) => {
            e.target.style.backgroundColor = '#3b82f6'
            e.target.style.transform = 'translateY(0)'
          }}
        >
          🔄 Retry
        </button>
      </div>
    )
  }

  if (!initialLoad && devices.length === 0) {
    return (
      <div style={{
        backgroundColor: '#1a1a1a',
        border: '1px solid #374151',
        borderRadius: '12px',
        padding: '2rem',
        margin: '1rem 0',
        textAlign: 'center',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ 
          fontSize: '1.2rem',
          color: '#9ca3af',
          marginBottom: '1rem'
        }}>📡 No devices found</div>
        <p style={{ 
          color: '#6b7280',
          fontSize: '0.9rem',
          margin: '0 0 1.5rem 0'
        }}>Make sure other NearDrop devices are running on your network</p>
        <button
          onClick={fetchDevices}
          style={{
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '0.75rem 1.5rem',
            fontSize: '0.9rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
          }}
          onMouseOver={(e) => {
            e.target.style.backgroundColor = '#2563eb'
            e.target.style.transform = 'translateY(-1px)'
          }}
          onMouseOut={(e) => {
            e.target.style.backgroundColor = '#3b82f6'
            e.target.style.transform = 'translateY(0)'
          }}
        >
          🔄 Refresh
        </button>
      </div>
    )
  }

  return (
    <div style={{ margin: '1rem 0' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem'
      }}>
        <h2 style={{
          margin: '0',
          fontSize: '1.5rem',
          fontWeight: '700',
          color: '#ffffff'
        }}>Available Devices ({devices.length})</h2>
        <button
          onClick={fetchDevices}
          disabled={isRefreshing}
          style={{
            backgroundColor: 'transparent',
            color: isRefreshing ? '#6b7280' : '#60a5fa',
            border: '1px solid #374151',
            borderRadius: '8px',
            padding: '0.5rem 1rem',
            fontSize: '0.85rem',
            fontWeight: '500',
            cursor: isRefreshing ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
          onMouseOver={(e) => {
            if (!isRefreshing) {
              e.target.style.backgroundColor = '#374151'
              e.target.style.borderColor = '#60a5fa'
            }
          }}
          onMouseOut={(e) => {
            if (!isRefreshing) {
              e.target.style.backgroundColor = 'transparent'
              e.target.style.borderColor = '#374151'
            }
          }}
        >
          <span style={{
            animation: isRefreshing ? 'spin 1s linear infinite' : 'none'
          }}>🔄</span>
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div style={{
        display: 'grid',
        gap: '1rem',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))'
      }}>
        {devices.map((device) => (
          <div
            key={device.id}
            style={{
              backgroundColor: '#1a1a1a',
              border: '1px solid #374151',
              borderRadius: '12px',
              padding: '1.5rem',
              transition: 'all 0.3s ease',
              cursor: file ? 'pointer' : 'default',
              opacity: file ? 1 : 0.7,
              backdropFilter: 'blur(10px)',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseOver={(e) => {
              if (file) {
                e.target.style.borderColor = '#60a5fa'
                e.target.style.backgroundColor = '#262626'
                e.target.style.transform = 'translateY(-2px)'
                e.target.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.3)'
              }
            }}
            onMouseOut={(e) => {
              if (file) {
                e.target.style.borderColor = '#374151'
                e.target.style.backgroundColor = '#1a1a1a'
                e.target.style.transform = 'translateY(0)'
                e.target.style.boxShadow = 'none'
              }
            }}
            onClick={() => {
              if (file) {
                onSend(device)
              }
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <span style={{ 
                  fontSize: '1.5rem'
                }}>{getDeviceIcon(device.txt?.platform)}</span>
                <div>
                  <div style={{
                    fontWeight: '600',
                    fontSize: '1rem',
                    color: '#ffffff',
                    marginBottom: '0.25rem'
                  }}>
                    {device.name}
                  </div>
                  <div style={{
                    fontSize: '0.8rem',
                    color: '#9ca3af',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <span style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: getStatusColor('online')
                    }}></span>
                    {device.address}
                  </div>
                </div>
              </div>
            </div>

            <div style={{
              fontSize: '0.8rem',
              color: '#6b7280',
              marginBottom: file ? '1rem' : '0'
            }}>
              Platform: {device.txt?.platform || 'Unknown'} • Port: {device.port}
            </div>

            {file && (
              <button
                style={{
                  width: '100%',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.75rem',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = '#2563eb'
                  e.target.style.transform = 'translateY(-1px)'
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = '#3b82f6'
                  e.target.style.transform = 'translateY(0)'
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  onSend(device)
                }}
              >
                📤 Send "{file.name}"
              </button>
            )}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default DeviceList
