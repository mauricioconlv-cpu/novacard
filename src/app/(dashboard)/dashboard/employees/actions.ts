'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

export async function createEmployee(prevState: any, formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const fullName = formData.get('full_name') as string;
    const workSchedule = formData.get('work_schedule') as string;

    if (!email || !password || !fullName || !workSchedule) {
        return { error: 'Todos los campos son obligatorios' };
    }

    try {
        // Create an admin client bypassing RLS specifically for auth operations
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

        const adminAuthClient = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });

        // Create user in Auth using Admin API
        const { data, error } = await adminAuthClient.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true, // auto-confirm since admin acts on their behalf
            user_metadata: {
                full_name: fullName,
                role: 'employee',
                work_schedule: workSchedule
            }
        });

        if (error) {
            console.error('Error creating user auth:', error);
            // Translate common Supabase Auth errors
            if (error.message.includes('already exists')) {
                return { error: 'Ya existe un usuario con este correo electrónico.' };
            }
            if (error.message.includes('Password should be')) {
                return { error: 'La contraseña es muy débil. Usa al menos 6 caracteres.' };
            }
            return { error: 'Error al crear el empleado en el sistema de autenticación.' };
        }

        revalidatePath('/dashboard/employees');
        return { success: true };

    } catch (e: any) {
        return { error: e.message || 'Error inesperado al crear el empleado.' };
    }
}
