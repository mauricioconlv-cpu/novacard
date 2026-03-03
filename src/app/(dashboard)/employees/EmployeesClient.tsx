'use client';

import { useState } from 'react';
import { Plus, Trash2, Edit, X } from 'lucide-react';
import { inviteEmployee } from '@/app/actions';
import styles from './employees.module.css';

export default function EmployeesClient({ initialEmployees, error }: { initialEmployees: any[], error: string | null }) {
    const [employees, setEmployees] = useState(initialEmployees);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [inviteResult, setInviteResult] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    // In a real app we would call a Server Action to add/invite an employee

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-4.5rem', marginBottom: '2rem' }}>
                <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                    <Plus size={18} /> Nuevo Empleado
                </button>
            </div>

            <div className={`glass-panel ${styles.tableContainer}`}>
                {error ? (
                    <p className={styles.emptyState}>Ocurrió un error al cargar los empleados: {error}</p>
                ) : employees && employees.length > 0 ? (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Email</th>
                                <th>Rol</th>
                                <th>Estado Onboarding</th>
                                <th>Empresa</th>
                                <th align="right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {employees.map((emp) => (
                                <tr key={emp.id} className={styles.tableRow}>
                                    <td>
                                        <div className={styles.nameCell}>
                                            <div className={styles.avatarMini}>
                                                {emp.full_name?.charAt(0) || emp.email.charAt(0).toUpperCase()}
                                            </div>
                                            <span style={{ fontWeight: 500 }}>{emp.full_name || 'Sin Nombre'}</span>
                                        </div>
                                    </td>
                                    <td className={styles.textMuted}>{emp.email}</td>
                                    <td>
                                        <span className={`${styles.roleBadge} ${emp.role === 'admin' ? styles.roleAdmin : styles.roleEmployee}`}>
                                            {emp.role === 'admin' ? 'Administrador' : 'Empleado'}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`${styles.statusBadge} ${emp.onboarding_completed ? styles.statusActive : styles.statusPending}`}>
                                            {emp.onboarding_completed ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </td>
                                    <td className={styles.textMuted}>{emp.company_name || '-'}</td>
                                    <td align="right">
                                        <div className={styles.actionsCell}>
                                            <button className={styles.actionBtn} title="Editar">
                                                <Edit size={16} />
                                            </button>
                                            <button className={styles.actionBtn} style={{ color: '#ff4b4b' }} title="Eliminar">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className={styles.emptyState}>
                        <p>Aún no hay empleados registrados en tu organización.</p>
                    </div>
                )}
            </div>

            {/* Modal for new employee */}
            {isModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={`glass-panel animate-fade-in ${styles.modalContent}`}>
                        <div className={styles.modalHeader}>
                            <h2>Añadir Nuevo Empleado</h2>
                            <button className={styles.closeBtn} onClick={() => setIsModalOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className={styles.modalBody}>
                            <p style={{ marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--color-orange)' }}>
                                Nota: Por seguridad en Supabase, la invitación real por correo requiere configuración avanzada.
                                Puedes dar de alta usuarios o proporcionarles la liga pública de registro. Si el registro está cerrado,
                                se usará la API de Admin para crearlos directamente.
                            </p>

                            <form action={async (formData) => {
                                setIsSubmitting(true);
                                const result = await inviteEmployee(formData);
                                setIsSubmitting(false);
                                if (result?.error) {
                                    setInviteResult({ type: 'error', message: result.error });
                                } else if (result?.success) {
                                    setInviteResult({ type: 'success', message: result.message! });
                                    setTimeout(() => setIsModalOpen(false), 4000);
                                }
                            }}>
                                <div className="input-group" style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Nombre Completo</label>
                                    <input type="text" name="fullName" className="input-base" placeholder="Ej. Juan Pérez" required />
                                </div>

                                <div className="input-group" style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Correo Electrónico</label>
                                    <input type="email" name="email" className="input-base" placeholder="empleado@empresa.com" required />
                                </div>

                                <div className="input-group" style={{ marginBottom: '2rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Rol en la plataforma</label>
                                    <select name="role" className="input-base" style={{ appearance: 'auto' }}>
                                        <option value="employee">Empleado (Acceso a su tarjeta y onboarding)</option>
                                        <option value="admin">Administrador (Acceso total)</option>
                                    </select>
                                </div>

                                {inviteResult && (
                                    <div style={{
                                        padding: '1rem',
                                        marginBottom: '1rem',
                                        borderRadius: '8px',
                                        backgroundColor: inviteResult.type === 'error' ? 'rgba(255, 75, 75, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                        color: inviteResult.type === 'error' ? '#ff4b4b' : 'var(--color-green)',
                                        border: `1px solid ${inviteResult.type === 'error' ? 'rgba(255, 75, 75, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`
                                    }}>
                                        {inviteResult.message}
                                    </div>
                                )}

                                <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={isSubmitting}>
                                    {isSubmitting ? 'Enviando Invitación...' : 'Crear Empleado'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
