import mongoose, { Schema, Document } from "mongoose";

export interface IComment extends Document {
  content: string;
  card: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  createdAt: Date;
}

const commentSchema = new Schema<IComment>({
  content: { type: String, required: true },
  card: { type: Schema.Types.ObjectId, ref: "Card", required: true },
  author: { type: Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IComment>("Comment", commentSchema);