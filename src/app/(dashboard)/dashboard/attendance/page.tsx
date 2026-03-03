import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { BarChart2, Clock, MapPin, Calendar } from 'lucide-react';
import styles from '../home.module.css';

export default async function AttendancePage() {
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

    // Fetch attendance logs with user details
    const { data: rawLogs } = await supabase
        .from('attendance_logs')
        .select(`
            id,
            scan_timestamp,
            scanned_by_ip,
            scan_type,
            employee_user_id,
            users ( full_name, email, work_schedule )
        `)
        .order('scan_timestamp', { ascending: false })
        .limit(300);

    // Process logs into paired shifts
    const shifts: any[] = [];
    const pendingCheckOuts = new Map(); // employee_id -> check_out log

    if (rawLogs) {
        for (const rawLog of rawLogs) {
            const log = rawLog as any;
            const userObj = Array.isArray(log.users) ? log.users[0] : log.users;

            if (log.scan_type === 'check_out') {
                pendingCheckOuts.set(log.employee_user_id, log);
            } else if (log.scan_type === 'check_in') {
                const pairedOut = pendingCheckOuts.get(log.employee_user_id);

                const inTime = new Date(log.scan_timestamp).getTime();
                let durationHours: number | null = null;
                let isComplete = false;
                let expectedHours = 8;
                const scheduleRaw = userObj?.work_schedule || '8h';

                if (pairedOut) {
                    const outTime = new Date(pairedOut.scan_timestamp).getTime();
                    durationHours = (outTime - inTime) / (1000 * 60 * 60);

                    if (scheduleRaw.includes('h')) expectedHours = parseInt(scheduleRaw);
                    if (scheduleRaw === '24x24') expectedHours = 24;
                    if (scheduleRaw === '48x48') expectedHours = 48; // Assuming common format

                    isComplete = durationHours >= (expectedHours - 0.5); // 30 min grace period
                    pendingCheckOuts.delete(log.employee_user_id);
                }

                shifts.push({
                    id: log.id,
                    user: userObj,
                    check_in: log.scan_timestamp,
                    check_out: pairedOut ? pairedOut.scan_timestamp : null,
                    durationHours,
                    isComplete,
                    scheduleRaw,
                    status: pairedOut ? (isComplete ? 'Cumplido' : 'Incompleto') : 'En curso'
                });
            }
        }

        // Add orphaned check_outs (check_in was too far back or missing)
        for (const [empId, outLog] of pendingCheckOuts.entries()) {
            const outUserObj = Array.isArray(outLog.users) ? outLog.users[0] : outLog.users;
            shifts.push({
                id: outLog.id,
                user: outUserObj,
                check_in: null,
                check_out: outLog.scan_timestamp,
                durationHours: null,
                isComplete: false,
                scheduleRaw: outUserObj?.work_schedule || '8h',
                status: 'Falta Entrada'
            });
        }
    }

    // Sort shifts array chronologically by the latest event
    shifts.sort((a, b) => {
        const timeA = new Date(a.check_out || a.check_in).getTime();
        const timeB = new Date(b.check_out || b.check_in).getTime();
        return timeB - timeA;
    });

    return (
        <div className={`animate-fade-in ${styles.homeContainer}`}>
            <div className={styles.banner} style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(52, 211, 153, 0.1))', padding: '1.5rem 2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '1rem', borderRadius: '16px' }}>
                        <BarChart2 size={32} color="var(--color-green)" />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.5rem', margin: '0 0 0.2rem 0' }}>Reporte de Asistencia (Turnos)</h2>
                        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                            Monitor de Jornadas Laborales. El sistema empareja Entradas y Salidas automáticamente.
                        </p>
                    </div>
                </div>
            </div>

            <div className={styles.recentActivity} style={{ marginTop: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Clock size={20} className="text-gradient" />
                        <h3 style={{ margin: 0 }}>Turnos Recientes</h3>
                    </div>
                </div>

                <div className="glass-panel" style={{ overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <tr>
                                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Empleado(a)</th>
                                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Entrada</th>
                                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Salida</th>
                                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Horas / Jornada</th>
                                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Estatus</th>
                            </tr>
                        </thead>
                        <tbody>
                            {shifts.length > 0 ? (
                                shifts.map((shift: any) => (
                                    <tr key={shift.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontWeight: 600 }}>{shift.user?.full_name || 'Desconocido'}</div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{shift.user?.email}</div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            {shift.check_in ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <Calendar size={14} color="var(--color-blue)" />
                                                    {new Date(shift.check_in).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}
                                                </div>
                                            ) : <span style={{ color: 'var(--text-secondary)' }}>No registrada</span>}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            {shift.check_out ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <Calendar size={14} color="var(--color-magenta)" />
                                                    {new Date(shift.check_out).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}
                                                </div>
                                            ) : <span style={{ color: 'var(--text-secondary)' }}>Pendiente</span>}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            {shift.durationHours !== null ? (
                                                <div style={{ fontWeight: 600, color: shift.isComplete ? 'var(--color-green)' : 'var(--color-orange)' }}>
                                                    {shift.durationHours.toFixed(1)} hrs <span style={{ color: 'var(--text-secondary)', fontWeight: 400, fontSize: '0.85rem' }}>/ {shift.scheduleRaw}</span>
                                                </div>
                                            ) : (
                                                <span style={{ color: 'var(--text-secondary)' }}>-- / {shift.scheduleRaw}</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                background: shift.status === 'Cumplido' ? 'rgba(16, 185, 129, 0.2)' :
                                                    shift.status === 'En curso' ? 'rgba(14, 165, 233, 0.2)' :
                                                        'rgba(244, 63, 94, 0.2)', // Red for Incompleto / Falta
                                                color: shift.status === 'Cumplido' ? 'var(--color-green)' :
                                                    shift.status === 'En curso' ? 'var(--color-blue)' :
                                                        'var(--color-magenta)',
                                                padding: '0.3rem 0.8rem',
                                                borderRadius: '20px',
                                                fontSize: '0.85rem',
                                                fontWeight: 600
                                            }}>
                                                {shift.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                        No hay registros de asistencia todavía. Escanea un código QR para comenzar.
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
