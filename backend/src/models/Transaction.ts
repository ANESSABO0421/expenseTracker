import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
  amount: number;
  description: string;
  date: Date;
  categoryId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  isSubscription?: boolean;
}

const TransactionSchema: Schema = new Schema({
  amount: { type: Number, required: true },
  description: { type: String, required: true },
  date: { type: Date, default: Date.now },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isSubscription: { type: Boolean, default: false }
});

export default mongoose.model<ITransaction>('Transaction', TransactionSchema);
