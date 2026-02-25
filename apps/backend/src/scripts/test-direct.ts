import postgres from 'postgres';

const url = process.env.DIRECT_URL!;
console.log('Testing connection to:', url.replace(/:[^:@]*@/, ':****@'));

try {
    const sql = postgres(url);
    const result = await sql`SELECT 1 as test`;
    console.log('✅ Connection successful!', result);
    process.exit(0);
} catch (err: any) {
    console.error('❌ Connection failed:', err.message);
    process.exit(1);
}