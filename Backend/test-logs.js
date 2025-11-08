const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB connected successfully'))
    .catch(err => console.error('MongoDB connection error:', err));

// Import the Log model
const Log = require('./models/Log');

// Test function to fetch logs
async function testLogs() {
    try {
        console.log('Fetching logs...');
        const logs = await Log.find().populate('adminId', 'username email role').limit(5);
        console.log('Logs found:', logs.length);
        console.log('Sample logs:', JSON.stringify(logs, null, 2));

        console.log('Fetching log stats...');
        const stats = await Log.aggregate([
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);
        console.log('Stats:', JSON.stringify(stats, null, 2));
    } catch (error) {
        console.error('Error testing logs:', error);
    } finally {
        mongoose.connection.close();
    }
}

testLogs();