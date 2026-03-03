'use client';

import { useActionState, useState } from 'react';
import { createEmployee } from './actions';
import { Users, Save, X } from 'lucide-react';

export default function EmployeeForm({ onCancel }: { onCancel: () => void }) {
    const [state, formAction, isPending] = useActionState(createEmployee, null);

    return (
        <form action={formAction} className="glass-panel" style={{ padding: '2rem', animation: 'fadeIn 0.3s ease-in-out' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Users size={20} className="text-gradient" /> Registrar Nuevo Empleado
                </h3>
                <button type="button" onClick={onCancel} className="btn" style={{ background: 'transparent', padding: '0.5rem' }}>
                    <X size={20} />
                </button>
            </div>

            {state?.error && (
                <div style={{ background: 'rgba(244, 63, 94, 0.1)', color: 'var(--color-magenta)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                    {state.error}
                </div>
            )}

            {state?.success && (
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-green)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                    Empleado registrado correctamente. Se ha enviado un correo o ya puede iniciar sesión con su contraseña.
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div className="form-group">
                    <label>Nombre Completo</label>
                    <input type="text" name="full_name" className="input" placeholder="Ej. Juan Pérez" required />
                </div>

                <div className="form-group">
                    <label>Jornada Laboral (Asistencia)</label>
                    <select name="work_schedule" className="input" defaultValue="8h" required>
                        <option value="8h">8 Horas (L-V)</option>
                        <option value="9h">9 Horas</option>
                        <option value="10h">10 Horas</option>
                        <option value="12h">12 Horas</option>
                        <option value="24x24">24 x 24</option>
                        <option value="48x48">48 x 48</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>Correo Electrónico</label>
                    <input type="email" name="email" className="input" placeholder="juan@empresa.com" required />
                </div>

                <div className="form-group">
                    <label>Contraseña Inicial</label>
                    <input type="text" name="password" className="input" placeholder="min. 6 caracteres" required minLength={6} />
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" onClick={onCancel} className="btn btn-glass">Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={isPending}>
                    {isPending ? 'Creando...' : <><Save size={18} /> Guardar Empleado</>}
                </button>
            </div>
        </form>
    );
}
