'use client';

import { Profile } from '@/lib/storage';

export function SiteBackground({ profile }: { profile: Profile }) {
    const bgImage = profile.background_image;
    const blurAmount = profile.background_blur !== undefined ? profile.background_blur : 0;

    if (!bgImage) {
        return <div className="fixed inset-0 z-[-2] bg-[#050505]" />;
    }

    return (
        <div
            className="fixed inset-0 z-[-2] pointer-events-none transition-all duration-700 ease-in-out"
            style={{
                backgroundImage: `url('${bgImage}')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                filter: `blur(${blurAmount}px)`,
                opacity: 0.6
            }}
        />
    );
}
