import React, { useState, useRef, useEffect } from 'react'

const DragDropZone = ({ onFileSelect }) => {
  const [isDragActive, setIsDragActive] = useState(false)
  const dropRef = useRef(null)

  const preventDefaults = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e) => {
    preventDefaults(e)
    setIsDragActive(false)

    const files = e.dataTransfer ? e.dataTransfer.files : e.target.files
    
    if (files.length > 0) {
      const processedFiles = Array.from(files).map(file => ({
        name: file.name,
        path: file.path || file.webkitRelativePath,
        size: file.size,
        type: file.type
      }))

      onFileSelect(processedFiles)
    }
  }

  const handleDragEnter = (e) => {
    preventDefaults(e)
    setIsDragActive(true)
  }

  const handleDragLeave = (e) => {
    preventDefaults(e)
    setIsDragActive(false)
  }

  const handleFileSelect = async () => {
    try {
      const result = await window.api.showFilePicker()
      
      if (result && result.filePaths && result.filePaths.length > 0) {
        const processedFiles = result.filePaths.map(filePath => ({
          name: filePath.split('/').pop() || filePath.split('\\').pop(),
          path: filePath,
          size: null,  
          type: null
        }))
        
        onFileSelect(processedFiles)
      }
    } catch (error) {
      console.error('File selection error:', error)
    }
  }

  useEffect(() => {
    const div = dropRef.current
    
    div.addEventListener('dragenter', handleDragEnter)
    div.addEventListener('dragover', preventDefaults)
    div.addEventListener('dragleave', handleDragLeave)
    div.addEventListener('drop', handleDrop)

    return () => {
      div.removeEventListener('dragenter', handleDragEnter)
      div.removeEventListener('dragover', preventDefaults)
      div.removeEventListener('dragleave', handleDragLeave)
      div.removeEventListener('drop', handleDrop)
    }
  }, [])

  return (
    <div 
      ref={dropRef}
      onClick={handleFileSelect}
      style={{
        border: `3px dashed ${isDragActive ? '#3b82f6' : 'rgba(59, 130, 246, 0.4)'}`,
        borderRadius: '24px',
        padding: '4rem 3rem',
        textAlign: 'center',
        transition: 'all 0.3s ease-out',
        background: isDragActive 
          ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.05))' 
          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03))',
        cursor: 'pointer',
        position: 'relative',
        boxShadow: isDragActive 
          ? '0 20px 60px rgba(59, 130, 246, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)' 
          : '0 10px 40px rgba(59, 130, 246, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        transform: isDragActive ? 'scale(1.02)' : 'scale(1)',
        willChange: 'transform, border-color, background'
      }}
    >
      <div style={{
        fontSize: '4rem',
        opacity: isDragActive ? 0.7 : 0.5,
        transition: 'all 0.3s ease-out',
        transform: `translateY(${isDragActive ? '-10px' : '0'})`,
        animation: 'iconFloat 3s ease-in-out infinite'
      }}>
        📤
      </div>

      <h2 style={{
        color: isDragActive ? '#3b82f6' : 'rgba(255, 255, 255, 0.8)',
        transition: 'color 0.3s ease-out',
        marginBottom: '1rem'
      }}>
        {isDragActive ? 'Drop files here' : 'Drag and Drop Files'}
      </h2>

      <p style={{
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: '0.9rem'
      }}>
        or <span style={{ 
          color: '#3b82f6', 
          textDecoration: 'underline',
          cursor: 'pointer'
        }}>Browse Files</span>
      </p>

      <style jsx>{`
        @keyframes iconFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  )
}

export default DragDropZone