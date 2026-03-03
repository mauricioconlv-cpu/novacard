'use client';

import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import EmployeeForm from './EmployeeForm';

export default function EmployeeFormWrapper() {
    const [showForm, setShowForm] = useState(false);

    if (showForm) {
        return <EmployeeForm onCancel={() => setShowForm(false)} />;
    }

    return (
        <button
            onClick={() => setShowForm(true)}
            className="btn btn-primary"
            style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}
        >
            <UserPlus size={18} /> Agregar Empleado
        </button>
    );
}
