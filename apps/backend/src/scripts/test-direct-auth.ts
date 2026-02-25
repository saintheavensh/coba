import postgres from 'postgres';

const PASSWORD = "8iu3N4TYAZUrnETA"; // Ganti dengan password asli
const PROJECT_REF = "gatwxytvyuekexveakzo";
const HOST = "aws-1-ap-southeast-1.pooler.supabase.com";

async function testAuth() {
    // Test 1: Username dengan project ref (format pooler)
    const url1 = `postgresql://postgres.${PROJECT_REF}:${PASSWORD}@${HOST}:5432/postgres`;
    console.log('Test 1: With project ref in username');
    try {
        const sql = postgres(url1, { idle_timeout: 5 });
        await sql`SELECT 1`;
        console.log('✅ Test 1 SUCCESS!');
    } catch (err: any) {
        console.log('❌ Test 1 failed:', err.message);
    }

    // Test 2: Username tanpa project ref (format direct)
    const url2 = `postgresql://postgres:${PASSWORD}@${HOST}:5432/postgres`;
    console.log('\nTest 2: Without project ref in username');
    try {
        const sql = postgres(url2, { idle_timeout: 5 });
        await sql`SELECT 1`;
        console.log('✅ Test 2 SUCCESS!');
    } catch (err: any) {
        console.log('❌ Test 2 failed:', err.message);
    }

    // Test 3: Pakai port 6543 (pooler) tapi untuk direct
    const url3 = `postgresql://postgres.${PROJECT_REF}:${PASSWORD}@${HOST}:6543/postgres`;
    console.log('\nTest 3: Port 6543 with project ref');
    try {
        const sql = postgres(url3, { idle_timeout: 5 });
        await sql`SELECT 1`;
        console.log('✅ Test 3 SUCCESS!');
    } catch (err: any) {
        console.log('❌ Test 3 failed:', err.message);
    }
}

testAuth();