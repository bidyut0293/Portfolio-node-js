const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Contact = sequelize.define('Contact', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'Name is required'
            },
            len: {
                args: [2, 100],
                msg: 'Name must be between 2 and 100 characters'
            }
        }
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            isEmail: {
                msg: 'Please enter a valid email address'
            },
            notEmpty: {
                msg: 'Email is required'
            }
        }
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'Message is required'
            },
            len: {
                args: [10, 5000],
                msg: 'Message must be between 10 and 5000 characters'
            }
        }
    },
    status: {
        type: DataTypes.ENUM('unread', 'read', 'replied', 'spam'),
        defaultValue: 'unread',
        allowNull: false
    },
    ipAddress: {
        type: DataTypes.INET,
        field: 'ip_address',
        allowNull: true
    },
    userAgent: {
        type: DataTypes.TEXT,
        field: 'user_agent',
        allowNull: true
    },
    repliedAt: {
        type: DataTypes.DATE,
        field: 'replied_at',
        allowNull: true
    },
    repliedBy: {
        type: DataTypes.STRING(100),
        field: 'replied_by',
        allowNull: true
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'contacts',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            fields: ['email']
        },
        {
            fields: ['status']
        },
        {
            fields: ['created_at']
        }
    ]
});

// Instance method to mark as read
Contact.prototype.markAsRead = async function() {
    this.status = 'read';
    await this.save();
};

// Instance method to mark as replied
Contact.prototype.markAsReplied = async function(repliedBy) {
    this.status = 'replied';
    this.repliedAt = new Date();
    this.repliedBy = repliedBy;
    await this.save();
};

// Static method to get statistics
Contact.getStats = async function() {
    const stats = await this.findAll({
        attributes: [
            'status',
            [sequelize.fn('COUNT', sequelize.col('status')), 'count']
        ],
        group: ['status']
    });
    
    const result = {};
    stats.forEach(stat => {
        result[stat.status] = parseInt(stat.dataValues.count);
    });
    
    const total = await this.count();
    result.total = total;
    
    return result;
};

module.exports = Contact;