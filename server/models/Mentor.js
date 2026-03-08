import mongoose from 'mongoose'

const mentorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 1
  },
  title: {
    type: String,
    required: true
  },
  company: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  skills: {
    type: [String],
    required: true
  }
}, { timestamps: true, strict: false })

export default mongoose.model('Mentor', mentorSchema)
