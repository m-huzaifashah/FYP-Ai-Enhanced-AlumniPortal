import mongoose from 'mongoose'

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    minlength: 1
  },
  company: {
    type: String,
    required: true,
    minlength: 1
  },
  location: {
    type: String,
    required: true,
    minlength: 1
  },
  link: {
    type: String
  }
}, { timestamps: true, strict: false })

export default mongoose.model('Job', jobSchema)
