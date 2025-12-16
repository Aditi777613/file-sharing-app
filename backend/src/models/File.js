import mongoose from "mongoose";

const fileSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    originalName: { type: String, required: true },
    storedName: { type: String, required: true },
    path: { type: String, required: true },
    size: { type: Number, required: true },
    mimeType: { type: String, required: true },
    sharedWith: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    linkToken: { type: String },
    linkExpiresAt: { type: Date },
    uploadDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const File = mongoose.model("File", fileSchema);

export default File;



