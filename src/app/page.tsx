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
        {/* Navigation / Admin Link */}
        <nav className="fixed top-0 right-0 p-6 z-50 flex gap-4">
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
        <div className={cn("container mx-auto px-4 max-w-5xl relative z-10", profile.banner ? "-mt-20" : "pt-20")}>
             
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
