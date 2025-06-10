import React, { useState, useEffect } from 'react'
import FilePicker from './components/FilePicker' //Pull in our subcomponents pt.1
import DeviceList from './components/DeviceList' //Pull in our subcomponents pt.2

// Helper function to format file sizes
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Helper function to format transfer speed
const formatSpeed = (bytesPerSecond) => {
  return formatFileSize(bytesPerSecond) + '/s'
}

// Floating particles background component
const FloatingParticles = () => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: 1
    }}>
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: '3px',
            height: '3px',
            backgroundColor: 'rgba(59, 130, 246, 0.08)',
            borderRadius: '50%',
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `float${i % 3} ${10 + Math.random() * 4}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 2}s`,
            willChange: 'transform'
          }}
        />
      ))}
    </div>
  )
}

// Enhanced Progress Bar Component with optimized animations
const ProgressBar = ({ progress, fileName, deviceName, speed, type, totalSize, transferredBytes, onCancel }) => {
  const progressBlocks = Math.round(progress / 10) // 10 blocks total
  const filledBlocks = '▓'.repeat(progressBlocks)
  const emptyBlocks = '░'.repeat(10 - progressBlocks)
  const isComplete = progress >= 100
  
  return (
    <div style={{
      background: `linear-gradient(135deg, ${type === 'sending' ? 'rgba(26, 35, 50, 0.95)' : 'rgba(42, 26, 50, 0.95)'}, ${type === 'sending' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(168, 85, 247, 0.1)'})`,
      border: `1px solid ${type === 'sending' ? '#3b82f6' : '#a855f7'}`,
      borderRadius: '16px',
      padding: '2rem',
      margin: '1.5rem 0',
      fontFamily: 'SF Pro Display, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, monospace',
      animation: isComplete ? 'completePulse 0.8s ease-in-out, slideInFromBottom 0.6s ease-out' : 'slideInFromBottom 0.6s ease-out, progressGlow 3s ease-in-out infinite',
      boxShadow: isComplete ? 
        '0 20px 60px rgba(34, 197, 94, 0.3), 0 0 40px rgba(34, 197, 94, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)' : 
        `0 10px 40px ${type === 'sending' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(168, 85, 247, 0.2)'}, inset 0 1px 0 rgba(255, 255, 255, 0.1)`,
      backdropFilter: 'blur(15px)',
      position: 'relative',
      overflow: 'hidden',
      transform: isComplete ? 'scale(1.02)' : 'scale(1)',
      transition: 'all 0.3s ease-out',
      willChange: 'transform'
    }}>
      {/* Simplified animated background gradient */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: '-100%',
        width: '200%',
        height: '100%',
        background: `linear-gradient(90deg, transparent, ${type === 'sending' ? 'rgba(59, 130, 246, 0.03)' : 'rgba(168, 85, 247, 0.03)'}, transparent)`,
        animation: 'shimmer 4s ease-in-out infinite',
        pointerEvents: 'none'
      }} />
      
      <div style={{ 
        fontWeight: '600', 
        color: isComplete ? '#22c55e' : (type === 'sending' ? '#60a5fa' : '#c084fc'),
        marginBottom: '1rem',
        fontSize: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        animation: 'fadeInUp 0.6s ease-out 0.2s both'
      }}>
        <span style={{
          fontSize: '1.2rem',
          animation: isComplete ? 'bounce 0.6s ease-in-out' : (type === 'sending' ? 'pulse 3s ease-in-out infinite' : 'pulse 3s ease-in-out infinite 0.5s')
        }}>
          {isComplete ? '✅' : (type === 'sending' ? '📤' : '📥')}
        </span>
        {isComplete ? 'Transfer Complete!' : 
         `${type === 'sending' ? 'Sending to' : 'Receiving from'} ${deviceName}`}
      </div>
      
      <div style={{ 
        fontSize: '1.6rem', 
        fontWeight: '800',
        marginBottom: '1rem',
        letterSpacing: '3px',
        color: isComplete ? '#22c55e' : '#ffffff',
        fontFamily: 'SF Mono, Monaco, Consolas, monospace',
        textShadow: isComplete ? '0 0 20px rgba(34, 197, 94, 0.5)' : 'none',
        animation: 'fadeInUp 0.6s ease-out 0.4s both'
      }}>
        <span style={{
          background: `linear-gradient(90deg, ${isComplete ? '#22c55e' : (type === 'sending' ? '#3b82f6' : '#a855f7')}, ${isComplete ? '#16a34a' : (type === 'sending' ? '#1d4ed8' : '#7c3aed')})`,
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          animation: 'gradientShift 4s ease-in-out infinite'
        }}>
          {filledBlocks}
        </span>
        <span style={{ opacity: 0.3 }}>{emptyBlocks}</span>
        <span style={{ marginLeft: '1rem', fontSize: '1.2rem' }}>{progress}%</span>
      </div>
      
      <div style={{ 
        fontSize: '0.9rem',
        color: '#d1d5db',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '0.5rem',
        animation: 'fadeInUp 0.6s ease-out 0.6s both'
      }}>
        <span style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <span style={{ 
            fontSize: '1.1rem',
            animation: 'rotate 6s linear infinite'
          }}>📄</span> 
          {fileName}
        </span>
        <span style={{
          background: 'rgba(255, 255, 255, 0.1)',
          padding: '0.25rem 0.5rem',
          borderRadius: '8px',
          fontSize: '0.8rem'
        }}>
          {formatFileSize(transferredBytes)} / {formatFileSize(totalSize)}
        </span>
      </div>
      
      {speed > 0 && !isComplete && (
        <div style={{ 
          fontSize: '0.85rem',
          color: '#9ca3af',
          textAlign: 'center',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          animation: 'fadeInUp 0.6s ease-out 0.8s both'
        }}>
          <span style={{ animation: 'pulse 2s ease-in-out infinite' }}>⚡</span>
          {formatSpeed(speed)}
        </div>
      )}
      
      {isComplete && (
        <div style={{ 
          fontSize: '1rem',
          color: '#22c55e',
          marginTop: '0.5rem',
          textAlign: 'center',
          fontWeight: '700',
          animation: 'celebration 1s ease-in-out',
          textShadow: '0 0 10px rgba(34, 197, 94, 0.5)'
        }}>
          🎉 Success! 🎉
        </div>
      )}
      
      {!isComplete && (
        <button
          onClick={onCancel}
          style={{
            position: 'absolute',
            top: '1.5rem',
            right: '1.5rem',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.3))',
            border: '1px solid #ef4444',
            borderRadius: '8px',
            color: '#ef4444',
            padding: '0.5rem 1rem',
            fontSize: '0.8rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease-out',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            backdropFilter: 'blur(8px)',
            animation: 'fadeInUp 0.6s ease-out 1s both',
            willChange: 'transform, background'
          }}
          onMouseOver={(e) => {
            e.target.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.4), rgba(220, 38, 38, 0.5))'
            e.target.style.transform = 'translate3d(0, -2px, 0) scale(1.03)'
            e.target.style.boxShadow = '0 6px 20px rgba(239, 68, 68, 0.25)'
          }}
          onMouseOut={(e) => {
            e.target.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.3))'
            e.target.style.transform = 'translate3d(0, 0, 0) scale(1)'
            e.target.style.boxShadow = 'none'
          }}
        >
          <span style={{ animation: 'spin 3s linear infinite' }}>✕</span>
          Cancel
        </button>
      )}
    </div>
  )
}

function App() {
  const [file, setFile] = useState(null) //Creates a React state to hold the actual File Object in "file" and update it with "setFile" whenever something changes.
  const [sendStatus, setSendStatus] = useState(null) //Creates a React state to hold the status of the send operatio
  const [notification, setNotification] = useState(null) // State for file received notifications
  const [sendResultPopup, setSendResultPopup] = useState(null) // State for send result popup
  const [sendProgress, setSendProgress] = useState(null) // State for sending progress
  const [receiveProgress, setReceiveProgress] = useState(null) // State for receiving progress
  const [isAppReady, setIsAppReady] = useState(false) // State for app loading animation

  // App ready animation
  useEffect(() => {
    const timer = setTimeout(() => setIsAppReady(true), 500)
    return () => clearTimeout(timer)
  }, [])

  // Set up listener for file received notifications
  useEffect(() => {
    window.api.onFileReceived((fileInfo) => {
      console.log('File received notification:', fileInfo)
      setReceiveProgress(null) // Clear progress when done
      setNotification({
        type: 'received',
        message: `📥 File received: ${fileInfo.fileName}`,
        details: `From: ${fileInfo.senderAddress} • Saved to: ${fileInfo.savePath}`,
        timestamp: Date.now()
      })
      
      // Auto-hide notification after 5 seconds
      setTimeout(() => {
        setNotification(null)
      }, 5000)
    })

    // Set up listener for transfer rejection notifications
    window.api.onTransferRejected((rejectionInfo) => {
      console.log('Transfer rejected notification:', rejectionInfo)
      setNotification({
        type: 'rejected',
        message: `❌ Transfer rejected: ${rejectionInfo.fileName}`,
        details: `${rejectionInfo.senderName} declined your file transfer`,
        timestamp: Date.now()
      })
      
      // Auto-hide notification after 5 seconds
      setTimeout(() => {
        setNotification(null)
      }, 5000)
    })

    // Set up listener for send progress
    window.api.onSendProgress((progressInfo) => {
      setSendProgress(progressInfo)
      
      // Clear progress when complete, but with minimum display time
      if (progressInfo.progress >= 100) {
        setTimeout(() => {
          setSendProgress(null)
        }, 3000) // Show for at least 3 seconds
      }
    })

    // Set up listener for receive progress
    window.api.onReceiveProgress((progressInfo) => {
      setReceiveProgress(progressInfo)
      
      // Clear progress when complete, but with minimum display time
      if (progressInfo.progress >= 100) {
        setTimeout(() => {
          setReceiveProgress(null)
        }, 3000) // Show for at least 3 seconds
      }
    })

    // Cleanup listeners on component unmount
    return () => {
      window.api.removeFileReceivedListener()
      window.api.removeTransferRejectedListener()
      window.api.removeSendProgressListener()
      window.api.removeReceiveProgressListener()
    }
  }, [])

  // Handle cancel sending
  const handleCancelSend = async () => {
    console.log('Canceling send transfer...')
    try {
      await window.api.cancelSend()
      setSendProgress(null)
      setSendStatus(null)
      setSendResultPopup({
        success: false,
        message: 'Transfer canceled',
        timestamp: Date.now()
      })
      setTimeout(() => {
        setSendResultPopup(null)
      }, 3000)
    } catch (error) {
      console.error('Error canceling send:', error)
    }
  }

  // Handle cancel receiving
  const handleCancelReceive = async () => {
    console.log('Canceling receive transfer...')
    try {
      await window.api.cancelReceive()
      setReceiveProgress(null)
      setNotification({
        type: 'rejected',
        message: '❌ Transfer canceled',
        details: 'You canceled the incoming file transfer',
        timestamp: Date.now()
      })
      setTimeout(() => {
        setNotification(null)
      }, 3000)
    } catch (error) {
      console.error('Error canceling receive:', error)
    }
  }

  const handleFileSelect = selectedFiles => {
    //Callback passed to FilePicker. When a file is selected, FilePicker calls this and updates the file state.
    const selectedFile = selectedFiles[0] //Assuming single file selection, we take the first
    console.log('Selected file:', selectedFile) //Log the selected file for debugging
    setFile(selectedFile)
    setSendStatus(null) //Reset send status when a new file is selected
    setSendResultPopup(null) //Reset send result popup
    setSendProgress(null) //Reset send progress
  }

  const handleSend = async device => {
    if (!file) {
      console.error('No file selected for sending')
      return
    }

    console.log('Sending file:', file, 'to device:', device) //Log the file and device for debugging
    setSendStatus('sending')
    setSendProgress(null) // Reset progress
    try {
      const result = await window.api.sendFile(device, file.path)
      console.log('Send file result:', result)
      setSendStatus(null) // Clear sending status
      
      // Show result popup
      setSendResultPopup({
        success: result.success,
        message: result.message,
        timestamp: Date.now()
      })
      
      // Clear selected file after successful transfer
      if (result.success) {
        setFile(null)
      }
      
      // Auto-hide popup after 4 seconds
      setTimeout(() => {
        setSendResultPopup(null)
      }, 4000)
      
    } catch (error) {
      console.error('Error sending file:', error)
      setSendStatus(null)
      setSendProgress(null) // Clear progress on error
      setSendResultPopup({
        success: false,
        message: 'Error: ' + error.message,
        timestamp: Date.now()
      })
      
      setTimeout(() => {
        setSendResultPopup(null)
      }, 4000)
    }
  }

  return (
    <div style={{ 
      padding: '0',
      fontFamily: 'SF Pro Display, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
      background: 'radial-gradient(ellipse at top, #0f0f23 0%, #1a1a2e 40%, #16213e 100%)',
      color: '#ffffff',
      minHeight: '100vh',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <FloatingParticles />
      
      {/* Animated background grid */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(59, 130, 246, 0.1) 1px, transparent 0)',
        backgroundSize: '50px 50px',
        animation: 'gridMove 30s linear infinite',
        pointerEvents: 'none',
        zIndex: 1
      }} />

      <div style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '2rem',
        position: 'relative',
        zIndex: 10,
        opacity: isAppReady ? 1 : 0,
        transform: isAppReady ? 'translateY(0)' : 'translateY(30px)',
        transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        {/* Enhanced animated title */}
        <div style={{
          textAlign: 'center',
          marginBottom: '3rem',
          animation: 'titleFloat 8s ease-in-out infinite'
        }}>
          <h1 style={{
            fontSize: '3.5rem',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 30%, #06b6d4 60%, #10b981 100%)',
            backgroundSize: '300% 300%',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '0.5rem',
            animation: 'gradientFlow 6s ease-in-out infinite, textGlow 4s ease-in-out infinite',
            textShadow: '0 0 30px rgba(59, 130, 246, 0.3)',
            letterSpacing: '2px'
          }}>
            📡 NearDrop
          </h1>
          <p style={{
            fontSize: '1.2rem',
            color: 'rgba(255, 255, 255, 0.7)',
            fontWeight: '300',
            animation: 'fadeInUp 1.2s ease-out 0.5s both'
          }}>
            Lightning-fast file sharing across devices
          </p>
        </div>
        
        <div style={{
          animation: 'containerFloat 10s ease-in-out infinite'
        }}>
          <FilePicker onFileSelect={handleFileSelect} />
        </div>
        
        {file && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.9), rgba(45, 45, 45, 0.8))',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '2rem',
            margin: '2rem 0',
            backdropFilter: 'blur(15px)',
            boxShadow: '0 15px 35px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            userSelect: 'none',
            animation: 'slideInFromLeft 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Simplified animated accent line */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '3px',
              background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #06b6d4)',
              animation: 'accentFlow 4s ease-in-out infinite'
            }} />
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <div style={{
                fontSize: '2rem',
                animation: 'fileIconBounce 3s ease-in-out infinite'
              }}>📄</div>
              <div>
                <p style={{ 
                  margin: '0',
                  fontSize: '1.1rem',
                  color: '#e5e7eb',
                  userSelect: 'none',
                  fontWeight: '600'
                }}>
                  <span style={{ 
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontWeight: '400'
                  }}>Selected:</span> {file.name}
                </p>
                {sendStatus === 'sending' && !sendProgress && (
                  <p style={{ 
                    margin: '0.75rem 0 0 0',
                    fontSize: '0.95rem',
                    color: '#60a5fa',
                    userSelect: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    animation: 'pulse 3s ease-in-out infinite'
                  }}>
                    <span style={{ animation: 'spin 2s linear infinite' }}>⚙️</span>
                    Preparing to send...
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Send Progress Bar */}
        {sendProgress && (
          <ProgressBar
            progress={sendProgress.progress}
            fileName={sendProgress.fileName}
            deviceName={sendProgress.deviceName}
            speed={sendProgress.speed}
            totalSize={sendProgress.totalSize}
            transferredBytes={sendProgress.sentBytes}
            type="sending"
            onCancel={handleCancelSend}
          />
        )}
        
        {/* Receive Progress Bar */}
        {receiveProgress && (
          <ProgressBar
            progress={receiveProgress.progress}
            fileName={receiveProgress.fileName}
            deviceName={receiveProgress.senderName}
            speed={receiveProgress.speed}
            totalSize={receiveProgress.totalSize}
            transferredBytes={receiveProgress.receivedBytes}
            type="receiving"
            onCancel={handleCancelReceive}
          />
        )}
        
        <div style={{
          animation: 'containerFloat 10s ease-in-out infinite 2s'
        }}>
          <DeviceList file={file} onSend={handleSend} />
        </div>
      </div>
      
      {/* File Received/Rejected Notification */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: notification.type === 'received' ? 'rgba(34, 197, 94, 0.95)' : 'rgba(239, 68, 68, 0.95)',
          color: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(10px)',
          border: `1px solid ${notification.type === 'received' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          zIndex: 1000,
          maxWidth: '380px',
          animation: 'slideIn 0.3s ease-out'
        }}>
          <div style={{ fontWeight: '600', marginBottom: '0.5rem', fontSize: '1rem' }}>
            {notification.message}
          </div>
          <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>
            {notification.details}
          </div>
          <button 
            onClick={() => setNotification(null)}
            style={{
              position: 'absolute',
              top: '8px',
              right: '12px',
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '1.4rem',
              cursor: 'pointer',
              padding: '0',
              width: '24px',
              height: '24px',
              opacity: 0.7,
              transition: 'opacity 0.2s'
            }}
            onMouseOver={(e) => e.target.style.opacity = '1'}
            onMouseOut={(e) => e.target.style.opacity = '0.7'}
          >
            ×
          </button>
        </div>
      )}

      {/* Send Result Popup */}
      {sendResultPopup && (
        <div style={{
          position: 'fixed',
          top: '90px',
          right: '20px',
          backgroundColor: sendResultPopup.success ? 'rgba(34, 197, 94, 0.95)' : 'rgba(239, 68, 68, 0.95)',
          color: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(10px)',
          border: `1px solid ${sendResultPopup.success ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          zIndex: 1000,
          maxWidth: '320px',
          animation: 'slideIn 0.3s ease-out'
        }}>
          <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>
            {sendResultPopup.success ? '✅' : '❌'} {sendResultPopup.message}
          </div>
          <button 
            onClick={() => setSendResultPopup(null)}
            style={{
              position: 'absolute',
              top: '8px',
              right: '12px',
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '1.4rem',
              cursor: 'pointer',
              padding: '0',
              width: '24px',
              height: '24px',
              opacity: 0.7,
              transition: 'opacity 0.2s'
            }}
            onMouseOver={(e) => e.target.style.opacity = '1'}
            onMouseOut={(e) => e.target.style.opacity = '0.7'}
          >
            ×
          </button>
        </div>
      )}

      <style>{`
        * {
          -webkit-user-select: none !important;
          -moz-user-select: none !important;
          -ms-user-select: none !important;
          user-select: none !important;
        }
        
        input, textarea {
          -webkit-user-select: text !important;
          -moz-user-select: text !important;
          -ms-user-select: text !important;
          user-select: text !important;
        }
        
        /* Floating particle animations */
        @keyframes float0 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-30px) rotate(120deg); }
          66% { transform: translateY(20px) rotate(240deg); }
        }
        
        @keyframes float1 {
          0%, 100% { transform: translateX(0px) translateY(0px); }
          25% { transform: translateX(20px) translateY(-20px); }
          50% { transform: translateX(-15px) translateY(30px); }
          75% { transform: translateX(25px) translateY(10px); }
        }
        
        @keyframes float2 {
          0%, 100% { transform: scale(1) rotate(0deg); }
          50% { transform: scale(1.5) rotate(180deg); }
        }
        
        /* Grid background animation */
        @keyframes gridMove {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }
        
        /* Title animations */
        @keyframes titleFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        
        @keyframes gradientFlow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        @keyframes textGlow {
          0%, 100% { text-shadow: 0 0 30px rgba(59, 130, 246, 0.3); }
          50% { text-shadow: 0 0 40px rgba(139, 92, 246, 0.4), 0 0 60px rgba(6, 182, 212, 0.2); }
        }
        
        /* Container animations */
        @keyframes containerFloat {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-6px) scale(1.005); }
        }
        
        /* Progress bar animations */
        @keyframes slideInFromBottom {
          from {
            opacity: 0;
            transform: translateY(50px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes slideInFromLeft {
          from {
            opacity: 0;
            transform: translateX(-50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes progressGlow {
          0%, 100% { box-shadow: 0 10px 40px rgba(59, 130, 246, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1); }
          50% { box-shadow: 0 12px 45px rgba(59, 130, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15); }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        @keyframes celebration {
          0% { transform: scale(1); }
          25% { transform: scale(1.05) rotate(2deg); }
          50% { transform: scale(1.1) rotate(-2deg); }
          75% { transform: scale(1.05) rotate(1deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        
        @keyframes accentFlow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        @keyframes fileIconBounce {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-3px) rotate(2deg); }
          50% { transform: translateY(0) rotate(0deg); }
          75% { transform: translateY(-2px) rotate(-1deg); }
        }
        
        /* Micro-interaction animations */
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.03); }
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes bounce {
          0%, 20%, 53%, 80%, 100% { transform: translateY(0); }
          40%, 43% { transform: translateY(-8px); }
          70% { transform: translateY(-4px); }
          90% { transform: translateY(-2px); }
        }
        
        @keyframes rotate {
          0% { transform: rotate(0deg); }
          25% { transform: rotate(90deg); }
          50% { transform: rotate(180deg); }
          75% { transform: rotate(270deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes completePulse {
          0% {
            transform: scale(1);
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
          }
          50% {
            transform: scale(1.02);
            box-shadow: 0 0 30px rgba(34, 197, 94, 0.6);
          }
          100% {
            transform: scale(1);
            box-shadow: 0 0 20px rgba(34, 197, 94, 0.3);
          }
        }
        
        /* Scrollbar styling for dark theme */
        ::-webkit-scrollbar {
          width: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(45deg, #3b82f6, #8b5cf6);
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(45deg, #2563eb, #7c3aed);
        }
      `}</style>
    </div>
  )
}

export default App
