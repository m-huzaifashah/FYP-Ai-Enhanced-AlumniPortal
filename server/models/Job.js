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
  },
  deadline: {
    type: String
  },
  image: {
    type: String  // base64 data URL
  }
}, { timestamps: true, strict: false })

export default mongoose.model('Job', jobSchema)
