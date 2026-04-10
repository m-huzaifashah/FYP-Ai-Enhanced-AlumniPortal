import mongoose from 'mongoose'

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  date: {
    type: String,
    required: true
  },
  time: {
    type: String
  },
  location: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  image: {
    type: String  // base64 data URL
  }
}, { timestamps: true, strict: false })

export default mongoose.model('Event', eventSchema)
