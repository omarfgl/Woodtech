import { Document, Model, Schema, Types, model } from "mongoose";

export interface RefreshTokenDocument extends Document {
  user: Types.ObjectId;
  jti: string;
  tokenHash: string;
  expiresAt: Date;
  revoked: boolean;
  replacedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type RefreshTokenModel = Model<RefreshTokenDocument>;

const refreshTokenSchema = new Schema<RefreshTokenDocument, RefreshTokenModel>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    jti: {
      type: String,
      required: true,
      unique: true
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true
    },
    expiresAt: {
      type: Date,
      required: true
    },
    revoked: {
      type: Boolean,
      default: false
    },
    replacedBy: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const RefreshToken = model<RefreshTokenDocument, RefreshTokenModel>("RefreshToken", refreshTokenSchema);

export default RefreshToken;
