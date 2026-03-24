const { sequelize } = require('./database');
const Contact = require('../models/Contact');

const initDatabase = async () => {
    try {
        console.log('🔄 Initializing PostgreSQL database...');
        
        // Sync all models
        // force: true will drop tables if they exist (use with caution!)
        // alter: true will update schema without dropping data
        await sequelize.sync({ alter: true });
        
        console.log('✅ Database synchronized successfully');
        
        // Create indexes for better performance
        const queryInterface = sequelize.getQueryInterface();
        
        // Check and create indexes if they don't exist
        await queryInterface.addIndex('contacts', ['email'])
            .catch(() => console.log('Index on email already exists'));
        
        await queryInterface.addIndex('contacts', ['status'])
            .catch(() => console.log('Index on status already exists'));
        
        await queryInterface.addIndex('contacts', ['created_at'])
            .catch(() => console.log('Index on created_at already exists'));
        
        console.log('✅ Database setup completed');
        
        // Get some stats
        const count = await Contact.count();
        console.log(`📊 Total contacts in database: ${count}`);
        
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        process.exit(1);
    }
};

// Run initialization
initDatabase();

module.exports = initDatabase;