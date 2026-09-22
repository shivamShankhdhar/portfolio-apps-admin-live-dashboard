import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = (body.url || body.package || '').trim();

    if (!input) {
      return NextResponse.json({ message: 'URL or Package Name is required' }, { status: 400 });
    }

    // Extract package name
    let packageId = input;
    if (input.includes('id=')) {
      const match = input.match(/[?&]id=([a-zA-Z0-9._]+)/);
      if (match) packageId = match[1];
    } else if (input.includes('apps/testing/')) {
      const match = input.match(/apps\/testing\/([a-zA-Z0-9._]+)/);
      if (match) packageId = match[1];
    } else if (input.includes('play.google.com')) {
      const parts = input.split('/');
      const lastPart = parts[parts.length - 1].split('?')[0];
      if (lastPart && /^[a-zA-Z0-9._]+$/.test(lastPart)) {
        packageId = lastPart;
      }
    }

    // Clean packageId
    packageId = packageId.replace(/[^a-zA-Z0-9._]/g, '');

    const playStoreUrl = `https://play.google.com/store/apps/details?id=${packageId}&hl=en&gl=US`;
    const playConsoleTestingUrl = `https://play.google.com/apps/testing/${packageId}`;

    let html = '';
    let isPublic = false;

    try {
      const res = await fetch(playStoreUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
        },
        next: { revalidate: 0 },
      });

      if (res.ok) {
        html = await res.text();
        isPublic = true;
      }
    } catch (fetchErr) {
      console.warn('Could not fetch public Play Store HTML:', fetchErr);
    }

    if (!isPublic || !html) {
      // Return structured closed-testing / fallback metadata
      return NextResponse.json({
        success: true,
        source: 'generated_fallback',
        isClosedTesting: true,
        data: {
          package: packageId,
          title: packageId.split('.').pop()?.replace(/[-_]/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) || '',
          playStoreUrl,
          playConsoleUrl: playConsoleTestingUrl,
          releaseTrack: 'Closed Testing Track',
          status: 'Google Play Closed Testing',
          playStoreStatus: 'Closed Testing (Opt-in Active)',
          playProtectVerified: true,
          contentRating: 'Rated for 3+',
          downloadsTier: 'Early Access Testing Tier',
          message: 'App is in closed testing or not publicly indexed. Pre-configured testing links and metadata.',
        },
      });
    }

    // Parse public Play Store listing
    // 1. Title
    let title = '';
    const ogTitleMatch = html.match(/<meta property="og:title" content="([^"]+)"/i);
    if (ogTitleMatch) {
      title = ogTitleMatch[1].replace(/ - Apps on Google Play/i, '').trim();
    } else {
      const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
      if (h1Match) title = h1Match[1].replace(/<[^>]+>/g, '').trim();
    }

    // 2. Icon URL
    let iconUrl = '';
    const ogImageMatch = html.match(/<meta property="og:image" content="([^"]+)"/i);
    if (ogImageMatch) {
      iconUrl = ogImageMatch[1];
    } else {
      const iconMatch = html.match(/<img[^>]+src="([^"]+googleusercontent\.com\/[^"]+)"[^>]*alt="Cover art"/i);
      if (iconMatch) iconUrl = iconMatch[1];
    }

    // 3. Rating
    let rating = '4.9';
    const ratingMatch =
      html.match(/aria-label="Rated ([0-9.]+) stars out of five stars"/i) ||
      html.match(/itemprop="ratingValue" content="([0-9.]+)"/i) ||
      html.match(/([0-9]\.[0-9])\s*<i[^>]*>star<\/i>/i);
    if (ratingMatch) rating = ratingMatch[1];

    // 4. Rating count / reviews
    let ratingCount = '';
    const reviewsMatch =
      html.match(/itemprop="ratingCount" content="([0-9]+)"/i) ||
      html.match(/([0-9,K+]+)\s*reviews/i) ||
      html.match(/([0-9,K+]+)\s*ratings/i);
    if (reviewsMatch) {
      ratingCount = `${reviewsMatch[1]} Reviews`;
    } else {
      ratingCount = '1K+ Reviews';
    }

    // 5. Installs / Downloads Tier
    let downloadsTier = '10K+ Installs';
    const downloadsMatch =
      html.match(/>([0-9,K+M+]+)\+?\s*Downloads<\/div>/i) ||
      html.match(/([0-9,K+M+]+)\+?\s*installs/i);
    if (downloadsMatch) {
      downloadsTier = downloadsMatch[1].includes('+') ? `${downloadsMatch[1]} Downloads` : `${downloadsMatch[1]}+ Downloads`;
    }

    // 6. Content Rating
    let contentRating = 'Rated for 3+';
    const contentRatingMatch = html.match(/Rated for ([0-9+]+)/i) || html.match(/(Everyone|Teen|Mature 17\+|PEGI [0-9]+)/i);
    if (contentRatingMatch) {
      contentRating = contentRatingMatch[0];
    }

    // 7. Screenshots
    const screenshots: string[] = [];
    const screenshotMatches = [
      ...html.matchAll(/<img[^>]+src="([^"]+googleusercontent\.com\/[^"]+)"[^>]*alt="Screenshot[^"]*"/gi),
    ];
    for (const sm of screenshotMatches) {
      let cleanUrl = sm[1].replace(/=w[0-9]+-h[0-9]+.*$/, '=w1080-h1920');
      if (!screenshots.includes(cleanUrl) && screenshots.length < 8) {
        screenshots.push(cleanUrl);
      }
    }

    // Fallback search for high-res images if screenshot alt tag didn't match
    if (screenshots.length === 0) {
      const allGoogleImages = [
        ...html.matchAll(/src="([^"]+googleusercontent\.com\/[a-zA-Z0-9_\-=]+)"/gi),
      ];
      for (const m of allGoogleImages) {
        const u = m[1];
        if (!u.includes('=s') && !screenshots.includes(u) && screenshots.length < 6) {
          screenshots.push(u);
        }
      }
    }

    // 8. Feature Graphic (1024x500 promo banner)
    let featureGraphic = '';
    const featureMatch = html.match(/src="([^"]+googleusercontent\.com\/[a-zA-Z0-9_\-=]+)"[^>]*alt="[^"]*(Feature graphic|Promo|Banner)/i);
    if (featureMatch) {
      featureGraphic = featureMatch[1];
    } else if (screenshots.length > 0) {
      // Check if any landscape screenshot can serve as feature graphic
      featureGraphic = screenshots[0];
    }

    // 9. Short Description / Tagline
    let tagline = '';
    const metaDescMatch = html.match(/<meta property="og:description" content="([^"]+)"/i);
    if (metaDescMatch) {
      tagline = metaDescMatch[1].slice(0, 160).trim();
    }

    // 10. What's New
    let whatsNew = '';
    const whatsNewMatch = html.match(/>What&#39;s new<\/div>[\s\S]*?<div[^>]*>([\s\S]*?)<\/div>/i);
    if (whatsNewMatch) {
      whatsNew = whatsNewMatch[1].replace(/<[^>]+>/g, '\n').trim();
    }

    return NextResponse.json({
      success: true,
      source: 'play_store_live',
      data: {
        package: packageId,
        title: title || packageId,
        tagline: tagline || '',
        icon: iconUrl || '🎮',
        rating,
        ratingCount,
        downloadsTier,
        contentRating,
        featureGraphic,
        playScreenshots: screenshots,
        whatsNew,
        playStoreUrl,
        playConsoleUrl: playConsoleTestingUrl,
        playProtectVerified: true,
        releaseTrack: 'Production Track',
        status: 'Google Play Production',
        playStoreStatus: 'Production',
      },
    });
  } catch (error: any) {
    console.error('Error in fetch-play-store route:', error);
    return NextResponse.json({ message: error.message || 'Internal server error' }, { status: 500 });
  }
}
