import mongoose, { Schema, Document } from "mongoose";

export interface IList extends Document {
  title: string;
  position: number;
  board: mongoose.Types.ObjectId;
}

const listSchema = new Schema<IList>({
  title: { type: String, required: true },
  position: { type: Number, required: true },
  board: { type: Schema.Types.ObjectId, ref: "Board", required: true },
});

export default mongoose.model<IList>("List", listSchema);