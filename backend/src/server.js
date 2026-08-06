const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const transactionRoutes = require('./routes/transactionRoutes');
const authRoutes = require('./routes/authRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const insightRoutes = require('./routes/insightRoutes');
const scanReceiptRoute = require('./routes/scanReceiptRoute');
const chatRoute = require('./routes/chatRoute');
const goalRoutes = require('./routes/goalRoutes');
const achievementsRoutes = require('./routes/achievementsRoutes');
const { errorHandler } = require('./middleware/errorMiddleware');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Basic Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Backend is running!' });
});

// API Routes
app.use('/api/transactions', transactionRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/insights', insightRoutes);
app.use('/api/scan-receipt', scanReceiptRoute);
app.use('/api/chat', chatRoute);
app.use('/api/goals', goalRoutes);
app.use('/api/achievements', achievementsRoutes);

// Error Middleware
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
