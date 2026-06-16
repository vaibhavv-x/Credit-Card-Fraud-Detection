import mongoose from 'mongoose';

const TransactionSchema = new mongoose.Schema({
  TransactionID: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  Time: {
    type: Number,
    required: true
  },
  Amount: {
    type: Number,
    required: true,
    index: true
  },
  // PCA dimensions V1 - V28
  ...Array.from({ length: 28 }, (_, i) => `V${i + 1}`).reduce((acc, v) => {
    acc[v] = { type: Number, required: true };
    return acc;
  }, {}),
  Merchant: {
    type: String,
    required: true
  },
  Category: {
    type: String,
    required: true
  },
  Cardholder: {
    type: String,
    required: true
  },
  Class: {
    type: Number,
    required: true,
    enum: [0, 1],
    index: true
  }
}, {
  timestamps: true
});

export default mongoose.model('Transaction', TransactionSchema);
