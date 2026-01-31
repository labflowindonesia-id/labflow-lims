import 'dotenv/config';
const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const { migrate } = require('drizzle-orm/postgres-js/migrator');

async function runMigration() {
    console.log('Starting migration...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL?.substring(0, 50) + '...');

    const migrationClient = postgres(process.env.DATABASE_URL, { max: 1 });
    const db = drizzle(migrationClient);

    console.log('Running migrations from ./src/db/migrations...');

    try {
        await migrate(db, { migrationsFolder: './src/db/migrations' });
        console.log('Migration completed successfully!');
    } catch (error) {
        console.error('Migration failed:', error);
        throw error;
    } finally {
        await migrationClient.end();
    }
}

runMigration().catch(console.error);
