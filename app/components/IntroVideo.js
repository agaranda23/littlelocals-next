'use client'
import { useState, useRef } from 'react'

const VIDEO_URL = 'https://xjifxwvziwoepiioyitm.supabase.co/storage/v1/object/public/media/WhatsApp%20Video%202026-04-22%20at%2021.31.18.mp4'

export default function IntroVideo() {
    const [muted, setMuted] = useState(true)
    const videoRef = useRef(null)

  function toggleMute() {
        const newMuted = !muted
        setMuted(newMuted)
        if (videoRef.current) videoRef.current.muted = newMuted
  }

  return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '16px 16px 0',
          maxWidth: '480px',
          margin: '0 auto',
  }}>
      <div style={{ position: 'relative', width: '100%' }}>
        <video
          ref={videoRef}
          src={VIDEO_URL}
          autoPlay
          muted
          loop
          playsInline
          style={{
                        width: '100%',
                        borderRadius: '16px',
                        display: 'block',
          }}
        />
        <button
          onClick={toggleMute}
          aria-label={muted ? 'Unmute video' : 'Mute video'}
          style={{
                        position: 'absolute',
                        bottom: '12px',
                        right: '12px',
                        background: 'rgba(0,0,0,0.55)',
                        border: 'none',
                        borderRadius: '50%',
                        width: '36px',
                        height: '36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontSize: '16px',
                        backdropFilter: 'blur(4px)',
          }}
        >
{muted ? '🔇' : '🔊'}
</button>
  </div>
      <p style={{
          fontSize: '13px',
          color: '#888',
          textAlign: 'center',
                    margin: '8px 0 0',
          lineHeight: '1.4',
}}>
        Built by Ealing parents, for Ealing parents — find something to do with the kids in 30 seconds.
          </p>
          </div>
  )
}
