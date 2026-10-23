import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const verifyJWT = asyncHandler(async (req, res, next) => {
  const authorization = req.get('Authorization');
  const bearerToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  const token = req.cookies?.accessToken || bearerToken;

  if (!token) {
    throw new ApiError(401, 'Unauthorized request');
  }

  let decodedToken;
  try {
    decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  } catch {
    throw new ApiError(401, 'Invalid or expired access token');
  }

  const user = await User.findById(decodedToken.id).select(
    '-password -refreshToken',
  );
  if (!user) {
    throw new ApiError(401, 'Invalid access token');
  }

  req.user = user;
  return next();
});
