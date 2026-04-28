'use client'
import { useState, useRef, useEffect } from 'react'

const VIDEO_URL = 'https://xjifxwvziwoepiioyitm.supabase.co/storage/v1/object/public/media/WhatsApp%20Video%202026-04-22%20at%2021.31.18.mp4'
const STORAGE_KEY = 'll_visited'

export default function IntroVideo() {
        const [muted, setMuted] = useState(true)
        const [visible, setVisible] = useState(false)
        const [dismissed, setDismissed] = useState(false)
        const videoRef = useRef(null)

    useEffect(() => {
                // Show video only on first visit; returning users skip it
                      const hasVisited = localStorage.getItem(STORAGE_KEY)
                if (!hasVisited) {
                                setVisible(true)
                }
    }, [])

    function toggleMute() {
                const newMuted = !muted
                setMuted(newMuted)
                if (videoRef.current) videoRef.current.muted = newMuted
    }

    function dismiss() {
                setDismissed(true)
                // Mark this device as a returning visitor
            localStorage.setItem(STORAGE_KEY, '1')
    }

    if (!visible || dismissed) return null

    return (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '16px 16px 0',
                    maxWidth: '480px',
                    margin: '0 auto',
    }}>
            <div style={{ position: 'relative', width: '100%', borderRadius: '16px', overflow: 'hidden' }}>
                <video
                    ref={videoRef}
                    src={VIDEO_URL}
                    autoPlay
                    muted
                    loop
                    playsInline
                    style={{ width: '100%', display: 'block' }}
                />
{/* Mute toggle */}
                <button
                    onClick={toggleMute}
                    style={{
                                                position: 'absolute',
                                                bottom: '8px',
                                                right: '44px',
                                                background: 'rgba(0,0,0,0.55)',
                                                border: 'none',
                                                borderRadius: '50%',
                                                width: '32px',
                                                height: '32px',
                                                cursor: 'pointer',
                                                fontSize: '16px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                    }}
                    aria-label={muted ? 'Unmute' : 'Mute'}
                >
{muted ? '🔇' : '🔊'}
</button>
{/* Dismiss button */}
                <button
                    onClick={dismiss}
                    style={{
                                                position: 'absolute',
                                                bottom: '8px',
                                                right: '8px',
                                                background: 'rgba(0,0,0,0.55)',
                                                border: 'none',
                                                borderRadius: '50%',
                                                width: '32px',
                                                height: '32px',
                                                cursor: 'pointer',
                                                fontSize: '16px',
                                                color: '#fff',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                    }}
                    aria-label="Close video"
                >
                                            ✕
                        </button>
                        </div>
            <p style={{
                                        fontSize: '13px',
                                        color: '#666',
                                        textAlign: 'center',
                                        margin: '8px 0 0',
                                        lineHeight: '1.4',
                    }}>
                Built by Ealing parents, for Ealing parents — find something to do with the kids in 30 seconds.
                    </p>
                    </div>
    )
}
