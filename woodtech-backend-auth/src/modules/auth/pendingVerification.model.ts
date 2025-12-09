import { Document, Model, Schema, Types, model } from "mongoose";

export interface PendingVerificationDocument extends Document {
  _id: Types.ObjectId;
  email: string;
  passwordHash: string;
  firstName?: string;
  lastName?: string;
  code: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type PendingVerificationModel = Model<PendingVerificationDocument>;

const pendingVerificationSchema = new Schema<PendingVerificationDocument, PendingVerificationModel>(
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
    code: {
      type: String,
      required: true
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }
    }
  },
  {
    timestamps: true
  }
);

const PendingVerification = model<PendingVerificationDocument, PendingVerificationModel>(
  "PendingVerification",
  pendingVerificationSchema
);

export default PendingVerification;
