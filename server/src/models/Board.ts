import mongoose, { Schema, Document } from "mongoose";

export interface IBoard extends Document {
  title: string;
  workspace: mongoose.Types.ObjectId;
  createdAt: Date;
}

const boardSchema = new Schema<IBoard>({
  title: { type: String, required: true },
  workspace: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IBoard>("Board", boardSchema);