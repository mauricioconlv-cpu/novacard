'use client'

import { Share2 } from 'lucide-react';

interface PublicShareButtonProps {
    slug: string;
    cardTitle: string;
    className?: string; // To receive the secondaryAction styles
}

export default function PublicShareButton({ slug, cardTitle, className }: PublicShareButtonProps) {
    const handleShare = async () => {
        const url = typeof window !== 'undefined' ? window.location.href : `https://novacard.app/p/${slug}`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: cardTitle,
                    text: `Te invito a ver la tarjeta digital de ${cardTitle}`,
                    url: url,
                });
            } catch (error) {
                console.log('User cancelled share or share failed', error);
            }
        } else {
            // Fallback for browsers without navigator.share
            navigator.clipboard.writeText(url);
            alert('¡Enlace de la tarjeta copiado al portapapeles!');
        }
    };

    return (
        <button className={className} onClick={handleShare} title="Compartir Tarjeta: Enviar enlace">
            <Share2 size={18} />
        </button>
    );
}
