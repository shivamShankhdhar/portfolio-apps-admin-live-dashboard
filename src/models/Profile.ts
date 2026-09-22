import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    bio: {
      type: String,
      trim: true,
      default: '',
    },
    linkedinUrl: {
      type: String,
      trim: true,
      default: '',
    },
    githubUrl: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      trim: true,
      default: '',
    },
    available: {
      type: Boolean,
      default: true,
    },
    portfolioUrl: {
      type: String,
      trim: true,
      default: 'http://localhost:3000',
    },
    appsUrl: {
      type: String,
      trim: true,
      default: 'http://localhost:3002',
    },
    adminUrl: {
      type: String,
      trim: true,
      default: 'http://localhost:3003',
    },
    roles: {
      type: [String],
      default: [
        'Full Stack Developer',
        'Java Developer',
        'MERN Stack Developer',
        'React Native Developer',
      ],
    },
  },
  { timestamps: true, strict: false }
);

if (mongoose.models && mongoose.models.Profile) {
  delete mongoose.models.Profile;
}

export default mongoose.model('Profile', profileSchema, 'profile');
