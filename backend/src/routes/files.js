import express from "express";
import fs from "fs";
import path from "path";
import { v4 as uuid } from "uuid";
import { authRequired } from "../middleware/auth.js";
import { upload } from "../utils/upload.js";
import File from "../models/File.js";
import User from "../models/User.js";

const router = express.Router();

router.post(
  "/",
  authRequired,
  (req, res, next) => {
    upload.array("files", 10)(req, res, (err) => {
      if (!err) return next();

      if (err.message === "Unsupported file type") {
        return res.status(400).json({
          message: "Only PDF, PNG, JPEG and CSV files are allowed",
        });
      }
      if (err.code === "LIMIT_FILE_SIZE") {
        return res
          .status(400)
          .json({ message: "File too large (max 10MB per file)" });
      }
      return res.status(400).json({ message: "Upload failed" });
    });
  },
  async (req, res) => {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }
    try {
      const created = await Promise.all(
        req.files.map((file) =>
          File.create({
            owner: req.user.id,
            originalName: file.originalname,
            storedName: file.filename,
            path: file.path,
            size: file.size,
            mimeType: file.mimetype,
          })
        )
      );
      return res.status(201).json({ files: created });
    } catch (err) {
      return res.status(500).json({ message: "Upload failed" });
    }
  }
);

router.get("/", authRequired, async (req, res) => {
  const userId = req.user.id;
  const files = await File.find({
    $or: [{ owner: userId }, { sharedWith: userId }],
  }).sort({ createdAt: -1 });
  return res.json({ files });
});

router.post("/:id/share", authRequired, async (req, res) => {
  const { userEmails } = req.body;
  if (!Array.isArray(userEmails) || userEmails.length === 0) {
    return res.status(400).json({ message: "userEmails must be non-empty" });
  }
  const file = await File.findById(req.params.id);
  if (!file || file.owner.toString() !== req.user.id) {
    return res.status(404).json({ message: "File not found or not owner" });
  }
  const users = await User.find({ email: { $in: userEmails } });
  const ids = users.map((u) => u.id);
  file.sharedWith = Array.from(new Set([...file.sharedWith, ...ids]));
  await file.save();
  return res.json({ file });
});

router.post("/:id/link", authRequired, async (req, res) => {
  const { expiresInHours = 24 } = req.body;
  const file = await File.findById(req.params.id);
  if (!file || file.owner.toString() !== req.user.id) {
    return res.status(404).json({ message: "File not found or not owner" });
  }
  const token = uuid();
  const expiresAt = new Date(Date.now() + Number(expiresInHours) * 3600 * 1000);
  file.linkToken = token;
  file.linkExpiresAt = expiresAt;
  await file.save();
  return res.json({
    linkToken: token,
    expiresAt,
    shareUrl: `/api/files/${file.id}/download?link=${token}`,
  });
});

router.get("/:id/download", authRequired, async (req, res) => {
  const { id } = req.params;
  const { link } = req.query;
  const file = await File.findById(id);
  if (!file) {
    return res.status(404).json({ message: "File not found" });
  }
  const userId = req.user.id;
  const isOwner = file.owner.toString() === userId;
  const isShared = file.sharedWith.some((u) => u.toString() === userId);
  const linkAllowed =
    link &&
    file.linkToken === link &&
    file.linkExpiresAt &&
    file.linkExpiresAt > new Date();

  if (!(isOwner || isShared || linkAllowed)) {
    return res.status(403).json({ message: "Not authorized" });
  }

  if (!fs.existsSync(file.path)) {
    return res.status(404).json({ message: "File missing on server" });
  }

  return res.download(path.resolve(file.path), file.originalName);
});

router.delete("/:id", authRequired, async (req, res) => {
  const file = await File.findById(req.params.id);
  if (!file || file.owner.toString() !== req.user.id) {
    return res.status(404).json({ message: "File not found or not owner" });
  }
  fs.rmSync(file.path, { force: true });
  await file.deleteOne();
  return res.json({ message: "Deleted" });
});

export default router;


