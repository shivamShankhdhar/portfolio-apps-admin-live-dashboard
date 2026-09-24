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
    yearsExperience: {
      type: String,
      trim: true,
      default: '3+',
    },
    projectsCompleted: {
      type: String,
      trim: true,
      default: '20+',
    },
    happyClients: {
      type: String,
      trim: true,
      default: '100%',
    },
    headlineQuote: {
      type: String,
      trim: true,
      default:
        'Engineering is not merely writing code to make things work; it is designing resilient architectures that endure under load and craft experiences users love.',
    },
    location: {
      type: String,
      trim: true,
      default: 'Bareilly, Uttar Pradesh, India',
    },
    phone: {
      type: String,
      trim: true,
      default: '+91 8448967919',
    },
  },
  { timestamps: true, strict: false }
);

if (mongoose.models && mongoose.models.Profile) {
  delete mongoose.models.Profile;
}

export default mongoose.model('Profile', profileSchema, 'profile');
