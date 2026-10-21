import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    }
    fullname:{
        type: String,
        required: true,
        trim: true, 
        index: true,
    }
    avatar: {
        type: String,
        required: true,
    }
    coverImage: {
        type: String,
        required: true,
    },
    watshHistory: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Video',   
    }],
    password: {
        type: String,
        required: [true, 'Password is required'],
    },
    refreshToken:{
        type: String
    }
},
{
    timestamps: true
}

)

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

userSchema.methods.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.password);
}

userSchema.methods.generateAccessToken = function () {
    jwt.sign({
        id: this._id,
        email: this.email,
        username: this.username,
        email: this.email,
    },
    process.env.ACCESS_TOKEN_SECRET,    
    {
        expiresIn: '15m'
    }
)
}
userSchema.methods.generateRefToken = function () {
    return jwt.sign({ id: this._id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
}

export const User = mongoose.model('User', userSchema);