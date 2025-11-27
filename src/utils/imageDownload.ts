/**
 * Utility functions for downloading images
 * Handles both URL and base64 image formats
 */

export interface ImageData {
  url: string;
  title?: string;
  id?: string;
}

/**
 * Download a single image by URL or base64 data
 */
export async function downloadImage(imageUrl: string, filename?: string): Promise<void> {
  try {
    let blob: Blob;
    let finalFilename = filename || `image-${Date.now()}.png`;

    // Check if it's a base64 data URL
    if (imageUrl.startsWith('data:image')) {
      const response = await fetch(imageUrl);
      blob = await response.blob();
      // Extract filename from data URL if possible
      const mimeMatch = imageUrl.match(/data:image\/([^;]+)/);
      if (mimeMatch) {
        const extension = mimeMatch[1] === 'jpeg' ? 'jpg' : mimeMatch[1];
        finalFilename = filename || `image-${Date.now()}.${extension}`;
      }
    } else {
      // Regular URL - fetch the image
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }
      blob = await response.blob();
      
      // Try to get filename from Content-Disposition header or URL
      const contentDisposition = response.headers.get('Content-Disposition');
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch) {
          finalFilename = filenameMatch[1];
        }
      } else {
        // Extract filename from URL
        const urlPath = new URL(imageUrl).pathname;
        const urlFilename = urlPath.split('/').pop();
        if (urlFilename && urlFilename.includes('.')) {
          finalFilename = urlFilename;
        }
      }
    }

    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = finalFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading image:', error);
    throw new Error(`Failed to download image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Download multiple images individually (one by one)
 */
export async function downloadMultipleImages(images: ImageData[]): Promise<void> {
  for (let i = 0; i < images.length; i++) {
    const image = images[i];
    const filename = image.title 
      ? `${image.title.replace(/[^a-z0-9]/gi, '_')}.png`
      : `image-${i + 1}.png`;
    
    // Add small delay between downloads to avoid browser blocking
    if (i > 0) {
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    await downloadImage(image.url, filename);
  }
}

/**
 * Download all images as a zip file (requires JSZip library)
 * Falls back to individual downloads if JSZip is not available
 */
export async function downloadImagesAsZip(images: ImageData[]): Promise<void> {
  try {
    // Check if JSZip is available
    // @ts-ignore
    if (typeof window !== 'undefined' && window.JSZip) {
      // @ts-ignore
      const JSZip = window.JSZip;
      const zip = new JSZip();

      // Fetch all images and add to zip
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        const response = await fetch(image.url);
        const blob = await response.blob();
        const filename = image.title 
          ? `${image.title.replace(/[^a-z0-9]/gi, '_')}.png`
          : `image-${i + 1}.png`;
        zip.file(filename, blob);
      }

      // Generate zip file
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = window.URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `campaign-images-${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } else {
      // Fallback to individual downloads
      console.warn('JSZip not available, downloading images individually');
      await downloadMultipleImages(images);
    }
  } catch (error) {
    console.error('Error creating zip file:', error);
    // Fallback to individual downloads
    await downloadMultipleImages(images);
  }
}











