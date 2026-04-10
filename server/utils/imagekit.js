import ImageKit from '@imagekit/nodejs'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.join(__dirname, '../../.env') })

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
})

/**
 * Uploads a file buffer to ImageKit
 * @param {Buffer} fileBuffer 
 * @param {string} fileName 
 * @param {string} folder 
 * @returns {Promise<string>} The URL of the uploaded image
 */
export const uploadToImageKit = async (fileBuffer, fileName, folder = 'alumni_portal') => {
  try {
    const result = await imagekit.files.upload({
      file: fileBuffer.toString('base64'),
      fileName: fileName,
      folder: folder
    })
    return result.url
  } catch (error) {
    console.error('ImageKit upload error:', error)
    throw new Error('Failed to upload image to ImageKit')
  }
}

export default imagekit
