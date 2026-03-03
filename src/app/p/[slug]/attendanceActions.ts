'use server'

import { createClient } from '@/lib/supabase-server';

export async function registerAttendance(employeeId: string, type: 'check_in' | 'check_out') {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'No autorizado. Por favor inicia sesión.' };
    }

    // Verify the connected user is an admin and manages the employee
    const { data: employee, error: empError } = await supabase
        .from('users')
        .select('admin_id')
        .eq('id', employeeId)
        .single();

    if (empError || !employee) {
        return { success: false, error: 'Empleado no encontrado.' };
    }

    if (employee.admin_id !== user.id) {
        return { success: false, error: 'No tienes permisos para registrar asistencia de este empleado.' };
    }

    // Insert the log
    const { error: insertError } = await supabase
        .from('attendance_logs')
        .insert([{
            employee_id: employeeId,
            admin_id: user.id,
            type: type
        }]);

    if (insertError) {
        return { success: false, error: insertError.message };
    }

    return { success: true };
}
