'use client'

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase-client';
import { Image as ImageIcon, Loader2, UploadCloud } from 'lucide-react';

interface ImageUploaderProps {
    bucket: 'profile-photos' | 'logos';
    currentUrl?: string;
    onUploadSuccess: (url: string) => void;
    label: string;
}

export default function ImageUploader({ bucket, currentUrl, onUploadSuccess, label }: ImageUploaderProps) {
    const supabase = createClient();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Basic validation
        if (file.size > 2 * 1024 * 1024) { // 2MB limit
            setError('La imagen debe pesar menos de 2MB');
            return;
        }

        setIsUploading(true);
        setError(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Usuario no autenticado');

            // Create a unique file path: user_id/timestamp-filename
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const filePath = `${user.id}/${fileName}`;

            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) throw uploadError;

            // Get the public URL
            const { data: { publicUrl } } = supabase.storage
                .from(bucket)
                .getPublicUrl(filePath);

            onUploadSuccess(publicUrl);
        } catch (err: any) {
            console.error('Upload Error:', err);
            setError('Error al subir la imagen. Inténtalo de nuevo.');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = ''; // Reset input
            }
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{label}</span>
            <div
                style={{
                    border: '1px dashed rgba(255,255,255,0.2)',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    textAlign: 'center',
                    cursor: isUploading ? 'not-allowed' : 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                    background: currentUrl ? 'rgba(0,0,0,0.5)' : 'transparent',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '120px'
                }}
                onClick={() => !isUploading && fileInputRef.current?.click()}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/jpeg, image/png, image/webp"
                    style={{ display: 'none' }}
                />

                {isUploading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: 'var(--color-blue)' }}>
                        <Loader2 className="animate-spin" size={24} />
                        <span style={{ fontSize: '0.8rem' }}>Subiendo...</span>
                    </div>
                ) : currentUrl ? (
                    <>
                        <img
                            src={currentUrl}
                            alt="Uploaded preview"
                            style={{
                                position: 'absolute',
                                top: 0, left: 0,
                                width: '100%', height: '100%',
                                objectFit: bucket === 'profile-photos' ? 'cover' : 'contain',
                                opacity: 0.6
                            }}
                        />
                        <div style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(0,0,0,0.6)', padding: '6px 12px', borderRadius: '20px' }}>
                            <UploadCloud size={16} />
                            <span style={{ fontSize: '0.8rem' }}>Cambiar Foto</span>
                        </div>
                    </>
                ) : (
                    <>
                        <ImageIcon size={24} color="var(--text-secondary)" style={{ marginBottom: '0.5rem' }} />
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Clic para subir</span>
                    </>
                )}
            </div>
            {error && <span style={{ color: 'var(--color-red)', fontSize: '0.8rem' }}>{error}</span>}
        </div>
    );
}
