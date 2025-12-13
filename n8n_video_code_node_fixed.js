// Get the cleaned item from Edit Fields
const item = $input.first();

// The cleaned videos text
const videosText = item.json.videos_text || "";
const productImageUrl = item.json.product_image || "";
const videos = [];

// Extract all 2 video scenes - handle ** and various formats
// Updated pattern to handle: Video 1** or Video 1 or **Video 1**
const videoPattern = /Video\s*\*{0,2}\s*\d+\s*\*{0,2}\s*\n?[\\"]*([^]+?)(?=Video\s*\*{0,2}\s*\d+|$)/gi;
const matches = [...videosText.matchAll(videoPattern)];

if (matches && matches.length >= 1) {
  for (let i = 0; i < Math.min(1, matches.length); i++) {
    let videoText = matches[i][1] || "";
    
    // Clean the video text - IMPORTANT: Don't remove escaped quotes, they're needed for JSON
    videoText = videoText
      // DO NOT remove escaped quotes - they're needed for proper JSON escaping
      // .replace(/\\"/g, '') // REMOVED - this was breaking JSON
      .replace(/^["'\s\n]+|["'\s\n]+$/g, '') // Trim outer quotes, spaces, newlines (but keep internal quotes)
      .replace(/Feature the exact product from \[https:\/\/[^\]]+\],?\s*/gi, '') // Remove URL reference
      .replace(/\[https:\/\/[^\]]+\]/g, '') // Remove remaining URL brackets
      .replace(/\*\*/g, '') // Remove any remaining asterisks
      .replace(/\n/g, ' ') // Replace line breaks with spaces
      .trim();
    
    if (videoText.length > 20) {
      videos.push(videoText);
    }
  }
}

// Fallback if primary regex fails
if (videos.length === 0) {
  console.log("Primary regex failed, trying fallback");
  
  // Try splitting by Video markers more aggressively
  const videoSplits = videosText.split(/Video\s*\*{0,2}\s*\d+\s*\*{0,2}/i).filter(s => s.trim().length > 30);
  
  for (let i = 0; i < Math.min(1, videoSplits.length); i++) {
    let cleanVideo = videoSplits[i]
      // DO NOT remove escaped quotes - they're needed for proper JSON escaping
      // .replace(/\\"/g, '') // REMOVED - this was breaking JSON
      .replace(/Feature the exact product from \[https:\/\/[^\]]+\],?\s*/gi, '')
      .replace(/\[https:\/\/[^\]]+\]/g, '')
      .replace(/\*\*/g, '')
      .replace(/^["'\s\n]+|["'\s\n]+$/g, '') // Trim outer quotes but keep internal quotes
      .replace(/\n/g, ' ')
      .trim();
    
    if (cleanVideo.length > 20) {
      videos.push(cleanVideo);
    }
  }
}

// Return single item with 1 video scene
// IMPORTANT: Return as JavaScript object, not JSON string
// n8n's HTTP Request node will automatically escape quotes when using Body Type = JSON
return [{
  json: {
    video_1: videos[0] || "",
    product_image: productImageUrl
  }
}];
