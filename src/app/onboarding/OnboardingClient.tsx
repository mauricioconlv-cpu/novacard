'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, ArrowRight, QrCode } from 'lucide-react';
import styles from './onboarding.module.css';
import { completeOnboarding } from '../actions';
import ImageUploader from '../(dashboard)/components/ImageUploader';

const ADMIN_GOALS = [
    "Gestionar Empleados",
    "Control de Asistencia",
    "Control de Entradas/Salidas",
    "Control de Retardos",
    "Directorio Corporativo",
    "Analítica de interacciones"
];

const EMPLOYEE_GOALS = [
    "Aumentar la visibilidad de mi marca",
    "Intercambiar datos de contacto",
    "Mi tarjeta digital personal"
];

const GREETINGS = [
    { text: 'Hola', color: 'var(--color-green)', glow: 'var(--color-green-glow)' },
    { text: 'Hello', color: 'var(--color-blue)', glow: 'var(--color-blue-glow)' },
    { text: 'Bonjour', color: 'var(--color-orange)', glow: 'var(--color-orange-glow)' },
    { text: 'Ciao', color: 'var(--color-green)', glow: 'var(--color-green-glow)' },
    { text: 'Olá', color: 'var(--color-blue)', glow: 'var(--color-blue-glow)' },
    { text: 'Namaste', color: 'var(--color-orange)', glow: 'var(--color-orange-glow)' }
];

export default function OnboardingClient({ userRole = 'employee' }: { userRole?: string }) {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [greetingsIndices, setGreetingsIndices] = useState([0, 1]);
    const [avatarUrl, setAvatarUrl] = useState<string>('');

    const activeGoalsList = userRole === 'admin' ? ADMIN_GOALS : EMPLOYEE_GOALS;

    useEffect(() => {
        const interval = setInterval(() => {
            setGreetingsIndices(prev => [
                (prev[0] + 1) % GREETINGS.length,
                (prev[1] + 1) % GREETINGS.length
            ]);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const toggleGoal = (goal: string) => {
        if (selectedGoals.includes(goal)) {
            setSelectedGoals(selectedGoals.filter(g => g !== goal));
        } else {
            setSelectedGoals([...selectedGoals, goal]);
        }
    };

    const handleComplete = async (formData: FormData) => {
        setIsSubmitting(true);
        setError(null);

        // Add selected goals to form data
        formData.append('goals', JSON.stringify(selectedGoals));

        const result = await completeOnboarding(formData);
        if (result?.error) {
            setError(result.error);
            setIsSubmitting(false);
        }
    };

    return (
        <div className={styles.container}>
            {/* Left Area (Brand presentation) */}
            <div className={styles.leftPane}>
                <div className={styles.logoBadge}>
                    <QrCode size={40} className="text-gradient" />
                </div>
                <div className={styles.graphics}>
                    <div
                        className={`${styles.bubble} ${styles.bubbleTop}`}
                        style={{
                            color: GREETINGS[greetingsIndices[0]].color,
                            boxShadow: `0 0 40px ${GREETINGS[greetingsIndices[0]].glow}`
                        }}
                    >
                        {GREETINGS[greetingsIndices[0]].text}
                    </div>

                    <div
                        className={`${styles.bubble} ${styles.bubbleBottom}`}
                        style={{
                            color: GREETINGS[greetingsIndices[1]].color,
                            boxShadow: `0 0 50px ${GREETINGS[greetingsIndices[1]].glow}`
                        }}
                    >
                        {GREETINGS[greetingsIndices[1]].text}
                    </div>
                </div>
            </div>

            {/* Right Area (Form steps) */}
            <div className={styles.rightPane}>

                {step === 1 && (
                    <div className={`animate-fade-in ${styles.stepContent}`}>
                        <h1 className={styles.title}>Vamos a personalizar tu experiencia.</h1>
                        <p className={styles.subtitle}>¿Cuáles son tus principales objetivos?</p>
                        <p className={styles.hint}>Elige todas las que se aplican.</p>

                        <div className={styles.goalsGrid}>
                            {activeGoalsList.map((goal) => (
                                <button
                                    key={goal}
                                    onClick={() => toggleGoal(goal)}
                                    className={`${styles.goalBtn} ${selectedGoals.includes(goal) ? styles.goalBtnActive : ''}`}
                                >
                                    <span className={styles.plusIcon}>+</span> {goal}
                                </button>
                            ))}
                        </div>

                        <div className={styles.footerActions}>
                            <span className={styles.skip} onClick={() => setStep(2)}>Saltar</span>
                            <button
                                onClick={() => setStep(2)}
                                className={`btn btn-primary ${styles.continueBtn}`}
                                disabled={selectedGoals.length === 0}
                            >
                                Continúa
                            </button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <form action={handleComplete} className={`animate-fade-in ${styles.stepContent}`}>
                        <h1 className={styles.title} style={{ textAlign: 'center' }}>Haz que tu tarjeta destaque 📸</h1>
                        <p className={styles.subtitle} style={{ textAlign: 'center' }}>Añade una foto tuya y completa tu perfil</p>

                        <div style={{ marginTop: '2rem', maxWidth: '300px', margin: '2rem auto' }}>
                            <ImageUploader
                                bucket="profile-photos"
                                currentUrl={avatarUrl}
                                onUploadSuccess={(url) => setAvatarUrl(url)}
                                label="Foto de perfil (Recomendado)"
                            />
                            <input type="hidden" name="avatar_url" value={avatarUrl} />
                        </div>

                        <div className={styles.inputGroup} style={{ marginTop: '2rem' }}>
                            <label>Nombre de la Empresa</label>
                            <input type="text" name="company_name" className="input-base" placeholder="Ej. Tech Solutions S.A." required />
                        </div>

                        {error && <p style={{ color: 'red', marginTop: '1rem', fontSize: '0.9rem' }}>{error}</p>}

                        <div className={styles.footerActions} style={{ justifyContent: 'center', gap: '1rem', marginTop: '3rem' }}>
                            <span className={styles.skip} onClick={() => setStep(1)}>Atrás</span>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={`btn btn-primary ${styles.continueBtn}`}
                                style={{ width: '100%', maxWidth: '300px' }}
                            >
                                {isSubmitting ? 'Guardando...' : 'Completar y Continuar'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
