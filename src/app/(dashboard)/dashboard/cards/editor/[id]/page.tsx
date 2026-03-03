import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import CardEditorClient from './CardEditorClient';

export default async function CardEditorPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/');
    }

    const isNew = id === 'new';
    let initialCard = null;
    let initialFields = [];

    // Also get user profile to set default names for new cards
    const { data: profile } = await supabase
        .from('users')
        .select('full_name, company_name, role')
        .eq('id', user.id)
        .single();

    if (!isNew) {
        const { data: card, error } = await supabase
            .from('cards')
            .select('*')
            .eq('id', id)
            .eq('user_id', user.id) // Security check
            .single();

        if (error || !card) {
            redirect('/dashboard/cards');
        }
        initialCard = card;

        const { data: fields } = await supabase
            .from('card_fields')
            .select('*')
            .eq('card_id', card.id)
            .order('sort_order', { ascending: true });

        initialFields = fields || [];
    } else {
        // Defaults for a new card
        initialCard = {
            id: 'new',
            title: profile?.full_name || 'Mi Tarjeta Digital',
            slug: '',
            design_config: {
                theme: 'dark',
                primaryColor: 'var(--color-blue)',
                gradient: 'linear-gradient(135deg, #0ea5e9, #38bdf8)'
            },
            layout: 'modern',
            is_active: true
        };
        initialFields = [
        ];
    }

    let adminEmployees = null;
    let adminCompanies = null;

    if (profile?.role === 'admin') {
        // Fetch employees under this admin
        const { data: employees } = await supabase
            .from('users')
            .select('id, full_name, email, company_id')
            .eq('admin_id', user.id);
        adminEmployees = employees || [];

        // Fetch companies under this admin
        const { data: companies } = await supabase
            .from('companies')
            .select('id, name')
            .eq('admin_id', user.id);
        adminCompanies = companies || [];
    }

    return (
        <CardEditorClient
            initialCard={initialCard}
            initialFields={initialFields}
            userProfile={profile}
        />
    );
}
