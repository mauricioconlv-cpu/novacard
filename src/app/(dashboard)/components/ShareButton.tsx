'use client'

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Share2, X, Download } from 'lucide-react';
import QRCode from 'react-qr-code';

interface ShareButtonProps {
    slug: string;
    cardTitle: string;
}

export default function ShareButton({ slug, cardTitle }: ShareButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Calculate dynamic base URL based on environment
    const getBaseUrl = () => {
        if (typeof window !== 'undefined') {
            return window.location.origin;
        }
        return 'https://novacard.app';
    };

    const publicUrl = `${getBaseUrl()}/p/${slug}`;
    const scanUrl = `${getBaseUrl()}/scan/${slug}`;

    const downloadQR = () => {
        const svg = document.getElementById(`qr-code-${slug}`);
        if (!svg) return;

        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();

        img.onload = () => {
            // Add padding so the QR code isn't cut off
            canvas.width = img.width + 40;
            canvas.height = img.height + 40;
            if (ctx) {
                ctx.fillStyle = "white";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 20, 20);

                const pngFile = canvas.toDataURL("image/png");
                const downloadLink = document.createElement("a");
                downloadLink.download = `QR_${cardTitle.replace(/\s+/g, '_')}.png`;
                downloadLink.href = `${pngFile}`;
                downloadLink.click();
            }
        };
        img.src = "data:image/svg+xml;base64," + btoa(svgData);
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="btn btn-glass"
                style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem' }}
            >
                <Share2 size={14} /> Compartir
            </button>

            {isOpen && mounted && createPortal(
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1rem' // for mobile padding
                }}>
                    <div style={{
                        background: '#0f172a',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '24px',
                        padding: '2rem',
                        width: '100%',
                        maxWidth: '400px',
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '1.5rem',
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
                    }}>
                        <button
                            onClick={() => setIsOpen(false)}
                            style={{
                                position: 'absolute',
                                top: '15px', right: '15px',
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-secondary)',
                                cursor: 'pointer',
                                padding: '5px'
                            }}
                        >
                            <X size={24} />
                        </button>

                        <div style={{ textAlign: 'center' }}>
                            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem' }}>Escanear para ver Tarjeta</h3>
                            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{cardTitle}</p>
                        </div>

                        <div style={{ background: 'white', padding: '1rem', borderRadius: '16px' }}>
                            <QRCode
                                id={`qr-code-${slug}`}
                                value={scanUrl}
                                size={200}
                                level="H"
                            />
                        </div>

                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <button
                                onClick={downloadQR}
                                className="btn btn-primary"
                                style={{ width: '100%', padding: '12px', display: 'flex', justifyContent: 'center', gap: '8px' }}
                            >
                                <Download size={18} /> Descargar QR
                            </button>
                            <a
                                href={publicUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-glass"
                                style={{ width: '100%', padding: '12px', display: 'flex', justifyContent: 'center', textDecoration: 'none' }}
                            >
                                Abrir Enlace Público
                            </a>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
