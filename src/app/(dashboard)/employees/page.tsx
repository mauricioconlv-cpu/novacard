import { createClient } from '@/lib/supabase-server';
import styles from './employees.module.css';
import EmployeesClient from './EmployeesClient';

export default async function EmployeesPage() {
    const supabase = await createClient();

    // Fetch all users (employees). In a real production app, you might want to paginate
    // or limit this, and ensure RLS policies only let admins see this list.
    const { data: employees, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

    return (
        <div className={`animate-fade-in ${styles.container}`}>
            <div className={styles.header}>
                <div>
                    <h1 className="text-gradient">Gestión de Empleados</h1>
                    <p className={styles.subtitle}>Añade, edita y administra el registro de tu personal.</p>
                </div>
                {/* Create button and table are now inside the client component for state management */}
            </div>

            <EmployeesClient initialEmployees={employees || []} error={error?.message || null} />
        </div>
    );
}
