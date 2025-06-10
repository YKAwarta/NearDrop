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
      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03))',
      border: '2px dashed rgba(59, 130, 246, 0.4)',
      borderRadius: '24px',
      padding: '4rem 3rem',
      textAlign: 'center',
      margin: '2rem 0',
      transition: 'all 0.2s ease-out',
      backdropFilter: 'blur(10px)',
      position: 'relative',
      overflow: 'hidden',
      cursor: 'pointer',
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
      willChange: 'transform, border-color, background'
    }}
    onMouseOver={(e) => {
      e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.8)'
      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(139, 92, 246, 0.04))'
      e.currentTarget.style.transform = 'translate3d(0, -6px, 0) scale(1.01)'
    }}
    onMouseOut={(e) => {
      e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.4)'
      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03))'
      e.currentTarget.style.transform = 'translate3d(0, 0, 0) scale(1)'
    }}
    onClick={handleFileSelect}
    >
      {/* Simplified background waves */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'radial-gradient(circle at 30% 70%, rgba(59, 130, 246, 0.05) 0%, transparent 50%), radial-gradient(circle at 70% 30%, rgba(139, 92, 246, 0.05) 0%, transparent 50%)',
        animation: 'waveFloat 8s ease-in-out infinite',
        pointerEvents: 'none',
        willChange: 'transform'
      }} />
      
      {/* Reduced number of floating particles and simplified animations */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '20%',
        width: '6px',
        height: '6px',
        background: 'linear-gradient(45deg, #3b82f6, #8b5cf6)',
        borderRadius: '50%',
        animation: 'particleFloat1 8s ease-in-out infinite',
        opacity: 0.4,
        willChange: 'transform'
      }} />
      
      <div style={{
        position: 'absolute',
        top: '70%',
        right: '25%',
        width: '4px',
        height: '4px',
        background: 'linear-gradient(45deg, #06b6d4, #10b981)',
        borderRadius: '50%',
        animation: 'particleFloat2 10s ease-in-out infinite 3s',
        opacity: 0.3,
        willChange: 'transform'
      }} />
      
      <div style={{ 
        fontSize: '4rem',
        marginBottom: '1.5rem',
        background: 'linear-gradient(135deg, #3b82f6, #8b5cf6, #06b6d4)',
        backgroundSize: '200% 200%',
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        animation: 'iconPulse 4s ease-in-out infinite, gradientShift 6s ease-in-out infinite',
        filter: 'drop-shadow(0 4px 12px rgba(59, 130, 246, 0.3))',
        position: 'relative',
        zIndex: 2,
        willChange: 'transform'
      }}>📁</div>
      
      <h3 style={{
        fontSize: '1.8rem',
        fontWeight: '700',
        color: '#ffffff',
        marginBottom: '0.8rem',
        margin: '0 0 0.8rem 0',
        background: 'linear-gradient(135deg, #ffffff, #e2e8f0)',
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        animation: 'titleShimmer 4s ease-in-out infinite',
        position: 'relative',
        zIndex: 2
      }}>
        Choose a file to share
      </h3>
      
      <p style={{
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: '1rem',
        marginBottom: '2.5rem',
        margin: '0 0 2.5rem 0',
        fontWeight: '400',
        lineHeight: '1.6',
        animation: 'fadeInUp 1s ease-out 0.3s both',
        position: 'relative',
        zIndex: 2
      }}>
        Select any file from your computer to send to nearby devices
      </p>
      
      <button
        onClick={(e) => {
          e.stopPropagation()
          handleFileSelect()
        }}
        style={{
          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
          color: 'white',
          border: 'none',
          borderRadius: '16px',
          padding: '1.2rem 2.5rem',
          fontSize: '1.1rem',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'all 0.2s ease-out',
          boxShadow: '0 8px 32px rgba(59, 130, 246, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.8rem',
          position: 'relative',
          zIndex: 2,
          overflow: 'hidden',
          willChange: 'transform, background'
        }}
        onMouseOver={(e) => {
          e.target.style.background = 'linear-gradient(135deg, #2563eb, #7c3aed)'
          e.target.style.transform = 'translate3d(0, -3px, 0) scale(1.03)'
        }}
        onMouseOut={(e) => {
          e.target.style.background = 'linear-gradient(135deg, #3b82f6, #8b5cf6)'
          e.target.style.transform = 'translate3d(0, 0, 0) scale(1)'
        }}
        onMouseDown={(e) => {
          e.target.style.transform = 'translate3d(0, -1px, 0) scale(1.01)'
        }}
        onMouseUp={(e) => {
          e.target.style.transform = 'translate3d(0, -3px, 0) scale(1.03)'
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
          fontSize: '1.2rem',
          animation: 'iconBounce 3s ease-in-out infinite'
        }}>📎</span>
        Select File
      </button>
      
      <div style={{
        fontSize: '0.9rem',
        color: 'rgba(255, 255, 255, 0.5)',
        marginTop: '2rem',
        fontWeight: '400',
        animation: 'fadeInUp 1s ease-out 0.6s both',
        position: 'relative',
        zIndex: 2
      }}>
        <span style={{ 
          background: 'linear-gradient(45deg, #10b981, #06b6d4)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontWeight: '500'
        }}>
          ✨ Supports all file types
        </span>
        {' • '}
        <span style={{ 
          background: 'linear-gradient(45deg, #f59e0b, #ef4444)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontWeight: '500'
        }}>
          ⚡ Lightning fast transfers
        </span>
      </div>
      
      <style jsx>{`
        @keyframes waveFloat {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        @keyframes particleFloat1 {
          0%, 100% { transform: translate3d(0, 0, 0); }
          50% { transform: translate3d(15px, -10px, 0); }
        }
        
        @keyframes particleFloat2 {
          0%, 100% { transform: translate3d(0, 0, 0); }
          50% { transform: translate3d(-20px, -15px, 0); }
        }
        
        @keyframes iconPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        @keyframes titleShimmer {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        @keyframes buttonShine {
          0% { left: -100%; }
          50%, 100% { left: 100%; }
        }
        
        @keyframes iconBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
      `}</style>
    </div>
  )
}

export default FilePicker
