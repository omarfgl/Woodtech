import { Document, Model, Schema, Types, model } from "mongoose";
import { UserRole } from "./user.types";

export interface UserDocument extends Document {
  _id: Types.ObjectId;
  email: string;
  passwordHash: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  verificationCode?: string;
  verificationExpiresAt?: Date;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type UserModel = Model<UserDocument>;

const userSchema = new Schema<UserDocument, UserModel>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    firstName: {
      type: String,
      trim: true
    },
    lastName: {
      type: String,
      trim: true
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user"
    },
    verificationCode: {
      type: String
    },
    verificationExpiresAt: {
      type: Date
    },
    verifiedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);
const User = model<UserDocument, UserModel>("User", userSchema);

export default User;
