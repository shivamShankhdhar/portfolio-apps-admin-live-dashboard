import mongoose from 'mongoose';

const SkillSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Skill name is required'],
    trim: true,
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
  },
  proficiency: {
    type: String,
    required: [true, 'Proficiency is required'],
    enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
  },
  icon: {
    type: String,
    default: null,
  },
  image: {
    type: String,
    default: null,
  },
  description: {
    type: String,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const Skill = mongoose.models.Skill || mongoose.model('Skill', SkillSchema);
export default Skill;
