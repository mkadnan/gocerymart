const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser'); // ✅ added
dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', // frontend origin
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // ✅ added

// Serve uploaded images as static files
app.use('/uploads', express.static('uploads'));

// MongoDB Connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/grocerymarts');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

connectDB();

// ---------------- Routes ----------------
const { router: authRoutes } = require('./routes/auth'); // ✅ import router correctly
const otpRoutes = require('./routes/otp'); // ✅ add OTP routes
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const cartRoutes = require('./routes/cartRoutes');
const userRoutes = require('./routes/users'); // ✅ add users routes
const categoryRoutes = require('./routes/categories'); // ✅ add categories routes
const returnRoutes = require('./routes/returns'); // ✅ add returns routes

app.use('/api/auth', authRoutes);
app.use('/api/otp', otpRoutes); // ✅ mount OTP routes
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/users', userRoutes); // ✅ mount users routes
app.use('/api/categories', categoryRoutes); // ✅ mount categories routes
app.use('/api/returns', returnRoutes); // ✅ mount returns routes

// ---------------- Error Handling ----------------
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// ---------------- 404 Handler ----------------
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, 'localhost', () => {
  console.log(`Server running on port ${PORT}`);
});
