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
    appStoreUrl: {
      type: String,
      default: '',
      trim: true,
    },
    playStoreStatus: {
      type: String,
      default: 'Production',
      trim: true,
    },
    appStoreStatus: {
      type: String,
      default: 'Coming Soon',
      trim: true,
    },
    privacyUrl: {
      type: String,
      default: '',
      trim: true,
    },
    playConsoleUrl: {
      type: String,
      default: '',
      trim: true,
    },
    featureGraphic: {
      type: String,
      default: '',
      trim: true,
    },
    playScreenshots: [
      {
        type: String,
        trim: true,
      },
    ],
    downloadsTier: {
      type: String,
      default: '10K+ Installs',
      trim: true,
    },
    contentRating: {
      type: String,
      default: 'Rated for 3+',
      trim: true,
    },
    playProtectVerified: {
      type: Boolean,
      default: true,
    },
    releaseTrack: {
      type: String,
      default: 'Production Track',
      trim: true,
    },
    whatsNew: {
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
  { timestamps: true, strict: false }
);

if (mongoose.models.App) {
  delete mongoose.models.App;
}

export default mongoose.models.App || mongoose.model('App', appSchema);
