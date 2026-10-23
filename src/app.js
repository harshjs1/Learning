import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { ApiError } from './utils/ApiError.js';

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  }),
);

app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(express.static('public'));
app.use(cookieParser());

import userRoutes from './routes/user.routes.js';
app.use('/users', userRoutes);

app.use((error, _req, res, _next) => {
  const statusCode =
    error.statusCode ||
    (error.name === 'MulterError'
      ? 400
      : error.name === 'ValidationError'
        ? 400
        : error.code === 11000
          ? 409
          : 500);
  const message =
    error instanceof ApiError
      ? error.message
      : statusCode === 500
        ? 'Internal server error'
        : error.message;

  if (statusCode === 500) {
    console.error(error);
  }
  return res
    .status(statusCode)
    .json({ success: false, message, errors: error.errors || [] });
});

export { app };
