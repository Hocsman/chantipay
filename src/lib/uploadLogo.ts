import { createClient } from '@/lib/supabase/client'

const MAX_FILE_SIZE = 1 * 1024 * 1024 // 1 MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg']

export async function uploadCompanyLogo(file: File, userId: string): Promise<string | null> {
  // Validation
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Format non autorisé. Utilisez PNG ou JPG uniquement.')
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error('Fichier trop volumineux. Taille maximale : 1 Mo')
  }

  const supabase = createClient()
  
  // Créer un nom de fichier unique
  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}/logo-${Date.now()}.${fileExt}`

  try {
    // Upload vers Supabase Storage
    const { data, error } = await supabase.storage
      .from('company-logos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
      })

    if (error) throw error

    // Obtenir l'URL publique
    const { data: publicUrlData } = supabase.storage
      .from('company-logos')
      .getPublicUrl(fileName)

    return publicUrlData.publicUrl
  } catch (error) {
    console.error('Erreur upload logo:', error)
    throw error
  }
}

export async function deleteCompanyLogo(logoUrl: string, userId: string): Promise<void> {
  const supabase = createClient()
  
  // Extraire le nom du fichier de l'URL
  const fileName = logoUrl.split('/').pop()
  if (!fileName) return

  try {
    await supabase.storage
      .from('company-logos')
      .remove([`${userId}/${fileName}`])
  } catch (error) {
    console.error('Erreur suppression logo:', error)
  }
}
