import multer from 'multer';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const tempDirectory = fileURLToPath(
  new URL('../../public/temp/', import.meta.url),
);
fs.mkdirSync(tempDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, tempDirectory),
  filename: (_req, file, callback) => {
    const uniqueName = `${randomUUID()}${path.extname(file.originalname)}`;
    callback(null, uniqueName);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
});
