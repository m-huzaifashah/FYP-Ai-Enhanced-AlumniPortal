import mongoose from 'mongoose'

const studentSchema = new mongoose.Schema({
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
    type: String
  },
  department: {
    type: String
  },
  semester: {
    type: String
  }
}, { timestamps: true, strict: false })

export default mongoose.model('Student', studentSchema)
