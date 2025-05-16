const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const sessionRoutes = require('./routes/sessionRoutes');
const redis = require('redis');
const cookieParser = require('cookie-parser');
const { Sequelize } = require('sequelize');

dotenv.config();
const app = express();
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Redis Client
const client = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});
client.connect();
app.locals.redisClient = client;

// Sequelize for PostgreSQL
const sequelize = new Sequelize(process.env.DB_URL || 'postgres://postgres:843329@localhost:5432/qrlogin');
(async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected');
    const User = require('./models/User')(sequelize);
    await sequelize.sync();

    // Seed test users
    const testUsers = [
      { email: 'alice@example.com', name: 'Alice' },
      { email: 'bob@example.com', name: 'Bob' },
      { email: 'charlie@example.com', name: 'Charlie' }
    ];
    for (const user of testUsers) {
      await User.findOrCreate({ where: { email: user.email }, defaults: user });
    }
    console.log('Test users seeded');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
})();
app.locals.db = sequelize;

// Routes
app.use('/api/session', sessionRoutes);

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
