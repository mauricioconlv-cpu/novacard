'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, ArrowLeft, Image as ImageIcon, Plus, GripVertical, Trash2, Phone, Mail, Globe, MapPin, Linkedin, Instagram, FileText, Settings } from 'lucide-react';
import Link from 'next/link';
import { saveCard } from '../../actions';
import ImageUploader from '../../../../components/ImageUploader';
import styles from './editor.module.css';

// Type definitions based on our DB schema
type CardField = {
    id: string; // uuid in db, temp id in UI for uncreated
    type: string;
    label: string;
    value: string;
    icon: string;
};

type CardData = {
    id: string;
    title: string;
    slug: string;
    design_config: any;
    layout: string;
    is_active: boolean;
};

const THEME_COLORS = [
    { name: 'Ocean', value: 'linear-gradient(135deg, #0ea5e9, #38bdf8)' },
    { name: 'Sunset', value: 'linear-gradient(135deg, #f97316, #fb923c)' },
    { name: 'Emerald', value: 'linear-gradient(135deg, #10b981, #34d399)' },
    { name: 'Amethyst', value: 'linear-gradient(135deg, #8b5cf6, #a78bfa)' },
    { name: 'Rose', value: 'linear-gradient(135deg, #f43f5e, #fb7185)' },
    { name: 'Midnight', value: 'linear-gradient(135deg, #0f172a, #1e293b)' }, // minimal dark
];

const FIELD_TYPES = [
    { value: 'phone', label: 'Teléfono', icon: <Phone size={16} /> },
    { value: 'email', label: 'Email', icon: <Mail size={16} /> },
    { value: 'link', label: 'Sitio Web', icon: <Globe size={16} /> },
    { value: 'linkedin', label: 'LinkedIn', icon: <Linkedin size={16} /> },
    { value: 'instagram', label: 'Instagram', icon: <Instagram size={16} /> },
    { value: 'pdf', label: 'Documento PDF', icon: <FileText size={16} /> },
];

export default function CardEditorClient({ initialCard, initialFields, userProfile }: { initialCard: CardData, initialFields: CardField[], userProfile: any }) {
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);

    // State
    const [card, setCard] = useState<CardData>(initialCard);
    const [fields, setFields] = useState<CardField[]>(initialFields);

    // Handlers
    const handleAddBlankField = () => {
        setFields([...fields, { id: `temp-${Date.now()}`, type: 'link', label: 'Nuevo Enlace', value: '', icon: 'Globe' }]);
    };

    const updateField = (id: string, key: string, val: string) => {
        setFields(fields.map(f => f.id === id ? { ...f, [key]: val } : f));
    };

    const removeField = (id: string) => {
        setFields(fields.filter(f => f.id !== id));
    };

    const saveAction = async () => {
        if (!card.title) {
            alert('Por favor agrega un nombre interno a la tarjeta antes de guardar.');
            return;
        }

        setIsSaving(true);
        const result = await saveCard(card, fields);
        setIsSaving(false);

        if (result.error) {
            alert('Error al guardar: ' + result.error);
        } else {
            router.push('/dashboard/cards');
        }
    };

    // Helper for Live Preview Icon Render
    const renderPreviewIcon = (type: string) => {
        switch (type) {
            case 'phone': return <Phone size={20} />;
            case 'email': return <Mail size={20} />;
            case 'linkedin': return <Linkedin size={20} />;
            case 'instagram': return <Instagram size={20} />;
            case 'pdf': return <FileText size={20} />;
            default: return <Globe size={20} />;
        }
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Editor Header */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', background: 'rgba(15, 23, 42, 0.6)', padding: '1rem', borderRadius: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Link href="/dashboard/cards" className="btn btn-glass" style={{ padding: '0.5rem' }}>
                        <ArrowLeft size={20} />
                    </Link>
                    <h2 style={{ margin: 0, fontSize: '1.2rem' }}>{card.id === 'new' ? 'Crear Tarjeta' : 'Editar Tarjeta'}</h2>
                </div>
                <button className="btn btn-primary" onClick={saveAction} disabled={isSaving}>
                    <Save size={18} /> {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
            </header>

            <div className={styles.editorContainer}>

                {/* LEFT PANE: CONTROLS */}
                <div className={styles.controlsPane}>

                    {/* Basic Info */}
                    <div className={styles.editorSection}>
                        <div className={styles.sectionHeader}>
                            <Settings size={20} />
                            <h3>Configuración General</h3>
                        </div>
                        <div className={styles.formGroup}>
                            <label>Nombre de la Tarjeta (Interno)</label>
                            <input
                                className={styles.input}
                                value={card.title}
                                onChange={e => setCard({ ...card, title: e.target.value })}
                                placeholder="Ej: Tarjeta Personal, Tarjeta de Ventas..."
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>URL / Enlace Personalizado</label>
                            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <span style={{ padding: '0 1rem', color: 'var(--text-secondary)' }}>novacard.app/</span>
                                <input
                                    className={styles.input}
                                    style={{ border: 'none', background: 'transparent', flex: 1 }}
                                    value={card.slug}
                                    onChange={e => setCard({ ...card, slug: e.target.value })}
                                    placeholder="mauricio-lopez"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Branding / Images */}
                    <div className={styles.editorSection}>
                        <div className={styles.sectionHeader}>
                            <ImageIcon size={20} />
                            <h3>Personalización Visual</h3>
                        </div>
                        <div className={styles.formGroup}>
                            <label>Tema / Colores Base</label>
                            <div className={styles.colorOptions} style={{ marginBottom: '1rem' }}>
                                {THEME_COLORS.map(color => (
                                    <button
                                        key={color.name}
                                        className={`${styles.colorBtn} ${card.design_config?.gradient === color.value ? styles.active : ''}`}
                                        style={{ background: color.value }}
                                        title={color.name}
                                        onClick={() => setCard({
                                            ...card,
                                            design_config: { ...card.design_config, gradient: color.value, primaryColor: color.value.split(',')[1].trim() }
                                        })}
                                    />
                                ))}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Color Personalizado:</label>
                                <input
                                    type="color"
                                    value={card.design_config?.primaryColor?.startsWith('#') ? card.design_config.primaryColor : '#0ea5e9'}
                                    onChange={(e) => setCard({
                                        ...card,
                                        design_config: { ...card.design_config, gradient: e.target.value, primaryColor: e.target.value }
                                    })}
                                    style={{ width: '40px', height: '40px', padding: '0', border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'transparent' }}
                                />
                                <input
                                    className={styles.input}
                                    value={card.design_config?.primaryColor?.startsWith('#') ? card.design_config.primaryColor : ''}
                                    onChange={(e) => setCard({
                                        ...card,
                                        design_config: { ...card.design_config, gradient: e.target.value, primaryColor: e.target.value }
                                    })}
                                    placeholder="#HEX"
                                    style={{ width: '100px' }}
                                />
                            </div>
                        </div>

                        {/* Image Uploaders */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.5rem' }}>
                            <ImageUploader
                                bucket="profile-photos"
                                label="Foto de Perfil"
                                currentUrl={card.design_config?.profileUrl}
                                onUploadSuccess={(url: string) => setCard({ ...card, design_config: { ...card.design_config, profileUrl: url } })}
                            />
                            <ImageUploader
                                bucket="logos"
                                label="Logo de Empresa"
                                currentUrl={card.design_config?.logoUrl}
                                onUploadSuccess={(url: string) => setCard({ ...card, design_config: { ...card.design_config, logoUrl: url } })}
                            />
                        </div>
                    </div>

                    {/* Fields Management */}
                    <div className={styles.editorSection}>
                        <div className={styles.sectionHeader}>
                            <GripVertical size={20} />
                            <h3>Campos Dinámicos</h3>
                        </div>

                        <div>
                            {fields.map((field, idx) => (
                                <div key={field.id} className={styles.fieldItem}>
                                    <div className={styles.dragHandle}>
                                        <GripVertical size={16} />
                                    </div>
                                    <div className={styles.fieldContent}>
                                        <select
                                            className={styles.input}
                                            value={field.type}
                                            onChange={(e) => updateField(field.id, 'type', e.target.value)}
                                        >
                                            {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                        </select>
                                        <input
                                            className={styles.input}
                                            value={field.value}
                                            onChange={(e) => updateField(field.id, 'value', e.target.value)}
                                            placeholder={field.type === 'email' ? 'correo@ejemplo.com' : 'Valor o Enlace...'}
                                        />
                                    </div>
                                    <button onClick={() => removeField(field.id)} style={{ background: 'transparent', border: 'none', color: 'var(--color-magenta)', cursor: 'pointer', padding: '0.5rem' }}>
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <button className={styles.addFieldBtn} onClick={handleAddBlankField} style={{ marginTop: '1rem' }}>
                            <Plus size={18} /> Añadir Campo
                        </button>
                    </div>
                </div>

                {/* RIGHT PANE: LIVE PREVIEW */}
                <div className={styles.previewPane}>
                    <div className={styles.previewTopActions}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Vista Previa en Vivo</span>
                    </div>

                    <div className={styles.phoneMockup}>
                        <div className={styles.phoneNotch}></div>

                        <div className={styles.cardPreviewContent}>
                            {/* Card Header (Gradient Banner) */}
                            <div className={styles.previewHeader} style={{ background: card.design_config?.gradient }}>
                                {card.design_config?.logoUrl && (
                                    <div style={{ position: 'absolute', top: '15px', left: '0', width: '100%', display: 'flex', justifyContent: 'center' }}>
                                        <img
                                            src={card.design_config.logoUrl}
                                            alt="Logo"
                                            style={{ height: '45px', maxWidth: '140px', objectFit: 'contain', filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.3))' }}
                                        />
                                    </div>
                                )}
                                <div className={styles.previewProfileImg}>
                                    {card.design_config?.profileUrl ? (
                                        <img src={card.design_config.profileUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <span style={{ color: 'var(--text-secondary)', fontSize: '2rem' }}>{userProfile?.full_name?.substring(0, 2).toUpperCase() || 'MA'}</span>
                                    )}
                                </div>
                            </div>

                            <div className={styles.previewBody}>
                                <h1 className={styles.previewName}>{userProfile?.full_name || 'Tu Nombre'}</h1>
                                <p className={styles.previewCompany}>{userProfile?.company_name || 'Compañía'}</p>

                                <div className={styles.previewFields}>
                                    {fields.map((field, idx) => (
                                        <div key={idx} className={styles.previewBtn} style={field.type === 'pdf' ? { background: card.design_config?.primaryColor, color: 'white', border: 'none' } : {}}>
                                            {renderPreviewIcon(field.type)}
                                            {field.label || 'Enlace'}
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
