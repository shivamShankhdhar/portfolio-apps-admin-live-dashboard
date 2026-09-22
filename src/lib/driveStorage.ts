export function resolveMediaUrl(url?: string): string {
  if (!url || url.trim().length === 0) {
    return '/screenshots/ludo_gameplay.jpg';
  }

  const cleanUrl = url.trim();

  if (cleanUrl.startsWith('/') || cleanUrl.startsWith('data:')) {
    return cleanUrl;
  }

  const driveFileRegex = /(?:drive\.google\.com\/(?:file\/d\/|open\?id=)|lh3\.googleusercontent\.com\/d\/)([a-zA-Z0-9_-]+)/;
  const match = cleanUrl.match(driveFileRegex);
  if (match && match[1]) {
    const fileId = match[1];
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }

  return cleanUrl;
}
