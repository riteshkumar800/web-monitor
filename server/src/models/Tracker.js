import mongoose from 'mongoose';

const historySchema = new mongoose.Schema({
  at: { type: Date, default: Date.now },
  value: String,          // price number as string or content hash/summary
  note: String            // e.g., "price-changed", "content-changed"
}, { _id: false });

const trackerSchema = new mongoose.Schema({
  url: { type: String, required: true },
  mode: { type: String, enum: ['price', 'content'], required: true },
  selector: { type: String },          // optional CSS selector to narrow area/price
  targetPrice: { type: Number },       // only if mode === 'price'
  lastValue: { type: String },         // price as "12345.67" or content hash
  lastCheckedAt: { type: Date },
  checkIntervalMins: { type: Number, default: 15 },
  active: { type: Boolean, default: true },
  notifyEmail: { type: String },
  usedBrowserLast: { type: String },   // 'http' or 'browser'
  error: { type: String },
  history: [historySchema],
}, { timestamps: true });

export default mongoose.model('Tracker', trackerSchema);
