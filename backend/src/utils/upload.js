import multer from "multer";
import path from "path";
import { v4 as uuid } from "uuid";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "uploads";
const MAX_FILE_SIZE_BYTES = Number(
  process.env.MAX_FILE_SIZE_BYTES || 10 * 1024 * 1024
);

// Default to assignment-approved types if env not provided
const defaultAllowedMimeTypes = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "text/csv",
];

const envMimeTypes = (process.env.ALLOWED_MIME_TYPES || "")
  .split(",")
  .map((t) => t.trim())
  .filter(Boolean);

const allowedMimeTypes =
  envMimeTypes.length > 0 ? envMimeTypes : defaultAllowedMimeTypes;

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname);
    cb(null, `${uuid()}${extension}`);
  },
});

function fileFilter(_req, file, cb) {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Unsupported file type"));
  }
}

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
  },
});


