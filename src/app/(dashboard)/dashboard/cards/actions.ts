'use server'

import { createClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';

export async function saveCard(cardData: any, fieldsData: any[]) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'No autorizado' };
    }

    const isNew = cardData.id === 'new';

    // Generate a default slug if empty
    let finalSlug = cardData.slug;
    if (!finalSlug) {
        const baseSlug = cardData.title ? cardData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'tarjeta';
        finalSlug = `${baseSlug}-${Math.floor(Math.random() * 1000)}`;
    }

    const cardPayload = {
        user_id: user.id,
        title: cardData.title,
        slug: finalSlug,
        design_config: cardData.design_config,
        layout: cardData.layout || 'standard',
        is_active: cardData.is_active !== undefined ? cardData.is_active : true,
    };

    let savedCardId = cardData.id;

    // 1. Upsert Card
    if (isNew) {
        const { data: newCard, error: cardError } = await supabase
            .from('cards')
            .insert([cardPayload])
            .select('id')
            .single();

        if (cardError) return { error: cardError.message };
        savedCardId = newCard.id;
    } else {
        const { error: cardError } = await supabase
            .from('cards')
            .update(cardPayload)
            .eq('id', savedCardId)
            .eq('user_id', user.id); // Strict ownership check

        if (cardError) return { error: cardError.message };
    }

    // 2. Process Fields (Delete all and re-insert for exact state matching)
    if (!isNew) {
        const { error: deleteError } = await supabase
            .from('card_fields')
            .delete()
            .eq('card_id', savedCardId);
        if (deleteError) return { error: deleteError.message };
    }

    if (fieldsData && fieldsData.length > 0) {
        const fieldsToInsert = fieldsData.map((f, index) => ({
            card_id: savedCardId,
            type: f.type,
            label: f.label,
            value: f.value,
            icon: f.icon || f.type,
            sort_order: index
        }));

        const { error: fieldsError } = await supabase
            .from('card_fields')
            .insert(fieldsToInsert);

        if (fieldsError) return { error: fieldsError.message };
    }

    revalidatePath('/dashboard/cards');
    return { success: true, cardId: savedCardId };
}
