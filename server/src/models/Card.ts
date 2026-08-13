import mongoose, { Schema, Document } from "mongoose";

export interface ICard extends Document {
  title: string;
  description?: string;
  dueDate?: Date;
  position: number;
  list: mongoose.Types.ObjectId;
  assignee?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const cardSchema = new Schema<ICard>({
  title: { type: String, required: true },
  description: { type: String },
  dueDate: { type: Date },
  position: { type: Number, required: true },
  list: { type: Schema.Types.ObjectId, ref: "List", required: true },
  assignee: { type: Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<ICard>("Card", cardSchema);