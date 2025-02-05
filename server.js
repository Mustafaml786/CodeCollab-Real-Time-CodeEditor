const express = require('express');
const app = express();
const http = require('http');
const {Server} = require('socket.io');
const ACTIONS = require('./src/actions/Actions');
const cors = require('cors');
const mongoose = require('mongoose');
const Code = require('./src/models/Code');
require('dotenv').config();

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
    console.error('MONGODB_URI is not defined in environment variables');
    process.exit(1);
}

// Hide sensitive info in logs
console.log('Attempting MongoDB connection...');

mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('MongoDB Connected Successfully');
    })
    .catch(err => {
        // Hide connection string from error logs
        const sanitizedError = err.message.replace(MONGODB_URI, '[MONGODB_URI]');
        console.log('MongoDB Connection Error:', sanitizedError);
    });

// Middleware
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

const userSocketMap = {};

function getAllConnectedClients(roomId) {
    return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map((socketId) => {
        return {
            socketId,
            username: userSocketMap[socketId],
        };
    });
}

// Routes for saving and loading code
app.post('/api/save-code', async (req, res) => {
    try {
        const { title, code, language, roomId } = req.body;
        console.log('Saving code:', { title, language, roomId });
        
        const newCode = new Code({
            title,
            code,
            language,
            roomId
        });
        const savedCode = await newCode.save();
        res.status(201).json(savedCode);
    } catch (error) {
        console.error('Save error:', error);
        res.status(500).json({ message: 'Error saving code', error });
    }
});

app.get('/api/get-saved-codes/:roomId', async (req, res) => {
    try {
        const codes = await Code.find({ roomId: req.params.roomId })
            .sort({ createdAt: -1 });
        res.json(codes);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching saved codes', error });
    }
});

// Add this route after your other routes
app.get('/api/test-db', async (req, res) => {
    try {
        const count = await Code.countDocuments();
        res.json({ message: 'Database connected', count });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error });
    }
});

// Add this route to check database status
app.get('/api/db-status', async (req, res) => {
    try {
        // List all collections
        const collections = await mongoose.connection.db.listCollections().toArray();
        // Count documents in the codes collection
        const count = await Code.countDocuments();
        
        res.json({
            database: mongoose.connection.db.databaseName,
            collections: collections.map(c => c.name),
            codesCount: count,
            status: 'Connected'
        });
    } catch (error) {
        console.error('DB Status Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Basic route for testing
app.get('/', (req, res) => {
    res.json({ message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

// Handle 404
app.use((req, res) => {
    res.status(404).json({ message: 'Not Found' });
});

io.on('connection', (socket) => {
    console.log('socket connected', socket.id);

    socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
        userSocketMap[socket.id] = username;
        socket.join(roomId);
        
        const clients = getAllConnectedClients(roomId);
        clients.forEach(({ socketId }) => {
            io.to(socketId).emit(ACTIONS.JOINED, {
                clients,
                username,
                socketId: socket.id,
            });
        });
    });

    socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
        socket.to(roomId).emit(ACTIONS.CODE_CHANGE, { code });
    });

    socket.on(ACTIONS.SYNC_CODE, ({ socketId, code }) => {
        io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code });
    });

    socket.on('disconnecting', () => {
        const rooms = [...socket.rooms];
        rooms.forEach((roomId) => {
            socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
                socketId: socket.id,
                username: userSocketMap[socket.id],
            });
        });
        delete userSocketMap[socket.id];
        socket.leave();
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Backend server listening on port ${PORT}`);
    console.log(`Socket.IO server is ready for connections`);
});