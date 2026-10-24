import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
};

const generateAccessAndRefreshToken = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return { accessToken, refreshToken };
};

const registerUser = asyncHandler(async (req, res) => {
  const body = req.body ?? {};
  const { fullname = body.fullName, email, username, password } = body;
  if (
    ![fullname, email, username, password].every(
      (value) => typeof value === 'string' && value.trim(),
    )
  ) {
    throw new ApiError(
      400,
      'Full name, email, username, and password are required',
    );
  }

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedUsername = username.trim().toLowerCase();
  const existingUser = await User.findOne({
    $or: [{ username: normalizedUsername }, { email: normalizedEmail }],
  });
  if (existingUser) {
    throw new ApiError(409, 'User already exists');
  }

  const avatarFile = req.files?.avatar?.[0]?.path;
  const coverImageFile = req.files?.coverImages?.[0]?.path;
  if (!avatarFile || !coverImageFile) {
    throw new ApiError(400, 'Avatar and cover image are required');
  }

  const [avatar, coverImage] = await Promise.all([
    uploadOnCloudinary(avatarFile, 'avatars'),
    uploadOnCloudinary(coverImageFile, 'coverImages'),
  ]);
  if (!avatar?.secure_url || !coverImage?.secure_url) {
    throw new ApiError(502, 'Unable to upload profile images');
  }

  const user = await User.create({
    fullname: fullname.trim(),
    email: normalizedEmail,
    username: normalizedUsername,
    password,
    avatar: avatar.secure_url,
    coverImage: coverImage.secure_url,
  });

  const createdUser = await User.findById(user._id).select(
    '-password -refreshToken',
  );
  return res
    .status(201)
    .json(new ApiResponse(201, 'User registered successfully', createdUser));
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body ?? {};
  const normalizedEmail =
    typeof email === 'string' ? email.trim().toLowerCase() : '';
  const normalizedUsername =
    typeof username === 'string' ? username.trim().toLowerCase() : '';
  if (
    (!normalizedEmail && !normalizedUsername) ||
    typeof password !== 'string' ||
    !password
  ) {
    throw new ApiError(400, 'Email or username and password are required');
  }

  const user = await User.findOne({
    $or: [
      ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
      ...(normalizedUsername ? [{ username: normalizedUsername }] : []),
    ],
  });
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid email/username or password');
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id,
  );
  const loggedInUser = await User.findById(user._id).select(
    '-password -refreshToken',
  );

  return res
    .status(200)
    .cookie('accessToken', accessToken, cookieOptions)
    .cookie('refreshToken', refreshToken, cookieOptions)
    .json(
      new ApiResponse(200, 'User logged in successfully', {
        user: loggedInUser,
        accessToken,
        refreshToken,
      }),
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, {
    $unset: { refreshToken: 1 },
  });

  return res
    .status(200)
    .clearCookie('accessToken', cookieOptions)
    .clearCookie('refreshToken', cookieOptions)
    .json(new ApiResponse(200, 'User logged out successfully', {}));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, 'Refresh token is required');
  }

  let decodedToken;
  try {
    decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    );
  } catch {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  const user = await User.findById(decodedToken.id);
  if (!user || user.refreshToken !== incomingRefreshToken) {
    throw new ApiError(401, 'Refresh token is expired or has been used');
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id,
  );
  return res
    .status(200)
    .cookie('accessToken', accessToken, cookieOptions)
    .cookie('refreshToken', refreshToken, cookieOptions)
    .json(
      new ApiResponse(200, 'Access token refreshed', {
        accessToken,
        refreshToken,
      }),
    );
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body ?? {};
  if (!oldPassword || typeof newPassword !== 'string' || !newPassword) {
    throw new ApiError(400, 'Old and new passwords are required');
  }

  const user = await User.findById(req.user._id);
  if (!user || !(await user.comparePassword(oldPassword))) {
    throw new ApiError(400, 'Invalid old password');
  }

  user.password = newPassword;
  await user.save();
  return res
    .status(200)
    .json(new ApiResponse(200, 'Password changed successfully', {}));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, 'Current user fetched successfully', req.user));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const body = req.body ?? {};
  const { fullname = body.fullName, email } = body;
  if (
    typeof fullname !== 'string' ||
    !fullname.trim() ||
    typeof email !== 'string' ||
    !email.trim()
  ) {
    throw new ApiError(400, 'Full name and email are required');
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        fullname: fullname.trim(),
        email: email.trim().toLowerCase(),
      },
    },
    { new: true, runValidators: true },
  ).select('-password -refreshToken');

  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  return res
    .status(200)
    .json(new ApiResponse(200, 'Account details updated successfully', user));
});

const updateUserImage = (field, folder, label) =>
  asyncHandler(async (req, res) => {
    const localFilePath = req.file?.path;
    if (!localFilePath) {
      throw new ApiError(400, `${label} file is required`);
    }

    const image = await uploadOnCloudinary(localFilePath, folder);
    if (!image?.secure_url) {
      throw new ApiError(502, `Unable to upload ${label.toLowerCase()}`);
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { [field]: image.secure_url } },
      { new: true, runValidators: true },
    ).select('-password -refreshToken');

    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    return res
      .status(200)
      .json(new ApiResponse(200, `${label} updated successfully`, user));
  });

const updateUserAvatar = updateUserImage('avatar', 'avatars', 'Avatar');
const updateUserCoverImage = updateUserImage(
  'coverImage',
  'coverImages',
  'Cover image',
);

const getUserChannelProfile = asyncHandler(async(req,res)=>{
  const {username}= req.params
  if(!username ?.trim()){
    throw new ApiError(400 , "username is missing")
  }
   const channel = await user.aggregate([
    {
      $match:{
        username: username ?.toLowerCase()
      }
    },
    {
      $lookup:{
        from: "subscriptions"
        localField:"_id",
        foreignField: "channel",
        as: "subscriber"
      }
    },
    {
      $lookup:{
        from: "subscriptions"
        localField:"_id",
        foreignField: "subscriber",
        as: "channel"
      }
    },
    {
      $addFields: {
        subscribersCount:{
          $size: "$subscribers"
        },
        channelsSubscribedToCount:{
          $size: "$subscribedTo"
        },
        isSubscribed: {
          $cond: {
            if: {$in: [req.user?._id, "$subscribers.subscriber"]}
          }
        }
      }
    },
    {
      $project: {
        fullname:1,
        username:1,
        subscribercount:1,
        channelIsSubscrirbedToCount: 1,
        issubscribed:1,
        coverImage:1,
        email:1
      }
    }

   ])



})


const getWatchHistory= asyncHandler(async(req,res) =>{
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user.id)
      }
    },
    {
      $lookup:{
        from : "videos",
        localField: "watchHistory",
        foreignField:"_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup:{
              from: "users",
              localField: "owner",
              foreignField:"_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName:1,
                    username:1,
                    avatar:1,                 
                  }
                },
                {
                  $addFields:{
                    owner:{
                      $first: "$owner"

                    }
                  }
                }
              ]
            }
          }
        ]

      }
    }

  ])

  return res
  .status(200)
  .json(
    new ApiResponse(
      200,
      user[0].watchHistory,
      "watch history fetched successfully "
    )
  )
})

export {
  changeCurrentPassword,
  getCurrentUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory
};
