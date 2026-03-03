'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'

export async function login(formData: FormData) {
    const supabase = await createClient()

    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    }

    const { error } = await supabase.auth.signInWithPassword(data)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}

export async function register(formData: FormData) {
    const supabase = await createClient()

    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
        options: {
            data: {
                full_name: formData.get('fullName') as string,
                role: (formData.get('role') as string) || 'employee'
            }
        }
    }

    const { error } = await supabase.auth.signUp(data)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}

export async function completeOnboarding(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'No autorizado' }
    }

    const company_name = formData.get('company_name') as string;
    // Realistically you'd handle file upload to storage here for avatar

    let newCompanyId = null;
    if (company_name) {
        const { data: newCompany, error: companyError } = await supabase
            .from('companies')
            .insert({ admin_id: user.id, name: company_name })
            .select('id')
            .single();

        if (companyError) {
            console.error("Error creating company:", companyError);
        } else if (newCompany) {
            newCompanyId = newCompany.id;
        }
    }

    const { error } = await supabase
        .from('users')
        .update({
            company_name: company_name || null,
            company_id: newCompanyId,
            onboarding_completed: true
        })
        .eq('id', user.id)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}

export async function inviteEmployee(formData: FormData) {
    const supabase = await createClient();

    // Validate we are logged in
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: 'No autenticado' };
    }

    // Check if the current user is an Admin
    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') {
        return { error: 'No tienes permisos de administrador.' };
    }

    const email = formData.get('email') as string;
    const fullName = formData.get('fullName') as string;
    const role = formData.get('role') as string;

    if (!email || !fullName) {
        return { error: 'Nombre de completo y correo son obligatorios' };
    }

    // Usually you would use the Supabase Admin API to create a user and send an invite link.
    // supabase.auth.admin.inviteUserByEmail(email)
    // However, the standard `supabase/ssr` client doesn't expose the admin api easily unless using a service_role key.
    // For demonstration, we will just simulate a user creation by returning success, 
    // BUT the real flow requires the user to go to the Register page themselves or we use the Admin API.
    // Let's create an "invite" record or just return a message saying "Instruct the user to register with this email".

    return {
        success: true,
        message: `Por razones de seguridad sin una API Key de Admin, pídele a ${fullName} que se registre usando ${email}.`
    };
}

export async function logout() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    revalidatePath('/', 'layout')
    redirect('/')
}
