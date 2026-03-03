import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import DashboardSidebar from '@/app/(dashboard)/components/Sidebar';
import DashboardHeader from '@/app/(dashboard)/components/Header';
import styles from './dashboard.module.css';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/');
    }

    // Fetch complete user profile including role mapping
    const { data: profile, error } = await supabase
        .from('users')
        .select('role, full_name, email, onboarding_completed, company_name')
        .eq('id', user.id)
        .single();

    console.log("Dashboard Layout DB profile query for user:", user.id);
    console.log("DB Result:", profile, "Error:", error);

    // TEMPORARY FALLBACK IF RLS FAILS (e.g. Trigger didn't sync IDs properly)
    let userRole = profile?.role || 'employee';
    let userName = profile?.full_name || profile?.company_name || user.email;
    let isOnboarded = profile?.onboarding_completed;

    if (error && error.code === 'PGRST116') {
        // This means no rows returned (either it doesn't exist or RLS blocked it)
        // Let's create the profile row if it's missing!
        const { error: insertError } = await supabase.from('users').insert({
            id: user.id,
            email: user.email,
            full_name: user.email?.split('@')[0], // Fallback name
            role: 'admin', // Assume admin for first user setup rescue
            onboarding_completed: false
        });

        console.log("Attempted to rescue missing profile row:", insertError);

        if (!insertError) {
            // Force to onboarding
            isOnboarded = false;
            userRole = 'admin';
        } else {
            console.error("Failed to rescue profile row:", insertError);
            // Even if it failed, let's look up by email as a final fallback!
            const { data: emailProfile } = await supabase
                .from('users')
                .select('role, full_name, onboarding_completed, company_name')
                .eq('email', user.email)
                .single();

            if (emailProfile) {
                console.log("Rescued by EMAIL match:", emailProfile);
                userRole = emailProfile.role || 'employee';
                userName = emailProfile.full_name || emailProfile.company_name || user.email;
                isOnboarded = emailProfile.onboarding_completed;
            }
        }
    }

    if (isOnboarded === false) {
        redirect('/onboarding');
    }

    console.log("=== DASHBOARD ROLE RESOLUTION ===");
    console.log("1. Original DB Query Result:", profile);
    console.log("2. Fallback Email Result (if any applied):", userRole, userName);
    console.log("3. Final Resolved Role:", userRole);
    console.log("=================================");

    return (
        <div className={styles.dashboardContainer}>
            <DashboardSidebar role={userRole} />
            <div className={styles.mainContent}>
                <DashboardHeader userName={userName as string} role={userRole} />
                <main className={styles.pageContent}>
                    {children}
                </main>
            </div>
        </div>
    );
}
