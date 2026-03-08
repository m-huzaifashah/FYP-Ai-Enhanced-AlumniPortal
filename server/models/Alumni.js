import mongoose from 'mongoose'

const alumniSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  batch: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  department: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true
  },
  company: {
    type: String,
    required: true
  }
}, { timestamps: true, strict: false })

export default mongoose.model('Alumni', alumniSchema)
