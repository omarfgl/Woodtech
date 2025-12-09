import bcrypt from "bcrypt";
import { Types } from "mongoose";
import { MongoServerError } from "mongodb";
import crypto from "node:crypto";
import config from "../../config/env";
import logger from "../../config/logger";
import { AuthenticationError, ConflictError } from "../../utils/errors";
import { generateTokenId, hashToken, signAccessToken, signRefreshToken, verifyRefreshToken } from "../../utils/jwt";
import { ttlToMilliseconds } from "../../utils/time";
import User, { UserDocument } from "../user/user.model";
import { UserProfile } from "../user/user.types";
import RefreshToken from "./refreshToken.model";
import type { LoginInput, RegisterInput, VerifyEmailInput } from "./auth.validators";
import axios from "axios";
import PendingVerification from "./pendingVerification.model";

const BCRYPT_SALT_ROUNDS = 12;
const VERIFICATION_TTL_MS = 1000 * 60 * 60 * 24; // 24h

const toUserProfile = (user: UserDocument): UserProfile => ({
  id: user._id.toString(),
  email: user.email,
  firstName: user.firstName ?? undefined,
  lastName: user.lastName ?? undefined,
  role: user.role,
  emailVerified: Boolean(user.verifiedAt)
});

const saveRefreshToken = async (user: UserDocument, refreshToken: string, jti: string) => {
  const expiresAt = new Date(Date.now() + ttlToMilliseconds(config.jwt.refreshTtl));
  await RefreshToken.create({
    user: user._id,
    jti,
    tokenHash: hashToken(refreshToken),
    expiresAt,
    revoked: false
  });
};

type TokenIssueResult = {
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
  refreshTokenJti: string;
};

const issueTokenPair = async (user: UserDocument): Promise<TokenIssueResult> => {
  const jti = generateTokenId();
  const userId = user._id.toString();
  const payload = { sub: userId, email: user.email, role: user.role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload, jti);
  await saveRefreshToken(user, refreshToken, jti);
  return { tokens: { accessToken, refreshToken }, refreshTokenJti: jti };
};

const revokeRefreshToken = async (refreshToken: string) => {
  const tokenHash = hashToken(refreshToken);
  const stored = await RefreshToken.findOne({ tokenHash });
  if (!stored) {
    return;
  }
  stored.revoked = true;
  await stored.save();
};

const revokeByJti = async (jti: string) => {
  await RefreshToken.findOneAndUpdate({ jti }, { revoked: true });
};

const revokeUserTokens = async (userId: string) => {
  await RefreshToken.updateMany({ user: new Types.ObjectId(userId) }, { revoked: true });
};

const createVerificationCode = () => crypto.randomInt(100000, 999999).toString();

const sendVerificationEmail = async (email: string, firstName: string | undefined, code: string) => {
  logger.info({ email }, "Sending verification email");
  try {
    await axios.post(
      `${config.services.mailServiceUrl}/mail/verification`,
      {
        email,
        name: firstName,
        code
      },
      { timeout: 10000 }
    );
    logger.info({ email }, "Verification email sent");
  } catch (error) {
    logger.error({ err: error, email }, "Failed to send verification email");
    throw error;
  }
};

export const AuthService = {
  async register(input: RegisterInput) {
    const email = input.email.toLowerCase();
    const existing = await User.findOne({ email });
    if (existing) {
      if (existing.verifiedAt) {
        throw new ConflictError("Email is already registered");
      }
      // Nettoyage d'un compte non vérifié déjà présent pour éviter une création prématurée.
      await revokeUserTokens(existing._id.toString());
      await User.deleteOne({ _id: existing._id });
    }
    await PendingVerification.deleteOne({ email });

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_SALT_ROUNDS);
    const verificationCode = createVerificationCode();
    const verificationExpiresAt = new Date(Date.now() + VERIFICATION_TTL_MS);

    await PendingVerification.findOneAndUpdate(
      { email },
      {
        email,
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        code: verificationCode,
        expiresAt: verificationExpiresAt
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await sendVerificationEmail(email, input.firstName, verificationCode);

    return { status: "pending_verification", email };
  },

  async login(input: LoginInput) {
    const email = input.email.toLowerCase();
    const user = await User.findOne({ email });
    const pending = await PendingVerification.findOne({ email });
    if (pending) {
      throw new AuthenticationError("Email not verified");
    }
    if (!user) {
      throw new AuthenticationError("Invalid credentials");
    }

    if (!user.verifiedAt) {
      throw new AuthenticationError("Email not verified");
    }

    const passwordMatch = await bcrypt.compare(input.password, user.passwordHash);
    if (!passwordMatch) {
      throw new AuthenticationError("Invalid credentials");
    }

    if (!user.verifiedAt) {
      throw new AuthenticationError("Email not verified");
    }

    const { tokens } = await issueTokenPair(user);

    return {
      user: toUserProfile(user),
      tokens
    };
  },

  async refresh(refreshToken: string) {
    try {
      const payload = verifyRefreshToken(refreshToken);
      if (!payload.jti) {
        throw new AuthenticationError("Invalid refresh token");
      }

      const stored = await RefreshToken.findOne({ jti: payload.jti });
      if (!stored) {
        throw new AuthenticationError("Refresh token revoked");
      }

      if (stored.revoked) {
        throw new AuthenticationError("Refresh token revoked");
      }

      const now = Date.now();
      if (stored.expiresAt.getTime() <= now) {
        await revokeByJti(payload.jti);
        throw new AuthenticationError("Refresh token expired");
      }

      const tokenHash = hashToken(refreshToken);
      if (tokenHash !== stored.tokenHash) {
        await revokeByJti(payload.jti);
        throw new AuthenticationError("Refresh token mismatch");
      }

      const user = await User.findById(payload.sub);
      if (!user) {
        throw new AuthenticationError("User not found");
      }

      const { tokens, refreshTokenJti } = await issueTokenPair(user);

      stored.revoked = true;
      stored.replacedBy = refreshTokenJti;
      await stored.save();

      return {
        user: toUserProfile(user),
        tokens
      };
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error;
      }
      logger.warn({ err: error }, "Failed to refresh token");
      throw new AuthenticationError("Invalid refresh token");
    }
  },

  async logout(refreshToken?: string, userId?: string) {
    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
    }

    if (userId) {
      await revokeUserTokens(userId);
    }
  },

  mapUserProfile(user: UserDocument): UserProfile {
    return toUserProfile(user);
  },

  async verifyEmail(input: VerifyEmailInput) {
    const email = input.email.toLowerCase();

    const alreadyUser = await User.findOne({ email });
    const pending = await PendingVerification.findOne({ email });

    if (alreadyUser && alreadyUser.verifiedAt) {
      throw new AuthenticationError("Account already verified. Please log in.");
    }

    if (alreadyUser && !alreadyUser.verifiedAt) {
      if (!pending) {
        throw new AuthenticationError("Verification not requested");
      }
      const now = Date.now();
      if (pending.expiresAt.getTime() < now) {
        await PendingVerification.deleteOne({ _id: pending._id });
        throw new AuthenticationError("Verification code expired");
      }
      if (pending.code !== input.code) {
        throw new AuthenticationError("Invalid verification code");
      }

      alreadyUser.verifiedAt = new Date();
      await alreadyUser.save();
      await PendingVerification.deleteOne({ _id: pending._id });

      const { tokens } = await issueTokenPair(alreadyUser);
      return {
        user: toUserProfile(alreadyUser),
        tokens
      };
    }

    if (!pending) {
      throw new AuthenticationError("Verification not requested");
    }
    const now = Date.now();
    if (pending.expiresAt.getTime() < now) {
      await PendingVerification.deleteOne({ _id: pending._id });
      throw new AuthenticationError("Verification code expired");
    }
    if (pending.code !== input.code) {
      throw new AuthenticationError("Invalid verification code");
    }

    let user: UserDocument;
    try {
      user = await User.create({
        email,
        passwordHash: pending.passwordHash,
        firstName: pending.firstName,
        lastName: pending.lastName,
        verifiedAt: new Date()
      });
    } catch (error) {
      if (error instanceof MongoServerError && error.code === 11000) {
        throw new ConflictError("Email is already registered");
      }
      throw error;
    }

    await PendingVerification.deleteOne({ _id: pending._id });

    const { tokens } = await issueTokenPair(user);

    return {
      user: toUserProfile(user),
      tokens
    };
  }
};
