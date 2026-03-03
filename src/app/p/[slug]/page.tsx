import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { notFound } from 'next/navigation';
import { Phone, Mail, Globe, MapPin, Linkedin, Instagram, FileText, Download } from 'lucide-react';
import styles from './public.module.css';
import PublicShareButton from './PublicShareButton';

export const dynamic = 'force-dynamic'; // Ensure it fetches fresh data

const renderIcon = (type: string) => {
    switch (type) {
        case 'phone': return <Phone size={20} />;
        case 'email': return <Mail size={20} />;
        case 'linkedin': return <Linkedin size={20} />;
        case 'instagram': return <Instagram size={20} />;
        case 'pdf': return <FileText size={20} />;
        case 'address': return <MapPin size={20} />;
        default: return <Globe size={20} />;
    }
}

export default async function PublicCardPage({ params }: { params: Promise<{ slug: string }> }) {
    const resolvedParams = await params;
    const { slug } = resolvedParams;

    const supabase = await createClient(); // Anon client for reading public cards
    const adminSupabase = await createAdminClient(); // Admin client for reading restricted user profiles

    // 1. Fetch the Card (Allowed by RLS `is_active = true`)
    const { data: card, error: cardError } = await supabase
        .from('cards')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

    if (cardError || !card) {
        notFound();
    }

    // 2. Fetch the Card Fields (Allowed by RLS if card is active)
    const { data: fields } = await supabase
        .from('card_fields')
        .select('*')
        .eq('card_id', card.id)
        .order('sort_order', { ascending: true });

    // 3. Fetch the User Profile (Bypassing RLS with admin client to get the name/company)
    const { data: profile } = await adminSupabase
        .from('users')
        .select('full_name, company_name')
        .eq('id', card.user_id)
        .single();

    // 4. Log Interaction (Fire and forget viewing analytics)
    // Supabase RLS is configured to allow anyone to insert into interactions
    supabase.from('interactions').insert([{
        card_id: card.id,
        interaction_type: 'page_view'
    }]).then();

    const getHref = (type: string, value: string) => {
        if (type === 'phone') return `tel:${value.replace(/[^0-9+]/g, '')}`;
        if (type === 'email') return `mailto:${value}`;
        if (!value.startsWith('http')) return `https://${value}`;
        return value;
    };

    return (
        <div className={styles.publicContainer} style={{ background: card.design_config?.gradient || '#0f172a' }}>
            {/* The main card wrapper that mirrors the preview mockup */}
            <div className={styles.cardWrapper}>

                <div className={styles.cardHeader}>
                    {card.design_config?.logoUrl && (
                        <div className={styles.logoContainer}>
                            <img
                                src={card.design_config.logoUrl}
                                alt="Logo"
                                className={styles.companyLogo}
                            />
                        </div>
                    )}

                    <div className={styles.profileImgContainer}>
                        {card.design_config?.profileUrl ? (
                            <img src={card.design_config.profileUrl} alt={profile?.full_name || 'Perfil'} className={styles.profileImg} />
                        ) : (
                            <span className={styles.profileInitials}>{profile?.full_name?.substring(0, 2).toUpperCase() || 'NC'}</span>
                        )}
                    </div>
                </div>

                <div className={styles.cardBody}>
                    <h1 className={styles.profileName}>{profile?.full_name || 'Usuario NovaCard'}</h1>
                    <p className={styles.companyName}>{profile?.company_name || 'Compañía'}</p>

                    <div className={styles.actionButtons}>
                        <a href={`/api/vcard/${slug}`} className={styles.primaryAction} style={{ background: card.design_config?.primaryColor || 'var(--color-blue)', textDecoration: 'none' }}>
                            <Download size={18} /> Guardar Contacto
                        </a>
                        <PublicShareButton slug={slug} cardTitle={card.title} className={styles.secondaryAction} />
                    </div>

                    <div className={styles.fieldsContainer}>
                        {fields?.map((field) => (
                            <a
                                key={field.id}
                                href={getHref(field.type, field.value)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.fieldItem}
                                style={field.type === 'pdf' ? { background: card.design_config?.primaryColor || 'var(--color-blue)', color: 'white' } : {}}
                            >
                                <div className={styles.fieldIcon}>
                                    {renderIcon(field.type)}
                                </div>
                                <span className={styles.fieldLabel}>{field.label || 'Enlace'}</span>
                            </a>
                        ))}
                    </div>
                </div>

                <div className={styles.cardFooter}>
                    <span>Powered by</span>
                    <strong>NovaCard</strong>
                </div>
            </div>
        </div>
    );
}
