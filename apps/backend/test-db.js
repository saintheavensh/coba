const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');

// Pakai URL dari .env
const client = postgres(process.env.DATABASE_URL);
client`SELECT current_database() as db`.then(result => {
    console.log('TERNYATA database-nya:', result[0].db);
    process.exit();
}).catch(err => {
    console.error('Error:', err.message);
});
