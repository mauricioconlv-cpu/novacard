'use client'

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { QrCode, LayoutDashboard, Users, CreditCard, Contact, BarChart2, LogOut } from 'lucide-react';
import { logout } from '../../actions';
import styles from '../dashboard.module.css';

interface SidebarProps {
    role: string;
}

export default function DashboardSidebar({ role }: SidebarProps) {
    const pathname = usePathname();

    const navItems = [
        { name: 'Inicio', path: '/dashboard', icon: <LayoutDashboard size={20} className={styles.navIcon} /> },
        { name: 'Mis Tarjetas', path: '/dashboard/cards', icon: <CreditCard size={20} className={styles.navIcon} /> },
        { name: 'Contactos', path: '/dashboard/contacts', icon: <Contact size={20} className={styles.navIcon} /> },
        ...(role === 'admin' ? [
            { name: 'Empleados', path: '/dashboard/employees', icon: <Users size={20} className={styles.navIcon} /> },
            { name: 'Reporte Asistencia', path: '/dashboard/attendance', icon: <BarChart2 size={20} className={styles.navIcon} /> }
        ] : [])
    ];

    return (
        <aside className={styles.sidebar}>
            <div className={styles.logoArea}>
                <QrCode className={styles.logoIcon} size={28} />
                <span className="text-gradient">NovaCard</span>
            </div>

            <nav className={styles.navLinks}>
                {navItems.map((item) => (
                    <Link
                        key={item.path}
                        href={item.path}
                        className={`${styles.navLink} ${pathname === item.path ? styles.active : ''}`}
                    >
                        {item.icon}
                        {item.name}
                    </Link>
                ))}
            </nav>

            <div className={styles.sidebarFooter}>
                <form action={logout}>
                    <button type="submit" className={`btn btn-glass ${styles.logoutBtn}`}>
                        <LogOut size={18} />
                        Cerrar Sesión
                    </button>
                </form>
            </div>
        </aside>
    );
}
