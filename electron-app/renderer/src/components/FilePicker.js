import React from 'react'

function FilePicker({ onFileSelect }) {
  const handleFileSelect = async () => {
    try {
      const result = await window.api.showFilePicker()
      console.log('File picker result:', result) // Debug log
      
      // Handle different possible result structures
      if (!result) {
        console.log('No result from file picker')
        return
      }
      
      if (result.canceled) {
        console.log('File picker was canceled')
        return
      }
      
      // Check if filePaths exists and has items
      if (result.filePaths && result.filePaths.length > 0) {
        const filePath = result.filePaths[0]
        const fileName = filePath.split('/').pop() || filePath.split('\\\\').pop()
        onFileSelect([{ name: fileName, path: filePath }])
      } else {
        console.error('Unexpected result structure:', result)
      }
    } catch (error) {
      console.error('Error selecting file:', error)
    }
  }

  return (
    <div style={{
      backgroundColor: '#1a1a1a',
      border: '2px dashed #374151',
      borderRadius: '12px',
      padding: '3rem',
      textAlign: 'center',
      margin: '1rem 0',
      transition: 'all 0.3s ease',
      backdropFilter: 'blur(10px)',
      position: 'relative',
      overflow: 'hidden',
      userSelect: 'none !important'
    }}
    >
      <div style={{
        fontSize: '3rem',
        marginBottom: '1rem',
        opacity: 0.7
      }}>📁</div>
      
      <h3 style={{
        fontSize: '1.2rem',
        fontWeight: '600',
        color: '#ffffff',
        marginBottom: '0.5rem',
        margin: '0 0 0.5rem 0'
      }}>
        Choose a file to share
      </h3>
      
      <p style={{
        color: '#9ca3af',
        fontSize: '0.9rem',
        marginBottom: '2rem',
        margin: '0 0 2rem 0'
      }}>
        Select any file from your computer to send to nearby devices
      </p>
      
      <button
        onClick={handleFileSelect}
        style={{
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          padding: '1rem 2rem',
          fontSize: '1rem',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'all 0.2s',
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}
        onMouseOver={(e) => {
          e.target.style.backgroundColor = '#2563eb'
          e.target.style.transform = 'translateY(-2px)'
          e.target.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.4)'
        }}
        onMouseOut={(e) => {
          e.target.style.backgroundColor = '#3b82f6'
          e.target.style.transform = 'translateY(0)'
          e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)'
        }}
      >
        📎 Select File
      </button>
      
      <div style={{
        fontSize: '0.8rem',
        color: '#6b7280',
        marginTop: '1.5rem'
      }}>
        Supports all file types • Maximum size depends on network speed
      </div>
    </div>
  )
}

export default FilePicker
