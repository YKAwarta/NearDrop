import React, { useState, useEffect } from 'react'

function DeviceList({ file, onSend }) {
  const [devices, setDevices] = useState([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [initialLoad, setInitialLoad] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)

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
    
    // Only set up auto-refresh interval if autoRefresh is enabled
    let interval
    if (autoRefresh) {
      interval = setInterval(fetchDevices, 10000)
    }
    
    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [autoRefresh])

  const getPlatformIcon = (platform) => {
    switch (platform) {
      case 'darwin': return '🍎'
      case 'win32': return '🪟'
      case 'linux': return '🐧'
      default: return '💻'
    }
  }

  const handleSend = (device) => {
    onSend(device)
  }

  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh)
  }

  if (initialLoad) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '20px',
        padding: '3rem',
        textAlign: 'center',
        margin: '2rem 0',
        backdropFilter: 'blur(15px)',
        boxShadow: '0 15px 35px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        animation: 'slideInFromBottom 0.6s ease-out'
      }}>
        {/* Animated loading rings */}
        <div style={{
          position: 'relative',
          display: 'inline-block',
          marginBottom: '1.5rem'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '3px solid rgba(59, 130, 246, 0.2)',
            borderTop: '3px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            willChange: 'transform'
          }} />
          <div style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            width: '40px',
            height: '40px',
            border: '2px solid rgba(139, 92, 246, 0.2)',
            borderTop: '2px solid #8b5cf6',
            borderRadius: '50%',
            animation: 'spin 1.5s linear infinite reverse',
            willChange: 'transform'
          }} />
        </div>
        
        <h3 style={{
          color: '#ffffff',
          fontSize: '1.3rem',
          fontWeight: '600',
          marginBottom: '0.5rem',
          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          🔍 Discovering devices...
        </h3>
        <p style={{
          color: 'rgba(255, 255, 255, 0.6)',
          fontSize: '0.9rem',
          margin: 0,
          animation: 'pulse 2s ease-in-out infinite'
        }}>
          Scanning network for nearby devices
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.05))',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        borderRadius: '20px',
        padding: '3rem',
        textAlign: 'center',
        margin: '2rem 0',
        backdropFilter: 'blur(15px)',
        animation: 'shake 0.5s ease-in-out'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
        <h3 style={{ color: '#ef4444', marginBottom: '0.5rem' }}>Error</h3>
        <p style={{ color: 'rgba(255, 255, 255, 0.7)', margin: '0 0 1.5rem 0' }}>{error}</p>
        <button
          onClick={fetchDevices}
          style={{
            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            padding: '0.8rem 1.5rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            fontWeight: '600'
          }}
        >
          🔄 Try Again
        </button>
      </div>
    )
  }

  return (
    <div style={{
      margin: '2rem 0',
      animation: 'fadeIn 0.6s ease-out'
    }}>
      {/* Header with refresh button and auto-refresh toggle */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem',
        animation: 'slideInFromLeft 0.6s ease-out'
      }}>
        <h2 style={{
          color: '#ffffff',
          fontSize: '1.8rem',
          fontWeight: '700',
          margin: 0,
          background: 'linear-gradient(135deg, #ffffff, #e2e8f0)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          animation: 'titleShimmer 4s ease-in-out infinite'
        }}>
          🌐 Nearby Devices {devices.length > 0 && `(${devices.length})`}
        </h2>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          {/* Auto-refresh toggle */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '0.5rem 0.8rem',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(8px)'
          }}>
            <span style={{
              fontSize: '0.85rem',
              color: 'rgba(255, 255, 255, 0.7)',
              fontWeight: '500'
            }}>
              Auto-refresh
            </span>
            <button
              onClick={toggleAutoRefresh}
              style={{
                position: 'relative',
                width: '42px',
                height: '22px',
                borderRadius: '11px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                background: autoRefresh 
                  ? 'linear-gradient(135deg, #10b981, #06b6d4)' 
                  : 'rgba(255, 255, 255, 0.2)',
                boxShadow: autoRefresh 
                  ? '0 4px 12px rgba(16, 185, 129, 0.3)' 
                  : '0 2px 8px rgba(0, 0, 0, 0.2)'
              }}
            >
              <div style={{
                position: 'absolute',
                top: '2px',
                left: autoRefresh ? '22px' : '2px',
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: 'white',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
              }} />
            </button>
            {autoRefresh && (
              <span style={{
                fontSize: '0.7rem',
                color: '#10b981',
                fontWeight: '600',
                animation: 'pulse 2s ease-in-out infinite'
              }}>
                ON
              </span>
            )}
          </div>
          
          {/* Manual refresh button */}
          <button
            onClick={fetchDevices}
            disabled={isRefreshing}
            style={{
              background: isRefreshing ? 
                'linear-gradient(135deg, rgba(59, 130, 246, 0.5), rgba(139, 92, 246, 0.5))' :
                'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.2))',
              border: `1px solid ${isRefreshing ? 'rgba(59, 130, 246, 0.8)' : 'rgba(59, 130, 246, 0.4)'}`,
              borderRadius: '12px',
              color: '#ffffff',
              padding: '0.7rem 1.2rem',
              cursor: isRefreshing ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease-out',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backdropFilter: 'blur(8px)',
              fontSize: '0.9rem',
              willChange: 'transform, background'
            }}
            onMouseOver={(e) => {
              if (!isRefreshing) {
                e.target.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.4), rgba(139, 92, 246, 0.4))'
                e.target.style.transform = 'translate3d(0, -2px, 0) scale(1.03)'
              }
            }}
            onMouseOut={(e) => {
              if (!isRefreshing) {
                e.target.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.2))'
                e.target.style.transform = 'translate3d(0, 0, 0) scale(1)'
              }
            }}
          >
            <span style={{
              animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
              fontSize: '1rem',
              willChange: 'transform'
            }}>
              🔄
            </span>
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {devices.length === 0 ? (
        <div style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))',
          border: '2px dashed rgba(59, 130, 246, 0.3)',
          borderRadius: '20px',
          padding: '4rem 2rem',
          textAlign: 'center',
          animation: 'pulse 4s ease-in-out infinite'
        }}>
          <div style={{
            fontSize: '4rem',
            marginBottom: '1.5rem',
            animation: 'float0 6s ease-in-out infinite'
          }}>🔍</div>
          <h3 style={{
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: '1.3rem',
            fontWeight: '600',
            marginBottom: '0.8rem'
          }}>
            No devices found
          </h3>
          <p style={{
            color: 'rgba(255, 255, 255, 0.5)',
            fontSize: '1rem',
            lineHeight: '1.6',
            margin: 0
          }}>
            Make sure other devices are running NearDrop<br />
            and connected to the same network
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1.5rem'
        }}>
          {devices.map((device, index) => (
            <div
              key={device.id}
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03))',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '20px',
                padding: '2rem',
                transition: 'all 0.2s ease-out',
                backdropFilter: 'blur(15px)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                position: 'relative',
                overflow: 'hidden',
                cursor: 'pointer',
                animation: `slideInFromBottom 0.6s ease-out ${index * 0.1}s both`,
                willChange: 'transform, background'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translate3d(0, -6px, 0) scale(1.01)'
                e.currentTarget.style.boxShadow = '0 15px 50px rgba(59, 130, 246, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.06), rgba(139, 92, 246, 0.03))'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translate3d(0, 0, 0) scale(1)'
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03))'
              }}
            >
              {/* Simplified status indicator */}
              <div style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                width: '12px',
                height: '12px',
                background: 'linear-gradient(45deg, #10b981, #06b6d4)',
                borderRadius: '50%',
                animation: 'pulse 3s ease-in-out infinite',
                boxShadow: '0 0 8px rgba(16, 185, 129, 0.4)',
                willChange: 'transform'
              }} />

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{
                  fontSize: '2.5rem',
                  animation: 'iconBounce 4s ease-in-out infinite',
                  filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))'
                }}>
                  {getPlatformIcon(device.txt?.platform)}
                </div>
                
                <div style={{ flex: 1 }}>
                  <h3 style={{
                    color: '#ffffff',
                    fontSize: '1.2rem',
                    fontWeight: '700',
                    margin: '0 0 0.3rem 0',
                    background: 'linear-gradient(135deg, #ffffff, #e2e8f0)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>
                    {device.name.replace('-local', '').replace(/Waleeds-MacBook-Pro-\d+-?/, 'MacBook Pro')}
                  </h3>
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.8rem',
                    fontSize: '0.85rem',
                    color: 'rgba(255, 255, 255, 0.6)'
                  }}>
                    <span style={{
                      background: 'rgba(59, 130, 246, 0.2)',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      fontWeight: '500'
                    }}>
                      {device.txt?.platform || 'Unknown'}
                    </span>
                    <span>•</span>
                    <span>{device.address}:{device.port}</span>
                  </div>
                </div>
              </div>

              {file && (
                <button
                  onClick={() => handleSend(device)}
                  style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '1rem',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-out',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.8rem',
                    boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)',
                    position: 'relative',
                    overflow: 'hidden',
                    willChange: 'transform, background'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.background = 'linear-gradient(135deg, #059669, #0891b2)'
                    e.target.style.transform = 'translate3d(0, -2px, 0)'
                    e.target.style.boxShadow = '0 6px 25px rgba(16, 185, 129, 0.35)'
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = 'linear-gradient(135deg, #10b981, #06b6d4)'
                    e.target.style.transform = 'translate3d(0, 0, 0)'
                    e.target.style.boxShadow = '0 4px 20px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  {/* Simplified button shine effect */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: '-100%',
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent)',
                    animation: 'buttonShine 4s ease-in-out infinite',
                    pointerEvents: 'none'
                  }} />
                  
                  <span style={{ 
                    fontSize: '1.1rem',
                    animation: 'iconBounce 3s ease-in-out infinite'
                  }}>🚀</span>
                  Send to this device
                </button>
              )}

              {!file && (
                <div style={{
                  textAlign: 'center',
                  padding: '1rem',
                  color: 'rgba(255, 255, 255, 0.4)',
                  fontSize: '0.9rem',
                  fontStyle: 'italic',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '12px',
                  border: '1px dashed rgba(255, 255, 255, 0.1)'
                }}>
                  Select a file to send
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        
        @keyframes buttonShine {
          0% { left: -100%; }
          50%, 100% { left: 100%; }
        }
        
        @keyframes iconBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
        
        @keyframes titleShimmer {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
    </div>
  )
}

export default DeviceList
