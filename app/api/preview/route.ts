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

    return new NextResponse(output, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-store'
      }
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: '미리보기를 생성하지 못했습니다.' }, { status: 500 });
  }
}
