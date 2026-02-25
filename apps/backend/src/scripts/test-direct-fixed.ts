import postgres from 'postgres';

// Gunakan domain yang benar: supabase.co (bukan subpabase.co)
const url = "postgresql://postgres.gatwxytvyuekexveakzo:[PASSWORD]@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres";

console.log('Testing connection...');

try {
    const sql = postgres(url, {
        idle_timeout: 20,
        max_lifetime: 60 * 30,
    });

    const result = await sql`SELECT 1 as test, current_database() as db, current_user as user`;
    console.log('✅ Connection successful!', result);

    process.exit(0);
} catch (err: any) {
    console.error('❌ Connection failed:', err.message);
    console.error('URL used:', url.replace(/:[^:@]*@/, ':****@'));
    process.exit(1);
}