import mongoose from 'mongoose'

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    minlength: 2
  },
  body: {
    type: String,
    required: true,
    minlength: 5
  },
  expiresAt: {
    type: Date,
    required: true
  }
}, { timestamps: true })

export default mongoose.model('Announcement', announcementSchema)
