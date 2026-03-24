const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const { sequelize, testConnection } = require('./config/database');
const Contact = require('./models/Contact');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Make current year available to all views
app.use((req, res, next) => {
    res.locals.currentYear = new Date().getFullYear();
    res.locals.currentPath = req.path;
    next();
});

// Database connection middleware
app.use(async (req, res, next) => {
    try {
        await sequelize.authenticate();
        next();
    } catch (error) {
        console.error('Database connection error:', error.message);
        if (req.path !== '/error') {
            return res.status(500).render('error', {
                title: 'Database Error',
                message: 'Unable to connect to PostgreSQL database. Please check your configuration.',
                error: error.message
            });
        }
        next();
    }
});

// Routes
app.get('/', (req, res) => {
    res.render('home', {
        title: 'Home - My Portfolio',
        activePage: 'home'
    });
});

app.get('/home', (req, res) => {
    res.render('home', {
        title: 'Home - My Portfolio',
        activePage: 'home'
    });
});

app.get('/about', (req, res) => {
    res.render('about', {
        title: 'About - My Portfolio',
        activePage: 'about'
    });
});

app.get('/contact', (req, res) => {
    res.render('contact', {
        title: 'Contact - My Portfolio',
        activePage: 'contact'
    });
});

// Handle contact form submission with PostgreSQL
app.post('/submit-contact', async (req, res) => {
    try {
        const { name, email, message } = req.body;

        // Validation
        if (!name || !email || !message) {
            return res.render('error', {
                title: 'Error',
                message: 'All fields are required. Please go back and fill out the complete form.',
                error: null
            });
        }

        // Get client information
        const ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
        const userAgent = req.headers['user-agent'];

        // Create new contact in database
        const contact = await Contact.create({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            message: message.trim(),
            ipAddress: ipAddress,
            userAgent: userAgent,
            status: 'unread'
        });

        console.log('✅ Contact saved to PostgreSQL:', {
            id: contact.id,
            name: contact.name,
            email: contact.email,
            createdAt: contact.createdAt
        });

        // Render success page
        res.render('success', {
            title: 'Message Sent Successfully',
            name: name,
            contactId: contact.id
        });
    } catch (error) {
        console.error('Error saving contact to PostgreSQL:', error);
        
        // Handle validation errors
        if (error.name === 'SequelizeValidationError') {
            const errors = error.errors.map(err => err.message).join(', ');
            return res.render('error', {
                title: 'Validation Error',
                message: errors,
                error: null
            });
        }
        
        // Generic error
        res.render('error', {
            title: 'Server Error',
            message: 'Sorry, there was an error processing your request. Please try again later.',
            error: error.message
        });
    }
});

// Admin route to view all messages
app.get('/admin/messages', async (req, res) => {
    try {
        const messages = await Contact.findAll({
            order: [['created_at', 'DESC']],
            limit: 100
        });
        
        const stats = await Contact.findAll({
            attributes: [
                'status',
                [sequelize.fn('COUNT', sequelize.col('status')), 'count']
            ],
            group: ['status']
        });
        
        const statsObj = {};
        stats.forEach(stat => {
            statsObj[stat.status] = parseInt(stat.dataValues.count);
        });
        statsObj.total = messages.length;
        
        res.render('admin', {
            title: 'Admin - Messages',
            messages: messages,
            stats: statsObj
        });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.render('error', {
            title: 'Error',
            message: 'Error fetching messages from database',
            error: error.message
        });
    }
});

// API endpoint to update message status
app.put('/api/messages/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        const message = await Contact.findByPk(id);
        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }
        
        message.status = status;
        await message.save();
        
        res.json({ success: true, message: 'Status updated' });
    } catch (error) {
        console.error('Error updating status:', error);
        res.status(500).json({ error: 'Failed to update status' });
    }
});

// Initialize database and start server
const startServer = async () => {
    try {
        // Test database connection
        const connected = await testConnection();
        if (!connected) {
            console.error('❌ Cannot start server without database connection');
            process.exit(1);
        }
        
        // Sync database models (create tables if they don't exist)
        await sequelize.sync({ alter: true });
        console.log('✅ Database models synchronized');
        
        // Start server
        app.listen(PORT, () => {
            console.log(`🚀 Server is running on http://localhost:${PORT}`);
            console.log(`📧 Contact form submissions will be stored in PostgreSQL`);
            console.log(`👨‍💻 Admin panel: http://localhost:${PORT}/admin/messages`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

startServer();