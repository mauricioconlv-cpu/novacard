import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';

export default async function OnboardingLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/');
    }

    // If already completed, redirect to dashboard
    const { data: profile } = await supabase
        .from('users')
        .select('onboarding_completed')
        .eq('id', user.id)
        .single();

    if (profile?.onboarding_completed) {
        redirect('/dashboard');
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-color)', color: 'var(--text-primary)' }}>
            {children}
        </div>
    );
}
