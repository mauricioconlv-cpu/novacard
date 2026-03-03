import styles from '../dashboard.module.css';
import { Bell } from 'lucide-react';

interface HeaderProps {
    userName: string;
    role: string;
}

export default function DashboardHeader({ userName, role }: HeaderProps) {
    const getInitials = (name: string) => {
        return name.slice(0, 2).toUpperCase();
    };

    return (
        <header className={styles.header}>
            <div className={styles.headerInfo}>
                {/* We can put breadcrumbs or current page title here later */}
                <h2>Panel de Control</h2>
            </div>

            <div className={styles.userProfile}>
                <button className="btn btn-glass" style={{ padding: '0.5rem', borderRadius: '50%' }}>
                    <Bell size={20} />
                </button>

                <div className={styles.avatar}>
                    {getInitials(userName)}
                </div>

                <div className={styles.userDetails}>
                    <span className={styles.userName}>{userName}</span>
                    <span className={styles.userRole}>{role === 'admin' ? 'Administrador' : 'Empleado'}</span>
                </div>
            </div>
        </header>
    );
}
