/**
 * uploadImage.js — uploads an image File to Cloudinary using an unsigned preset.
 *
 * Required Amplify env vars (baked in at build time by Vite):
 *   VITE_CLOUDINARY_CLOUD_NAME    e.g.  "my-cloud"
 *   VITE_CLOUDINARY_UPLOAD_PRESET e.g.  "speak2vendors_logos"
 *
 * Returns the secure HTTPS URL of the uploaded image.
 * Throws on failure.
 */
export async function uploadImage(file) {
  const cloudName    = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME    || 'devhcr8d8'
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'speak2vendors_logos'

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', uploadPreset)
  formData.append('folder', 'speak2vendors/logos')

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: 'POST', body: formData },
  )

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `Upload failed (${res.status})`)
  }

  const data = await res.json()
  return data.secure_url
}
