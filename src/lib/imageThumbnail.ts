/**
 * Geração de miniatura no cliente.
 *
 * O bucket de capas é privado e os originais chegam com ~1600px / vários MB.
 * Ao subir (ou gerar por IA) uma capa, criamos também uma versão leve em JPEG
 * (~640px, qualidade 70) sob `thumbs/`, que é o arquivo realmente usado na
 * listagem de cursos do PWA.
 */

/** Caminho da miniatura correspondente a um objeto do bucket. */
export function thumbStoragePath(path: string): string {
  return `thumbs/${path.replace(/\.[a-z0-9]+$/i, '')}.jpg`;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Não foi possível ler a imagem'));
    };
    img.src = url;
  });
}

/**
 * Redimensiona a imagem para `maxWidth` (mantendo proporção) e devolve um JPEG.
 * Retorna `null` se o navegador não conseguir gerar o blob — nesse caso o upload
 * do original continua normalmente.
 */
export async function createThumbnailBlob(
  file: File,
  maxWidth = 640,
  quality = 0.7,
): Promise<Blob | null> {
  try {
    const img = await loadImage(file);
    const scale = img.width > maxWidth ? maxWidth / img.width : 1;
    const width = Math.max(1, Math.round(img.width * scale));
    const height = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, width, height);

    return await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', quality),
    );
  } catch {
    return null;
  }
}
