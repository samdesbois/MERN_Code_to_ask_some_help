const mongoose = require('mongoose');
const config = require('config');
const db = config.get('mongoURI');

const connectDB = async () => {
  try {
    await mongoose.connect(db, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
      useCreateIndex: true
    });
    console.log('Connected to database...');
  } catch (err) {
    console.error(err.message);
  }
};

module.exports = connectDB;
