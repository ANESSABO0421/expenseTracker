const cloudinary = require('cloudinary').v2;
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.warn('⚠️  Cloudinary env vars missing — CLOUDINARY_CLOUD_NAME/CLOUDINARY_API_KEY/CLOUDINARY_API_SECRET must all be set.');
}

const uploadImageBase64 = async (base64String, folder = 'expenseTracker') => {
  try {
    const uploadResponse = await cloudinary.uploader.upload(base64String, {
      folder: folder,
      resource_type: 'image',
    });
    return uploadResponse.secure_url;
  } catch (error) {
    // Surface the real Cloudinary reason (bad credentials, bad image data, quota, etc.)
    // instead of swallowing it — makes the actual cause visible in logs and to the client.
    const reason = error?.message || error?.error?.message || 'Unknown error';
    console.error('Cloudinary upload error:', reason, error);
    throw new Error(`Failed to upload image to Cloudinary: ${reason}`);
  }
};

module.exports = {
  uploadImageBase64,
};
