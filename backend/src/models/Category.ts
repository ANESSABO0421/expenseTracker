import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense';
  userId?: mongoose.Types.ObjectId; // null if it's a default category
}

const CategorySchema: Schema = new Schema({
  name: { type: String, required: true },
  icon: { type: String, required: true },
  color: { type: String, required: true },
  type: { type: String, enum: ['income', 'expense'], required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

export default mongoose.model<ICategory>('Category', CategorySchema);
