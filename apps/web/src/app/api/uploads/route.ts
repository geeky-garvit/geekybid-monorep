import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, error: 'Image file is required.' }, { status: 400 });
    }

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      return NextResponse.json({ success: false, error: 'Only JPEG, PNG, WEBP, and GIF images are supported.' }, { status: 415 });
    }

    if (file.size === 0 || file.size > MAX_IMAGE_SIZE) {
      return NextResponse.json({ success: false, error: 'Image must be smaller than 10 MB.' }, { status: 413 });
    }

    const extension = file.type.split('/')[1] === 'jpeg' ? 'jpg' : file.type.split('/')[1];
    const fileName = `${randomUUID()}.${extension}`;
    const uploadDirectory = path.join(process.cwd(), 'public', 'uploads');

    await mkdir(uploadDirectory, { recursive: true });
    await writeFile(path.join(uploadDirectory, fileName), Buffer.from(await file.arrayBuffer()));

    return NextResponse.json({
      success: true,
      url: new URL(`/uploads/${fileName}`, request.url).toString(),
    });
  } catch (error) {
    console.error('Failed to upload image:', error);
    return NextResponse.json({ success: false, error: 'Failed to upload image.' }, { status: 500 });
  }
}