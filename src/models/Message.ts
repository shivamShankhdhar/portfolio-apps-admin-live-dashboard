import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  name: string;
  email: string;
  message: string;
  createdAt: Date;
  read: boolean;
}

const MessageSchema = new Schema<IMessage>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);
