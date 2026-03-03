// CommonJS format to avoid module errors in this quick test script
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

try {
    const envData = fs.readFileSync('.env.local', 'utf8');
    const getEnv = (key) => {
        const match = envData.match(new RegExp(`${key}=(.*)`));
        return match ? match[1].trim() : null;
    };

    const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL');
    const supabaseKey = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseKey) {
        throw new Error('Missing Supabase credentials in .env.local');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    async function checkUsers() {
        console.log("Checking Users table with ANON Key (Testing RLS)...");
        const { data, error } = await supabase.from('users').select('*');
        console.log("PUBLIC.USERS Data:", data);
        console.log("Error:", error);
    }

    checkUsers();

} catch (err) {
    console.error("Error running script:", err);
}
