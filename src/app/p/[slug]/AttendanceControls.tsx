'use client';

import { useState } from 'react';
import { registerAttendance } from './attendanceActions';
import { LogIn, LogOut, CheckCircle2, AlertCircle } from 'lucide-react';
import styles from './public.module.css'; // Re-use public card styles where applicable

export default function AttendanceControls({ employeeId }: { employeeId: string }) {
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleAttendance = async (type: 'check_in' | 'check_out') => {
        setIsLoading(true);
        setMessage(null);

        const result = await registerAttendance(employeeId, type);

        if (result.success) {
            setMessage({
                type: 'success',
                text: type === 'check_in' ? 'Entrada registrada exitosamente' : 'Salida registrada exitosamente'
            });
            // Clear success message after 3 seconds
            setTimeout(() => setMessage(null), 3000);
        } else {
            setMessage({ type: 'error', text: result.error || 'Ocurrió un error al registrar.' });
        }

        setIsLoading(false);
    };

    return (
        <div style={{
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '1.5rem',
            marginTop: '2rem',
            width: '100%',
            maxWidth: '400px',
            backdropFilter: 'blur(10px)',
            color: 'white'
        }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                Controles de Admin
            </h3>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button
                    onClick={() => handleAttendance('check_in')}
                    disabled={isLoading}
                    style={{
                        flex: 1,
                        background: 'var(--color-green)',
                        color: 'white',
                        border: 'none',
                        padding: '12px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        fontWeight: '600',
                        transition: 'opacity 0.2s',
                        opacity: isLoading ? 0.7 : 1
                    }}
                >
                    <LogIn size={20} /> Entrada
                </button>

                <button
                    onClick={() => handleAttendance('check_out')}
                    disabled={isLoading}
                    style={{
                        flex: 1,
                        background: 'var(--color-red)',
                        color: 'white',
                        border: 'none',
                        padding: '12px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        fontWeight: '600',
                        transition: 'opacity 0.2s',
                        opacity: isLoading ? 0.7 : 1
                    }}
                >
                    <LogOut size={20} /> Salida
                </button>
            </div>

            {message && (
                <div style={{
                    marginTop: '1rem',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.9rem',
                    background: message.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                    color: message.type === 'success' ? '#34d399' : '#f87171',
                }}>
                    {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    {message.text}
                </div>
            )}
        </div>
    );
}
