import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { Plus, CreditCard, Settings, Edit, Eye, Share2, Trash2 } from 'lucide-react';
import Link from 'next/link';
import styles from '../home.module.css';
import ShareButton from '../../components/ShareButton';

export default async function CardsListPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Get user profile
    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();

    // Fetch actual user cards (and employees cards if admin)
    let query = supabase.from('cards').select('*');

    if (profile?.role === 'admin') {
        // Admin sees their own cards plus cards of users where admin_id is them
        const { data: employees } = await supabase.from('users').select('id').eq('admin_id', user.id);
        const employeeIds = employees?.map(e => e.id) || [];
        const allTargetIds = [user.id, ...employeeIds];

        query = query.in('user_id', allTargetIds);
    } else {
        query = query.eq('user_id', user.id);
    }

    const { data: cards, error } = await query.order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching cards:", error);
    }

    return (
        <div className={`animate-fade-in ${styles.homeContainer}`}>
            <div className={styles.banner} style={{ background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.1), rgba(249, 115, 22, 0.1))', padding: '1.5rem 2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <div>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Mis Tarjetas Digitales</h2>
                        <p style={{ color: 'var(--text-secondary)' }}>Administra, diseña y comparte tus múltiples facetas profesionales.</p>
                    </div>

                    {/* Let's pass 'new' to editor, and the specific ID handles creating it in the DB or we can create it in a Server Action first. For now, link to /editor/new */}
                    <Link href="/dashboard/cards/editor/new" className="btn btn-primary">
                        <Plus size={18} /> Crear Tarjeta
                    </Link>
                </div>
            </div>

            <div className={styles.cardsPlayground} style={{ marginTop: '2rem' }}>
                {(!cards || cards.length === 0) ? (
                    <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CreditCard size={40} color="var(--color-blue)" />
                        </div>
                        <h3>Aún no tienes tarjetas</h3>
                        <p style={{ color: 'var(--text-secondary)' }}>Crea tu primera tarjeta de presentación digital para empezar a compartir tus datos.</p>
                        <Link href="/dashboard/cards/editor/new" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                            Crear mi primera tarjeta
                        </Link>
                    </div>
                ) : (
                    <div className={styles.cardsGrid}>
                        {cards.map(card => (
                            <div key={card.id} className={styles.physicalCard}>
                                <div className={styles.cardHeader} style={{ background: card.design_config?.color || 'var(--color-blue)' }}></div>
                                <div className={styles.cardBody}>
                                    <h4>{card.title || 'Sin Título'}</h4>
                                    <p className={styles.cardSubtitle}>{card.layout === 'standard' ? 'Estándar' : 'Premium'}</p>

                                    <div style={{ display: 'flex', gap: '10px', marginTop: '1.5rem' }}>
                                        <Link href={`/dashboard/cards/editor/${card.id}`} className="btn btn-glass" style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem' }}>
                                            <Edit size={14} /> Editar
                                        </Link>
                                        <ShareButton slug={card.slug} cardTitle={card.title} />
                                    </div>
                                </div>
                                <div className={styles.cardFooter} style={{ justifyContent: 'space-between' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: card.is_active ? 'var(--color-green)' : 'var(--text-secondary)' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: card.is_active ? 'var(--color-green)' : 'gray' }}></div>
                                        {card.is_active ? 'Activa' : 'Inactiva'}
                                    </span>
                                    <button style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
