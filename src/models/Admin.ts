import mongoose from 'mongoose';

const PasskeyCredentialSchema = new mongoose.Schema({
  credentialId: { type: String, required: true },
  publicKey: { type: String, required: true },
  counter: { type: Number, default: 0 },
  deviceName: { type: String, default: 'Biometric Authenticator' },
  createdAt: { type: Date, default: Date.now },
});

const AdminSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
    },
    passwordHash: {
      type: String,
    },
    passwordUpdatedAt: {
      type: Date,
    },
    otp: {
      type: String,
    },
    otpExpiry: {
      type: Date,
    },
    isVerified: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
    lastLoginIp: {
      type: String,
    },
    lastLoginDevice: {
      type: String,
    },
    lastLoginLocation: {
      type: String,
    },
    activeSessionId: {
      type: String,
    },
    // Two-Factor Authentication fields
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    twoFactorMethod: {
      type: String,
      enum: ['totp', 'passkey', 'both'],
      default: 'totp',
    },
    totpSecret: {
      type: String,
    },
    totpVerified: {
      type: Boolean,
      default: false,
    },
    passkeys: [PasskeyCredentialSchema],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { strict: false }
);

delete (mongoose.models as any).Admin;
export const Admin = mongoose.model('Admin', AdminSchema);
export default Admin;
