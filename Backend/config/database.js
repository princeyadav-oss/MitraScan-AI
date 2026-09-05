const mongoose = require('mongoose');
const { mongoUri, mongoDbName } = require('./env');

async function connectDatabase() {
  if (!mongoUri) {
    console.log('MONGODB_URI not set; using in-memory demo storage');
    return false;
  }
  try {
    await mongoose.connect(mongoUri, { dbName: mongoDbName, serverSelectionTimeoutMS: 10000 });
  } catch (error) {
    throw new Error(`MongoDB Atlas connection failed. Check the Atlas username/password, Network Access IP allowlist, and connection string. Details: ${error.message}`);
  }
  console.log('MongoDB connected');
  return true;
}

function isDatabaseConnected() {
  return mongoose.connection.readyState === 1;
}

module.exports = { connectDatabase, isDatabaseConnected };