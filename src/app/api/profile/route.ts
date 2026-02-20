import { NextRequest, NextResponse } from 'next/server';
import { getProfile, updateProfile, uploadFile, deleteFile } from '@/lib/storage';

export async function GET() {
  const profile = await getProfile();
  return NextResponse.json(profile);
}

export async function POST(req: NextRequest) {
  let step = 'init';
  try {
    step = 'formData';
    const formData = await req.formData();

    const pseudo = formData.get('pseudo') as string;
    const tagline = formData.get('tagline') as string;
    const instagram = formData.get('instagram') as string | null;
    const twitter = formData.get('twitter') as string | null;
    const youtube = formData.get('youtube') as string | null;

    const profilePicFile = formData.get('profilePicture') as File | null;
    const bannerFile = formData.get('banner') as File | null;
    const bgFile = formData.get('backgroundImage') as File | null;

    const backgroundBlurRaw = formData.get('backgroundBlur');
    const backgroundBlur = backgroundBlurRaw !== null ? parseInt(backgroundBlurRaw as string) : undefined;

    step = 'getProfile';
    const currentProfile = await getProfile();

    const updatedData: Record<string, unknown> = {
      pseudo,
      tagline,
      socials: {
        instagram: instagram || '',
        twitter: twitter || '',
        youtube: youtube || '',
      },
    };

    // ── Profile picture ───────────────────────────────────────────────────
    step = 'profilePic';
    if (formData.get('delete_profilePicture') === 'true') {
      if (currentProfile.profile_picture) await deleteFile(currentProfile.profile_picture);
      updatedData.profile_picture = null;
    } else if (profilePicFile && profilePicFile.size > 0) {
      if (currentProfile.profile_picture) await deleteFile(currentProfile.profile_picture);
      updatedData.profile_picture = await uploadFile(profilePicFile, 'profile');
    }

    // ── Banner ────────────────────────────────────────────────────────────
    step = 'banner';
    if (formData.get('delete_banner') === 'true') {
      if (currentProfile.banner) await deleteFile(currentProfile.banner);
      updatedData.banner = null;
    } else if (bannerFile && bannerFile.size > 0) {
      if (currentProfile.banner) await deleteFile(currentProfile.banner);
      updatedData.banner = await uploadFile(bannerFile, 'banners');
    }

    // ── Background image ──────────────────────────────────────────────────
    step = 'background';
    if (formData.get('delete_backgroundImage') === 'true') {
      if (currentProfile.background_image) await deleteFile(currentProfile.background_image);
      updatedData.background_image = null;
    } else if (bgFile && bgFile.size > 0) {
      if (currentProfile.background_image) await deleteFile(currentProfile.background_image);
      updatedData.background_image = await uploadFile(bgFile, 'backgrounds');
    }

    if (backgroundBlur !== undefined) {
      updatedData.background_blur = backgroundBlur;
    }

    step = 'updateProfile';
    const newProfile = await updateProfile(updatedData as any);
    return NextResponse.json(newProfile);
  } catch (error: any) {
    console.error(`Profile update error at step [${step}]:`, error);
    return NextResponse.json(
      { error: 'Internal Server Error', step, detail: error?.message ?? String(error) },
      { status: 500 }
    );
  }
}
