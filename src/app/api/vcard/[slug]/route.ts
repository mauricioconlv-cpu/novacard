import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
    const resolvedParams = await params;
    const { slug } = resolvedParams;

    const supabase = await createClient(); // Anon client
    const adminSupabase = await createAdminClient(); // Admin client to read user profile

    // 1. Fetch Card
    const { data: card, error: cardError } = await supabase
        .from('cards')
        .select('id, user_id, title, is_active')
        .eq('slug', slug)
        .single();

    if (cardError || !card || !card.is_active) {
        return new NextResponse('Card not found', { status: 404 });
    }

    // 2. Fetch User Profile
    const { data: profile } = await adminSupabase
        .from('users')
        .select('full_name, company_name, email')
        .eq('id', card.user_id)
        .single();

    if (!profile) {
        return new NextResponse('User not found', { status: 404 });
    }

    // 3. Fetch Card Fields
    const { data: fields } = await supabase
        .from('card_fields')
        .select('type, label, value')
        .eq('card_id', card.id);

    // 4. Construct vCard String
    // vCard Format Specification (v3.0)
    let vcf = `BEGIN:VCARD\r\nVERSION:3.0\r\n`;
    vcf += `N:;${profile.full_name};;;\r\n`;
    vcf += `FN:${profile.full_name}\r\n`;
    if (profile.company_name) {
        vcf += `ORG:${profile.company_name}\r\n`;
    }
    if (profile.email) {
        vcf += `EMAIL;type=INTERNET;type=WORK:${profile.email}\r\n`;
    }

    // Add Dynamic Fields
    if (fields) {
        fields.forEach(field => {
            switch (field.type) {
                case 'phone':
                    vcf += `TEL;type=CELL:${field.value}\r\n`;
                    break;
                case 'email':
                    // Prevent duplicate if it matches the profile email exactly
                    if (field.value !== profile.email) {
                        vcf += `EMAIL;type=INTERNET;type=HOME:${field.value}\r\n`;
                    }
                    break;
                case 'link':
                case 'linkedin':
                case 'instagram':
                    let url = field.value;
                    if (!url.startsWith('http')) url = `https://${url}`;
                    vcf += `URL:${url}\r\n`;
                    break;
                case 'address':
                    vcf += `ADR;type=WORK:;;${field.value};;;;\r\n`;
                    break;
                case 'pdf':
                    vcf += `NOTE:PDF Profile: ${field.value}\r\n`;
                    break;
            }
        });
    }

    vcf += `END:VCARD\r\n`;

    // 5. Track 'vcard_download' interaction
    supabase.from('interactions').insert([{
        card_id: card.id,
        interaction_type: 'vcard_download'
    }]).then();

    const cleanName = profile.full_name?.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'contacto';

    // 6. Return response with correct headers for downloading
    return new NextResponse(vcf, {
        headers: {
            'Content-Type': 'text/vcard; charset=utf-8',
            'Content-Disposition': `attachment; filename="${cleanName}.vcf"`,
        },
    });
}
