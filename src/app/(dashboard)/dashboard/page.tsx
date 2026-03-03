import { createClient } from '@/lib/supabase-server';
import { Plus, BarChart2, Users, Download, Eye, CreditCard, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import styles from './home.module.css';

export default async function DashboardHome() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data: profile } = await supabase
        .from('users')
        .select('role, full_name, email')
        .eq('id', user?.id)
        .single();

    const userName = profile?.full_name || user?.email || 'Usuario';
    const isAdmin = profile?.role === 'admin';

    // 1. Fetch user's cards
    const { data: cards } = await supabase
        .from('cards')
        .select('id')
        .eq('user_id', user?.id);

    const cardIds = cards?.map(c => c.id) || [];

    // 2. Fetch Analytics (if they have cards)
    let totalViews = 0;
    let totalSaves = 0;
    let totalScans = 0;

    if (cardIds.length > 0) {
        const { data: interactions } = await supabase
            .from('interactions')
            .select('interaction_type')
            .in('card_id', cardIds);

        if (interactions) {
            totalViews = interactions.filter(i => i.interaction_type === 'page_view').length;
            totalSaves = interactions.filter(i => i.interaction_type === 'vcard_download').length;
            totalScans = interactions.filter(i => i.interaction_type === 'qr_scan').length;
        }
    }

    return (
        <div className={`animate-fade-in ${styles.homeContainer}`}>
            {/* Minimal Welcome Banner */}
            <div className={styles.banner} style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <h2 style={{ fontSize: '1.8rem', margin: 0 }}>Hola, {userName} 👋</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', margin: 0 }}>
                        Bienvenido a tu panel de control de NovaCard.
                    </p>
                </div>
                <div className={styles.bannerRight}>
                    <Link href="/dashboard/cards/editor/new" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}>
                        <Plus size={20} /> Crear Tarjeta
                    </Link>
                </div>
            </div>

            {/* Analytics Dashboard */}
            <div style={{ marginTop: '2rem' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <BarChart2 size={20} className="text-gradient" /> Rendimiento Global
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>

                    <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Vistas de Perfil</span>
                            <div style={{ background: 'rgba(14, 165, 233, 0.2)', padding: '0.5rem', borderRadius: '8px' }}>
                                <Eye size={20} color="var(--color-blue)" />
                            </div>
                        </div>
                        <span style={{ fontSize: '2.5rem', fontWeight: 700 }}>{totalViews}</span>
                    </div>

                    <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Contactos Guardados</span>
                            <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '0.5rem', borderRadius: '8px' }}>
                                <Download size={20} color="var(--color-green)" />
                            </div>
                        </div>
                        <span style={{ fontSize: '2.5rem', fontWeight: 700 }}>{totalSaves}</span>
                    </div>

                    <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Escaneos QR</span>
                            <div style={{ background: 'rgba(249, 115, 22, 0.2)', padding: '0.5rem', borderRadius: '8px' }}>
                                <Users size={20} color="var(--color-orange)" />
                            </div>
                        </div>
                        <span style={{ fontSize: '2.5rem', fontWeight: 700 }}>{totalScans}</span>
                    </div>

                </div>
            </div>

            {/* Quick Actions / Widgets Area */}
            <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>

                {/* Admin Widget */}
                {isAdmin && (
                    <div className="glass-panel" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, rgba(82, 82, 91, 0.4), rgba(39, 39, 42, 0.4))' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Users size={18} /> Módulo Administrativo
                            </h4>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                            Supervisa la asistencia de tu equipo mediante los registros de escaneo de Códigos QR, y gestiona accesos.
                        </p>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <Link href="/dashboard/attendance" className="btn btn-primary" style={{ flex: 1, padding: '0.5rem', justifyContent: 'center' }}>
                                Ver Asistencias
                            </Link>
                            <Link href="/dashboard/employees" className="btn btn-glass" style={{ flex: 1, padding: '0.5rem', justifyContent: 'center' }}>
                                Gestionar Personal
                            </Link>
                        </div>
                    </div>
                )}

                {/* Cards Shortcut */}
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <CreditCard size={18} /> Tus Tarjetas Activas
                        </h4>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                        Tus tarjetas digitales son la cara de tu negocio. Edita el diseño, actualiza links o cambia tu foto aquí.
                    </p>
                    <Link href="/dashboard/cards" className="btn btn-glass" style={{ width: '100%', padding: '0.5rem', justifyContent: 'center', display: 'flex', gap: '0.5rem' }}>
                        Ir al Gestor de Tarjetas <ChevronRight size={16} />
                    </Link>
                </div>

            </div>
        </div>
    );
}
