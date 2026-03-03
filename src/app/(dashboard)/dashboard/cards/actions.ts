'use server'

import { createClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';

export async function saveCard(cardData: any, fieldsData: any[], targetUserId?: string, targetCompanyId?: string) {
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

    // Determine card owner logic
    let finalUserId = user.id;

    if (targetUserId && targetUserId !== user.id) {
        // Only admins can assign cards to others
        const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
        if (profile?.role === 'admin') {
            finalUserId = targetUserId;

            // If a company was selected, assign it permanently to the user (only if they don't have one)
            if (targetCompanyId) {
                // Ensure the user belongs to this admin before updating
                const { data: targetUser } = await supabase.from('users').select('company_id').eq('id', targetUserId).eq('admin_id', user.id).single();
                if (targetUser && !targetUser.company_id) {
                    await supabase.from('users').update({ company_id: targetCompanyId }).eq('id', targetUserId);
                }
            }
        }
    }

    const cardPayload = {
        user_id: finalUserId,
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
        // Admin can edit other's cards, so we just check on save permissions if needed. 
        // For simplicity we allow the update if it's the owner OR if the current user is an admin
        const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
        const isOwnerOrAdmin = profile?.role === 'admin' ? true : cardPayload.user_id === user.id;

        if (!isOwnerOrAdmin) {
            return { error: 'No autorizado para editar esta tarjeta.' };
        }

        const { error: cardError } = await supabase
            .from('cards')
            .update(cardPayload)
            .eq('id', savedCardId);

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
