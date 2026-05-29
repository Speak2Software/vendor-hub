/**
 * uploadFile.js — uploads any file to Cloudinary using the "auto" resource type.
 * Works for images, PDFs, documents, etc.
 *
 * Returns { url, fileName, fileSize, resourceType }
 * Throws on failure.
 */
export async function uploadFile(file) {
  const cloudName    = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME    || 'devhcr8d8'
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'speak2vendors_logos'

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', uploadPreset)
  formData.append('folder', 'speak2vendors/testimonials')

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
    { method: 'POST', body: formData },
  )

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `Upload failed (${res.status})`)
  }

  const data = await res.json()
  return {
    url:          data.secure_url,
    fileName:     file.name,
    fileSize:     data.bytes,
    resourceType: data.resource_type,
  }
}
