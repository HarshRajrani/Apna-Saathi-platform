const mongoose = require('mongoose');

/**
 * Sanitizes MongoDB URI to handle special characters (like unencoded '@') in passwords.
 * Example: mongodb+srv://user:Pass@123@cluster.mongodb.net/db -> mongodb+srv://user:Pass%40123@cluster.mongodb.net/db
 */
const sanitizeMongoUri = (rawUri) => {
  if (!rawUri || typeof rawUri !== 'string') return rawUri;

  const trimmed = rawUri.trim();
  const srvRegex = /^(mongodb(?:\+srv)?:\/\/)(.+)$/;
  const match = trimmed.match(srvRegex);
  if (!match) return trimmed;

  const [, protocol, body] = match;
  const lastAt = body.lastIndexOf('@');
  if (lastAt === -1) return trimmed;

  const creds = body.slice(0, lastAt);
  const hostAndRest = body.slice(lastAt + 1);

  const colonIndex = creds.indexOf(':');
  if (colonIndex === -1) return trimmed;

  const username = creds.slice(0, colonIndex);
  const rawPassword = creds.slice(colonIndex + 1);

  let cleanPassword = rawPassword;
  try {
    cleanPassword = encodeURIComponent(decodeURIComponent(rawPassword));
  } catch {
    cleanPassword = encodeURIComponent(rawPassword);
  }

  return `${protocol}${username}:${cleanPassword}@${hostAndRest}`;
};

let isConnecting = false;

const connectDB = async () => {
  if (isConnecting || mongoose.connection.readyState === 1) return;
  isConnecting = true;

  const rawUri = process.env.MONGO_URI;

  if (!rawUri) {
    console.error('❌ MONGO_URI is not defined! Please set MONGO_URI in your environment variables.');
    isConnecting = false;
    return;
  }

  const cleanUri = sanitizeMongoUri(rawUri);

  try {
    const conn = await mongoose.connect(cleanUri, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    isConnecting = false;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    isConnecting = false;
    // Retry connection without terminating the web server so Render health checks continue to function
    console.log('🔄 Reconnecting to MongoDB in 5 seconds...');
    setTimeout(connectDB, 5000);
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected. Attempting to reconnect...');
  setTimeout(connectDB, 5000);
});

module.exports = connectDB;
