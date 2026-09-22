import mongoose from 'mongoose';

const featureSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    value: { type: String, required: true },
  },
  { _id: false }
);

const appSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    subtitle: {
      type: String,
      default: '',
      trim: true,
    },
    tagline: {
      type: String,
      default: '',
      trim: true,
    },
    category: {
      type: String,
      required: true,
      default: 'Games',
      trim: true,
      index: true,
    },
    package: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    version: {
      type: String,
      default: 'v1.0.0',
      trim: true,
    },
    status: {
      type: String,
      default: 'Google Play Production',
      trim: true,
    },
    rating: {
      type: String,
      default: '4.9',
      trim: true,
    },
    ratingCount: {
      type: String,
      default: '1K+ Players',
      trim: true,
    },
    icon: {
      type: String,
      default: '🎮',
      trim: true,
    },
    bannerType: {
      type: String,
      default: 'default',
      trim: true,
    },
    playStoreUrl: {
      type: String,
      default: '',
      trim: true,
    },
    privacyUrl: {
      type: String,
      default: '',
      trim: true,
    },
    technologies: [
      {
        type: String,
        trim: true,
      },
    ],
    highlights: [
      {
        type: String,
        trim: true,
      },
    ],
    features: [featureSchema],
    containsAds: {
      type: Boolean,
      default: true,
    },
    featured: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.models.App || mongoose.model('App', appSchema);
