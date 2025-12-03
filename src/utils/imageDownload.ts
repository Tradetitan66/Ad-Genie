export interface ImageData {
  url: string;
  title: string;
  id?: string;
}

/**
 * Download a single image from a URL
 * @param url - The image URL to download
 * @param filename - The filename to save the image as
 */
export async function downloadImage(url: string, filename: string): Promise<void> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the blob URL
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error('Error downloading image:', error);
    throw error;
  }
}

/**
 * Download multiple images sequentially
 * @param imageData - Array of image data objects with url, title, and optional id
 */
export async function downloadMultipleImages(imageData: ImageData[]): Promise<void> {
  if (!imageData || imageData.length === 0) {
    throw new Error('No images provided');
  }

  // Download images one by one to avoid browser blocking multiple downloads
  for (let i = 0; i < imageData.length; i++) {
    const image = imageData[i];
    const filename = image.title || `image-${i + 1}.png`;
    
    try {
      await downloadImage(image.url, filename);
      // Add a small delay between downloads to avoid browser blocking
      if (i < imageData.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    } catch (error) {
      console.error(`Error downloading image ${i + 1}:`, error);
      // Continue with next image even if one fails
    }
  }
}























