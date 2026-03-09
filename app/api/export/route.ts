import { NextResponse } from 'next/server';
import { applyWatermark, parseOptions } from '@/lib/watermark';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get('image');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: '이미지 파일이 필요합니다.' }, { status: 400 });
    }

    const imageBuffer = Buffer.from(await file.arrayBuffer());
    const options = parseOptions({
      text: form.get('text'),
      placement: form.get('placement'),
      opacity: form.get('opacity'),
      margin: form.get('margin'),
      fontSize: form.get('fontSize'),
      color: form.get('color')
    });

    const output = await applyWatermark(imageBuffer, options);
    const baseName = file.name.replace(/\.[^.]+$/, '') || 'watermarked-image';
    const asciiBaseName = baseName.replace(/[^\x20-\x7E]/g, '_');
    const encodedFileName = encodeURIComponent(`${baseName}-watermarked.png`);

    return new NextResponse(output, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="${asciiBaseName || 'watermarked-image'}-watermarked.png"; filename*=UTF-8''${encodedFileName}`,
        'Cache-Control': 'no-store'
      }
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: '이미지를 내보내지 못했습니다.' }, { status: 500 });
  }
}
