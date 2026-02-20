import { getBeats, getProfile } from '@/lib/storage';
import { TrackRow } from '@/components/TrackRow';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';
import { Lock, Instagram, Twitter, Youtube, MoreHorizontal } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function Home() {
    const beats = getBeats();
    const profile = getProfile();

    return (
        <main className="min-h-screen pb-32"> {/* Padding bottom for player */}
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 px-6 py-3 z-50 flex items-center justify-between bg-black/40 backdrop-blur-sm border-b border-white/5">
                <svg width="200" height="60" viewBox="0 0 500 150" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <linearGradient id="gradUrban" x1="0%" y1="100%" x2="100%" y2="0%">
                            <stop offset="0%" style={{ stopColor: '#5B2C6F', stopOpacity: 1 }} />
                            <stop offset="100%" style={{ stopColor: '#E67E22', stopOpacity: 1 }} />
                        </linearGradient>
                    </defs>
                    <g transform="translate(50, 75)">
                        <rect x="0" y="-20" width="12" height="40" rx="2" fill="url(#gradUrban)" opacity="0.7" />
                        <rect x="0" y="-45" width="12" height="20" rx="2" fill="url(#gradUrban)" />
                        <rect x="16" y="-30" width="12" height="60" rx="2" fill="url(#gradUrban)" />
                        <rect x="16" y="-60" width="12" height="25" rx="2" fill="url(#gradUrban)" opacity="0.8" />
                        <rect x="32" y="-10" width="12" height="20" rx="2" fill="url(#gradUrban)" />
                        <rect x="32" y="-40" width="12" height="25" rx="2" fill="url(#gradUrban)" opacity="0.9" />
                        <rect x="32" y="-65" width="12" height="20" rx="2" fill="url(#gradUrban)" />
                        <rect x="48" y="-25" width="12" height="50" rx="2" fill="url(#gradUrban)" opacity="0.6" />
                    </g>
                    <g transform="translate(130, 85)">
                        <text x="0" y="0" fontFamily="'Helvetica Neue', Helvetica, Arial, sans-serif" fontWeight="900" fontSize="42" fill="white" letterSpacing="-1">
                            FAVELAS<tspan fill="url(#gradUrban)">MUSIC</tspan>
                        </text>
                    </g>
                </svg>
                <Link href="/admin" className="text-zinc-500 hover:text-white transition-colors duration-300">
                    <Lock className="w-5 h-5" />
                </Link>
            </nav>

            {/* Banner */}
            {profile.banner && (
                <div className="relative w-full h-64 md:h-80">
                    <Image
                        src={profile.banner}
                        alt="Banner"
                        fill
                        className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black"></div>
                </div>
            )}

            {/* Dashboard Layout */}
            <div className={cn("container mx-auto px-4 max-w-5xl relative z-10", profile.banner ? "mt-[60px] -mt-20" : "pt-[80px]")}>

                {/* Header / Profile */}
                <header className="mb-12 flex flex-col md:flex-row items-start md:items-end justify-between gap-6 border-b border-white/5 pb-8">
                    <div className="flex items-center gap-6">
                        <div className="relative w-20 h-20 rounded-full overflow-hidden border border-white/10 shadow-2xl">
                            {profile.profilePicture ? (
                                <Image
                                    src={profile.profilePicture}
                                    alt={profile.pseudo}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-zinc-900 flex items-center justify-center text-zinc-500 text-2xl">
                                    {profile.pseudo[0]}
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col">
                            <h1 className="text-3xl font-bold tracking-tight text-white">
                                {profile.pseudo}
                            </h1>
                            <p className="text-zinc-500 text-sm">
                                {profile.tagline || "Workspace"}
                            </p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                        {profile.socials?.instagram && (
                            <a href={profile.socials.instagram} target="_blank" rel="noopener noreferrer" className="p-2 text-zinc-500 hover:text-white transition-colors">
                                <Instagram className="w-5 h-5" />
                            </a>
                        )}
                        {profile.socials?.twitter && (
                            <a href={profile.socials.twitter} target="_blank" rel="noopener noreferrer" className="p-2 text-zinc-500 hover:text-white transition-colors">
                                <Twitter className="w-5 h-5" />
                            </a>
                        )}
                        {profile.socials?.youtube && (
                            <a href={profile.socials.youtube} target="_blank" rel="noopener noreferrer" className="p-2 text-zinc-500 hover:text-white transition-colors">
                                <Youtube className="w-5 h-5" />
                            </a>
                        )}
                        <button className="p-2 text-zinc-500 hover:text-white transition-colors">
                            <MoreHorizontal className="w-5 h-5" />
                        </button>
                    </div>
                </header>

                {/* Track List */}
                <div className="space-y-1">
                    <div className="flex items-center justify-between px-4 py-2 text-xs font-mono text-zinc-600 uppercase tracking-wider mb-2">
                        <span>Title</span>
                        <span className="hidden md:block pr-24">Properties</span>
                    </div>

                    {beats.length > 0 ? (
                        beats.map((beat, index) => (
                            <TrackRow key={beat.id} beat={beat} index={index} />
                        ))
                    ) : (
                        <div className="text-center py-20 text-zinc-600">
                            No tracks uploaded yet.
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
