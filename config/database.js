const { Sequelize } = require('sequelize');
require('dotenv').config();

let sequelize;

// Check if using DATABASE_URL (for cloud PostgreSQL)
if (process.env.DATABASE_URL) {
    // For cloud PostgreSQL (ElephantSQL, Supabase, Render, etc.)
    sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        protocol: 'postgres',
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false // For development only
            }
        },
        logging: false, // Set to console.log to see SQL queries
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    });
} else {
    // For local PostgreSQL
    sequelize = new Sequelize(
        process.env.DB_NAME,
        process.env.DB_USER,
        process.env.DB_PASSWORD,
        {
            host: process.env.DB_HOST,
            port: process.env.DB_PORT || 5432,
            dialect: 'postgres',
            logging: false,
            pool: {
                max: 5,
                min: 0,
                acquire: 30000,
                idle: 10000
            }
        }
    );
}

// Test database connection
const testConnection = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ PostgreSQL connection established successfully.');
        console.log(`📊 Database: ${sequelize.config.database}`);
        return true;
    } catch (error) {
        console.error('❌ Unable to connect to PostgreSQL database:', error.message);
        console.log('\nTroubleshooting tips:');
        console.log('1. Make sure PostgreSQL is installed and running');
        console.log('2. Check database credentials in .env file');
        console.log('3. Verify database exists (run: createdb portfolio_db)');
        console.log('4. Check if PostgreSQL is accepting connections');
        return false;
    }
};

module.exports = { sequelize, testConnection };