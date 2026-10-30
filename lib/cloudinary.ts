/**
 * Optimiza una URL de Cloudinary agregando transformaciones automáticas
 * @param url - La URL original de Cloudinary
 * @param width - Ancho máximo deseado (default 400)
 * @returns La URL optimizada o la original si no es de Cloudinary
 */
export function optimizeCloudinaryUrl(
    url: string | null | undefined,
    width: number = 400
  ): string | undefined {
    if (!url) return undefined;
  
    // Solo optimizar URLs de Cloudinary
    if (!url.includes('res.cloudinary.com')) {
      return url;
    }
  
    // Si ya tiene transformaciones, no las duplicamos
    if (url.includes('/upload/q_')) {
      return url;
    }
  
    // Insertar las transformaciones después de /upload/
    return url.replace(
      '/upload/',
      `/upload/q_auto,f_auto,w_${width},c_limit/`
    );
  }