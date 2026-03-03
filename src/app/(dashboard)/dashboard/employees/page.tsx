import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { Users, Plus, UserPlus, CreditCard, Clock } from 'lucide-react';
import styles from '../home.module.css';
import EmployeeFormWrapper from './EmployeeFormWrapper';

export default async function EmployeesPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Verify admin role
    const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'admin') {
        redirect('/dashboard');
    }

    // Fetch all employees and companies
    const { data: companies } = await supabase
        .from('companies')
        .select('id, name')
        .eq('admin_id', user.id);

    const { data: employees } = await supabase
        .from('users')
        .select(`
            id,
            full_name,
            email,
            work_schedule,
            created_at,
            cards ( id, title, is_active )
        `)
        .eq('role', 'employee')
        .order('created_at', { ascending: false });

    return (
        <div className={`animate-fade-in ${styles.homeContainer}`}>
            <div className={styles.banner} style={{ background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.1), rgba(56, 189, 248, 0.1))', padding: '1.5rem 2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ background: 'rgba(14, 165, 233, 0.2)', padding: '1rem', borderRadius: '16px' }}>
                        <Users size={32} color="var(--color-blue)" />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.5rem', margin: '0 0 0.2rem 0' }}>Gestión de Empleados</h2>
                        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                            Da de alta a tu equipo de trabajo, asigna sus jornadas laborales y gestiona sus tarjetas digitales.
                        </p>
                    </div>
                </div>
            </div>

            <div style={{ marginTop: '2rem' }}>
                <EmployeeFormWrapper />
            </div>

            <div className={styles.recentActivity} style={{ marginTop: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Users size={20} className="text-gradient" />
                        <h3 style={{ margin: 0 }}>Plantilla Activa</h3>
                    </div>
                </div>

                <div className="glass-panel" style={{ overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <tr>
                                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Empleado</th>
                                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Correo Electrónico</th>
                                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Jornada Asignada</th>
                                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Tarjetas</th>
                            </tr>
                        </thead>
                        <tbody>
                            {employees && employees.length > 0 ? (
                                employees.map((emp: any) => (
                                    <tr key={emp.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-blue), var(--color-magenta))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '0.85rem' }}>
                                                    {emp.full_name?.charAt(0) || 'E'}
                                                </div>
                                                <div style={{ fontWeight: 600 }}>{emp.full_name || 'Sin nombre'}</div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                                            {emp.email}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <Clock size={16} color="var(--color-blue)" />
                                                <span style={{ fontWeight: 500 }}>{emp.work_schedule || '8h'}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <CreditCard size={16} color={emp.cards?.length > 0 ? 'var(--color-green)' : 'var(--text-secondary)'} />
                                                {emp.cards?.length > 0 ? (
                                                    <span style={{ color: 'var(--color-green)', fontWeight: 600 }}>{emp.cards.length} tarjeta(s)</span>
                                                ) : (
                                                    <span style={{ color: 'var(--text-secondary)' }}>0 tarjetas</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                        Aún no has registrado empleados. Haz clic en "Agregar Empleado" para comenzar.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
