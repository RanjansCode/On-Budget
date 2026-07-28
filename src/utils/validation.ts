/**
 * Validation utilities for Social Media links (YouTube, Instagram)
 */

export interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

/**
 * Validates if a given URL is a valid YouTube or Instagram URL.
 * Empty or whitespace strings are treated as valid (since fields are optional).
 */
export function validateSocialUrl(url: string, platform?: 'youtube' | 'instagram'): ValidationResult {
  const trimmed = (url || '').trim();
  if (!trimmed) {
    return { isValid: true };
  }

  // Check URL formatting
  let parsedUrl: URL;
  try {
    const urlWithProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    parsedUrl = new URL(urlWithProtocol);
  } catch {
    return { 
      isValid: false, 
      errorMessage: 'Invalid URL format. Example: https://youtube.com/watch?v=...' 
    };
  }

  const hostname = parsedUrl.hostname.toLowerCase();
  const isYouTube = hostname === 'youtube.com' || hostname.endsWith('.youtube.com') || hostname === 'youtu.be' || hostname.endsWith('.youtu.be');
  const isInstagram = hostname === 'instagram.com' || hostname.endsWith('.instagram.com');

  if (platform === 'youtube') {
    if (!isYouTube) {
      return {
        isValid: false,
        errorMessage: 'Invalid YouTube URL. Must be from youtube.com or youtu.be'
      };
    }
  } else if (platform === 'instagram') {
    if (!isInstagram) {
      return {
        isValid: false,
        errorMessage: 'Invalid Instagram URL. Must be from instagram.com'
      };
    }
  } else {
    if (!isYouTube && !isInstagram) {
      return {
        isValid: false,
        errorMessage: 'Invalid URL. Must be a valid youtube.com, youtu.be, or instagram.com link.'
      };
    }
  }

  return { isValid: true };
}
