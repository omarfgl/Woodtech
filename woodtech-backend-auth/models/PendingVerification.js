const mongoose = require('mongoose');

const pendingVerificationSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    code: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.models.PendingVerification || mongoose.model('PendingVerification', pendingVerificationSchema);
