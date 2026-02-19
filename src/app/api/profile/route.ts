import { NextRequest, NextResponse } from 'next/server';
import { getProfile, updateProfile, Profile } from '@/lib/storage';
import path from 'path';
import fs from 'fs';

export async function GET() {
  const profile = getProfile();
  return NextResponse.json(profile);
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    
    const pseudo = formData.get('pseudo') as string;
    const tagline = formData.get('tagline') as string;
    const instagram = formData.get('instagram') as string;
    const twitter = formData.get('twitter') as string;
    const youtube = formData.get('youtube') as string;
    
    // Handle Profile Picture
    const file = formData.get('profilePicture') as File | null;
    let profilePicturePath = undefined;

    // Handle Banner
    const bannerFile = formData.get('banner') as File | null;
    let bannerPath = undefined;

    // Handle Background
    const backgroundImageFile = formData.get('backgroundImage') as File | null;
    let backgroundImagePath = undefined;
    
    // Better blur parsing
    const backgroundBlurRaw = formData.get('backgroundBlur');
    const backgroundBlur = backgroundBlurRaw !== null ? parseInt(backgroundBlurRaw as string) : undefined;

    if (file && file.size > 0) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const fileName = `profile-${Date.now()}-${file.name.replace(/\s/g, '-')}`;
      const uploadDir = path.join(process.cwd(), 'public/uploads');
      
      if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filePath = path.join(uploadDir, fileName);
      fs.writeFileSync(filePath, buffer);
      profilePicturePath = `/uploads/${fileName}`;
    }

    if (bannerFile && bannerFile.size > 0) {
      const buffer = Buffer.from(await bannerFile.arrayBuffer());
      const fileName = `banner-${Date.now()}-${bannerFile.name.replace(/\s/g, '-')}`;
      const uploadDir = path.join(process.cwd(), 'public/uploads');

      if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filePath = path.join(uploadDir, fileName);
      fs.writeFileSync(filePath, buffer);
      bannerPath = `/uploads/${fileName}`;
    }

    if (backgroundImageFile && backgroundImageFile.size > 0) {
      const buffer = Buffer.from(await backgroundImageFile.arrayBuffer());
      const fileName = `bg-${Date.now()}-${backgroundImageFile.name.replace(/\s/g, '-')}`;
      const uploadDir = path.join(process.cwd(), 'public/uploads');

      if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filePath = path.join(uploadDir, fileName);
      fs.writeFileSync(filePath, buffer);
      backgroundImagePath = `/uploads/${fileName}`;
    }

    const currentProfile = getProfile();
    const updatedData: Partial<Profile> = {
      pseudo,
      tagline,
      socials: {
        instagram,
        twitter,
        youtube
      }
    };

    // Helper to delete old file
    const deleteOldFile = (relativePath?: string) => {
        if (!relativePath || !relativePath.startsWith('/uploads/')) return;
        const fullPath = path.join(process.cwd(), 'public', relativePath);
        if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    };

    // Handle Deletions
    if (formData.get('delete_profilePicture') === 'true') {
        deleteOldFile(currentProfile.profilePicture);
        updatedData.profilePicture = ''; 
    } else if (profilePicturePath) {
        // Only delete old if replacing
        if (currentProfile.profilePicture) deleteOldFile(currentProfile.profilePicture);
        updatedData.profilePicture = profilePicturePath;
    }

    if (formData.get('delete_banner') === 'true') {
        deleteOldFile(currentProfile.banner);
        updatedData.banner = undefined;
    } else if (bannerPath) {
        if (currentProfile.banner) deleteOldFile(currentProfile.banner);
        updatedData.banner = bannerPath;
    }

    if (formData.get('delete_backgroundImage') === 'true') {
        deleteOldFile(currentProfile.backgroundImage);
        updatedData.backgroundImage = undefined;
    } else if (backgroundImagePath) {
         if (currentProfile.backgroundImage) deleteOldFile(currentProfile.backgroundImage);
        updatedData.backgroundImage = backgroundImagePath;
    }

    if (backgroundBlur !== undefined) {
      updatedData.backgroundBlur = backgroundBlur;
    }

    const newProfile = updateProfile(updatedData);
    return NextResponse.json(newProfile);
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
