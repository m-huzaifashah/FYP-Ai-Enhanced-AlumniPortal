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
  rsvpCount: {
    type: Number,
    default: 0
  },
  registrants: [{
    type: String // We will store user emails here for simplicity
  }],
  description: {
    type: String
  },
  image: {
    type: String  // base64 data URL
  }
}, { timestamps: true, strict: false })

export default mongoose.model('Event', eventSchema)
