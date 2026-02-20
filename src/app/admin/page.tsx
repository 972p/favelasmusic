'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, User, Music, LogOut, Trash2, Plus, X, Check, Disc, FileAudio, Tag } from 'lucide-react';
import Link from 'next/link';
import { formatTime, cn } from '@/lib/utils';
import { useToastStore } from '@/store/useToastStore';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { analyzeAudio } from '@/lib/audio-analysis';

const MUSICAL_KEYS = [
    "C Major", "C Minor",
    "C# Major", "C# Minor",
    "D Major", "D Minor",
    "D# Major", "D# Minor",
    "E Major", "E Minor",
    "F Major", "F Minor",
    "F# Major", "F# Minor",
    "G Major", "G Minor",
    "G# Major", "G# Minor",
    "A Major", "A Minor",
    "A# Major", "A# Minor",
    "B Major", "B Minor"
];

// Helper to normalize key from Essentia
const normalizeKey = (key: string) => {
    // Essentia returns "C major", "C minor" etc.
    // Capitalize first letter
    let normalized = key.charAt(0).toUpperCase() + key.slice(1);
    // Replace "major" with "Major", "minor" with "Minor"
    normalized = normalized.replace("major", "Major").replace("minor", "Minor");

    // Map flats to sharps to match our list if needed
    // "Db" -> "C#", "Eb" -> "D#", "Gb" -> "F#", "Ab" -> "G#", "Bb" -> "A#"
    // Note: Essentia might return "Bb" or "A#".
    const flatToSharp: { [key: string]: string } = {
        "Db": "C#", "Eb": "D#", "Gb": "F#", "Ab": "G#", "Bb": "A#"
    };

    // Check if the root note is in our map
    const parts = normalized.split(' ');
    if (parts.length === 2 && flatToSharp[parts[0]]) {
        return `${flatToSharp[parts[0]]} ${parts[1]}`;
    }

    return normalized;
};

interface Beat {
    id: string;
    title: string;
    bpm: number;
    key: string;
    coverPath: string;
}

interface Profile {
    pseudo: string;
    tagline: string;
    profilePicture: string;
    banner?: string;
    backgroundImage?: string;
    backgroundBlur?: number;
    socials: {
        instagram?: string;
        twitter?: string;
        youtube?: string;
    }
}

export default function AdminPage() {
    const [activeTab, setActiveTab] = useState<'library' | 'upload' | 'settings'>('library');
    const [beats, setBeats] = useState<Beat[]>([]);
    const [profile, setProfile] = useState<Profile | null>(null);
    const router = useRouter();
    const { addToast } = useToastStore();
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const [loading, setLoading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [coverName, setCoverName] = useState<string | null>(null);
    const [audioName, setAudioName] = useState<string | null>(null);
    const [isForSale, setIsForSale] = useState(false);

    const coverInputRef = useRef<HTMLInputElement>(null);
    const audioInputRef = useRef<HTMLInputElement>(null);

    // Profile State
    const profilePicInputRef = useRef<HTMLInputElement>(null);
    const [profilePicName, setProfilePicName] = useState<string | null>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);
    const [bannerName, setBannerName] = useState<string | null>(null);
    const bgInputRef = useRef<HTMLInputElement>(null);
    const [bgName, setBgName] = useState<string | null>(null);

    // Removal State
    const [removeProfilePic, setRemoveProfilePic] = useState(false);
    const [removeBanner, setRemoveBanner] = useState(false);
    const [removeBg, setRemoveBg] = useState(false);

    useEffect(() => {
        if (activeTab === 'library') fetchBeats();
        if (activeTab === 'settings') fetchProfile();
    }, [activeTab]);

    const fetchBeats = () => {
        fetch('/api/beats')
            .then(res => res.json())
            .then(data => setBeats(data))
            .catch(console.error);
    };

    const fetchProfile = () => {
        fetch('/api/profile')
            .then(res => res.json())
            .then(data => setProfile(data))
            .catch(console.error);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (name: string | null) => void) => {
        if (e.target.files && e.target.files[0]) {
            setter(e.target.files[0].name);
        } else {
            setter(null);
        }
    };

    const handleAudioChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAudioName(file.name);
            setAnalyzing(true);
            addToast("Analyzing audio for BPM and Key...", "info");

            try {
                const result = await analyzeAudio(file);
                console.log("Analysis result:", result);

                if (result) {
                    const bpmInput = document.querySelector('input[name="bpm"]') as HTMLInputElement;
                    const keySelect = document.querySelector('select[name="key"]') as HTMLSelectElement;

                    if (bpmInput) {
                        bpmInput.value = result.bpm.toString();
                    }

                    if (keySelect) {
                        let detectedKey = normalizeKey(result.key);
                        // Check if valid
                        if (MUSICAL_KEYS.includes(detectedKey)) {
                            keySelect.value = detectedKey;
                        } else {
                            console.log("Key not found in list:", detectedKey);
                        }
                    }

                    addToast(`Detected: ${result.bpm} BPM, ${normalizeKey(result.key)}`, "success");
                } else {
                    addToast("Could not detect BPM/Key, please enter manually", "error");
                }
            } catch (err) {
                console.error(err);
                addToast("Analysis failed", "error");
            } finally {
                setAnalyzing(false);
            }
        } else {
            setAudioName(null);
        }
    };

    async function handleUploadSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);

        formData.append('forSale', isForSale.toString());

        try {
            const res = await fetch('/api/beats', { method: 'POST', body: formData });
            if (res.ok) {
                setCoverName(null);
                setAudioName(null);
                setIsForSale(false);
                setActiveTab('library');
                fetchBeats();
                addToast('Track published successfully', 'success');
            } else {
                addToast('Upload failed', 'error');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    async function confirmDelete() {
        if (!deleteId) return;
        try {
            const res = await fetch(`/api/beats/${deleteId}`, { method: 'DELETE' });
            if (res.ok) {
                fetchBeats();
                addToast('Track deleted', 'success');
            } else {
                addToast('Failed to delete track', 'error');
            }
        } catch (err) {
            console.error(err);
            addToast('Error deleting track', 'error');
        }
        setDeleteId(null);
    }

    async function handleProfileSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);

        if (removeProfilePic) formData.append('delete_profilePicture', 'true');
        if (removeBanner) formData.append('delete_banner', 'true');
        if (removeBg) formData.append('delete_backgroundImage', 'true');

        try {
            const res = await fetch('/api/profile', { method: 'POST', body: formData });
            if (res.ok) {
                addToast('Profile updated', 'success');
                setProfilePicName(null);
                setBannerName(null);
                setProfilePicName(null);
                setBannerName(null);
                setBgName(null);
                setRemoveProfilePic(false);
                setRemoveBanner(false);
                setRemoveBg(false);
                fetchProfile(); // Refresh local state
            }
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }

    return (
        <div className="min-h-screen pb-20">

            {/* Top Navigation */}
            <header className="fixed top-0 left-0 right-0 z-40 bg-black/50 backdrop-blur-xl border-b border-white/5">
                <div className="container mx-auto max-w-5xl px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <Link href="/" className="text-zinc-500 hover:text-white transition-colors text-sm uppercase tracking-widest font-medium">
                            View Site
                        </Link>

                        <nav className="flex items-center gap-1">
                            <button
                                onClick={() => setActiveTab('library')}
                                className={cn(
                                    "px-4 py-2 rounded-full text-xs uppercase tracking-wider transition-all",
                                    activeTab === 'library' ? "bg-white text-black font-bold" : "text-zinc-500 hover:text-zinc-300"
                                )}
                            >
                                Library
                            </button>
                            <button
                                onClick={() => setActiveTab('upload')}
                                className={cn(
                                    "px-4 py-2 rounded-full text-xs uppercase tracking-wider transition-all",
                                    activeTab === 'upload' ? "bg-white text-black font-bold" : "text-zinc-500 hover:text-zinc-300"
                                )}
                            >
                                Upload
                            </button>
                            <button
                                onClick={() => setActiveTab('settings')}
                                className={cn(
                                    "px-4 py-2 rounded-full text-xs uppercase tracking-wider transition-all",
                                    activeTab === 'settings' ? "bg-white text-black font-bold" : "text-zinc-500 hover:text-zinc-300"
                                )}
                            >
                                Settings
                            </button>
                        </nav>
                    </div>

                    <button
                        onClick={async () => {
                            await fetch('/api/auth/logout', { method: 'POST' });
                            router.push('/login');
                        }}
                        className="text-zinc-600 hover:text-white transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </header>

            {/* Content Area */}
            <main className="container mx-auto max-w-3xl px-4 pt-32">

                {/* LIBRARY TAB */}
                {activeTab === 'library' && (
                    <div className="space-y-1">
                        <div className="flex items-center justify-between px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-zinc-600">
                            <span>Track Name</span>
                            <div className="flex gap-12">
                                <span className="w-16">BPM</span>
                                <span className="w-16">Key</span>
                                <span className="w-8"></span>
                            </div>
                        </div>

                        {beats.map((beat) => (
                            <div key={beat.id} className="group flex items-center justify-between p-3 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/5 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 bg-zinc-900 rounded overflow-hidden flex-shrink-0">
                                        {beat.coverPath && <img src={beat.coverPath} alt="" className="w-full h-full object-cover" />}
                                    </div>
                                    <span className="text-zinc-300 font-medium text-sm">{beat.title}</span>
                                </div>

                                <div className="flex items-center gap-12 text-xs font-mono text-zinc-500">
                                    <span className="w-16">{beat.bpm}</span>
                                    <span className="w-16">{beat.key}</span>
                                    <div className="w-8 flex justify-end">
                                        <button
                                            onClick={() => setDeleteId(beat.id)}
                                            className="text-zinc-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {beats.length === 0 && (
                            <div className="text-center py-20 text-zinc-700">
                                <Music className="w-8 h-8 mx-auto mb-4 opacity-20" />
                                <p className="text-xs uppercase tracking-widest">No tracks found</p>
                            </div>
                        )}
                    </div>
                )}

                {/* UPLOAD TAB */}
                {activeTab === 'upload' && (
                    <form onSubmit={handleUploadSubmit} className="space-y-12 animate-in fade-in pb-10">
                        <div className="space-y-6">
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Track Title</label>
                                <input
                                    name="title" required placeholder="Untitled Track"
                                    className="bg-transparent border-b border-white/10 py-2 text-2xl text-white placeholder-zinc-800 focus:outline-none focus:border-white/50 transition-colors"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Description (Optional)</label>
                                <textarea
                                    name="description" placeholder="About this track..."
                                    className="bg-transparent border-b border-white/10 py-2 text-sm text-zinc-300 placeholder-zinc-800 focus:outline-none focus:border-white/50 transition-colors resize-none h-20"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">BPM</label>
                                    <input
                                        name="bpm" type="number" required placeholder="120"
                                        className="bg-transparent border-b border-white/10 py-2 text-lg font-mono text-zinc-300 placeholder-zinc-800 focus:outline-none focus:border-white/50 transition-colors"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Musical Key</label>
                                    <select
                                        name="key"
                                        required
                                        defaultValue=""
                                        className="bg-transparent border-b border-white/10 py-2 text-lg font-mono text-zinc-300 focus:outline-none focus:border-white/50 transition-colors [&>option]:bg-zinc-900"
                                    >
                                        <option value="" disabled>Select Key</option>
                                        {MUSICAL_KEYS.map((key) => (
                                            <option key={key} value={key}>{key}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Pricing Details */}
                            <div className="space-y-4 pt-6 mt-6 border-t border-white/5">
                                <h3 className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
                                    <Tag className="w-4 h-4" /> Pricing & Sales
                                </h3>
                                <div className="flex flex-col gap-4">
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <div className={cn(
                                            "w-5 h-5 rounded border flex items-center justify-center transition-all",
                                            isForSale ? "bg-green-500 border-green-500 text-black" : "border-white/20 group-hover:border-white/50"
                                        )}>
                                            {isForSale && <Check className="w-3 h-3" />}
                                        </div>
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={isForSale}
                                            onChange={(e) => setIsForSale(e.target.checked)}
                                        />
                                        <span className="text-zinc-300 group-hover:text-white transition-colors">Put this track up for sale</span>
                                    </label>

                                    {isForSale && (
                                        <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-2">
                                            <label className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Price</label>
                                            <div className="relative">
                                                <span className="absolute left-0 top-1/2 -translate-y-1/2 text-zinc-500 text-lg">€</span>
                                                <input
                                                    name="price"
                                                    type="number"
                                                    step="0.01"
                                                    min="0.01"
                                                    required={isForSale}
                                                    placeholder="19.99"
                                                    className="bg-transparent border-b border-white/10 py-2 pl-6 w-32 text-lg font-mono text-zinc-300 placeholder-zinc-800 focus:outline-none focus:border-white/50 transition-colors"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Audio Drop */}
                            <div className={cn(
                                "relative aspect-video rounded-xl border border-dashed transition-all flex flex-col items-center justify-center gap-4 group cursor-pointer",
                                audioName ? "border-green-500/30 bg-green-500/5" : "border-white/10 hover:border-white/30 hover:bg-white/5"
                            )}>
                                <input
                                    ref={audioInputRef} name="audio" type="file" accept="audio/*" required
                                    onChange={handleAudioChange}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                                <FileAudio className={cn("w-8 h-8 transition-colors", audioName ? "text-green-500" : "text-zinc-700 group-hover:text-zinc-500")} />
                                <span className="text-xs uppercase tracking-widest text-zinc-500">
                                    {analyzing ? "Analyzing..." : (audioName || "Drop Audio File")}
                                </span>
                            </div>

                            {/* Cover Drop */}
                            <div className={cn(
                                "relative aspect-video rounded-xl border border-dashed transition-all flex flex-col items-center justify-center gap-4 group cursor-pointer",
                                coverName ? "border-green-500/30 bg-green-500/5" : "border-white/10 hover:border-white/30 hover:bg-white/5"
                            )}>
                                <input
                                    ref={coverInputRef} name="cover" type="file" accept="image/*"
                                    onChange={(e) => handleFileChange(e, setCoverName)}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                                <Disc className={cn("w-8 h-8 transition-colors", coverName ? "text-green-500" : "text-zinc-700 group-hover:text-zinc-500")} />
                                <span className="text-xs uppercase tracking-widest text-zinc-500">{coverName || "Drop Cover Art"}</span>
                            </div>
                        </div>

                        <button
                            type="submit" disabled={loading}
                            className="w-full py-4 bg-white text-black text-xs font-bold uppercase tracking-[0.2em] rounded hover:bg-zinc-200 transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Processing...' : 'Publish Track'}
                        </button>
                    </form>
                )}

                {/* SETTINGS TAB */}
                {activeTab === 'settings' && profile && (
                    <form onSubmit={handleProfileSubmit} className="space-y-12 animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex items-center gap-8">
                            <div className="relative w-24 h-24 rounded-full bg-zinc-900 overflow-hidden group shrink-0 border border-white/10">
                                <input
                                    ref={profilePicInputRef} name="profilePicture" type="file" accept="image/*"
                                    onChange={(e) => handleFileChange(e, setProfilePicName)}
                                    className="absolute inset-0 opacity-0 cursor-pointer z-20"
                                />
                                {/* Use current profile pic if available */}
                                {profile.profilePicture && !profilePicName && !removeProfilePic && (
                                    <img src={profile.profilePicture} alt="Current" className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-30 transition-opacity" />
                                )}
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                    <Plus className="w-6 h-6 text-white" />
                                </div>
                                {(!profile.profilePicture || removeProfilePic) && !profilePicName && (
                                    <User className="w-10 h-10 text-zinc-700 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                )}
                                {profilePicName && <div className="absolute inset-0 bg-green-500/20 z-0" />}

                                {/* Remove Button for Profile Pic */}
                                {(profile.profilePicture || profilePicName) && !removeProfilePic && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (profilePicName) {
                                                setProfilePicName(null);
                                                if (profilePicInputRef.current) profilePicInputRef.current.value = '';
                                            } else {
                                                setRemoveProfilePic(true);
                                            }
                                        }}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 z-30"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                            <div className="flex-1 space-y-4">
                                <div className="flex flex-col gap-1">
                                    <label className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Display Name</label>
                                    <input
                                        name="pseudo"
                                        defaultValue={profile.pseudo}
                                        placeholder="Artist Name"
                                        className="bg-transparent border-b border-white/10 py-2 text-white focus:outline-none focus:border-white/50 transition-colors"
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Bio / Tagline</label>
                                    <input
                                        name="tagline"
                                        defaultValue={profile.tagline}
                                        placeholder="Short description"
                                        className="bg-transparent border-b border-white/10 py-2 text-zinc-300 text-sm focus:outline-none focus:border-white/50 transition-colors"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Banner Upload */}
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Profile Banner</label>
                            <div className={cn(
                                "relative h-32 w-full rounded-xl border border-dashed transition-all flex flex-col items-center justify-center gap-4 group cursor-pointer overflow-hidden",
                                bannerName ? "border-green-500/30 bg-green-500/5" : "border-white/10 hover:border-white/30 hover:bg-white/5"
                            )}>
                                <input
                                    ref={bannerInputRef} name="banner" type="file" accept="image/*"
                                    onChange={(e) => handleFileChange(e, setBannerName)}
                                    className="absolute inset-0 opacity-0 cursor-pointer z-20"
                                />

                                {/* Current Banner Preview */}
                                {profile.banner && !bannerName && !removeBanner && (
                                    <img src={profile.banner} alt="Current Banner" className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-20 transition-opacity" />
                                )}

                                <div className="z-10 flex flex-col items-center">
                                    <Plus className={cn("w-6 h-6 mb-2 transition-colors", bannerName ? "text-green-500" : "text-zinc-600 group-hover:text-zinc-400")} />
                                    <span className="text-xs uppercase tracking-widest text-zinc-500">{bannerName || "Upload Banner Image"}</span>
                                </div>

                                {/* Remove Button for Banner */}
                                {(profile.banner || bannerName) && !removeBanner && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            if (bannerName) {
                                                setBannerName(null);
                                                if (bannerInputRef.current) bannerInputRef.current.value = '';
                                            } else {
                                                setRemoveBanner(true);
                                            }
                                        }}
                                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 z-30"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Background Settings */}
                        <div className="space-y-4 pt-6 border-t border-white/5">
                            <h3 className="text-xs uppercase tracking-widest text-zinc-500 pb-2">Site Appearance</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-[0.2em] text-zinc-600">Site Background Interface</label>
                                    <div className={cn(
                                        "relative h-24 w-full rounded-xl border border-dashed transition-all flex flex-col items-center justify-center gap-2 group cursor-pointer overflow-hidden",
                                        bgName ? "border-green-500/30 bg-green-500/5" : "border-white/10 hover:border-white/30 hover:bg-white/5"
                                    )}>
                                        <input
                                            ref={bgInputRef} name="backgroundImage" type="file" accept="image/*"
                                            onChange={(e) => handleFileChange(e, setBgName)}
                                            className="absolute inset-0 opacity-0 cursor-pointer z-20"
                                        />
                                        <div className="z-10 flex flex-col items-center">
                                            <Plus className={cn("w-5 h-5 mb-1 transition-colors", bgName ? "text-green-500" : "text-zinc-600 group-hover:text-zinc-400")} />
                                            <span className="text-[10px] uppercase tracking-widest text-zinc-500">{bgName || "Upload Background"}</span>
                                        </div>

                                        {/* Remove Button for Background */}
                                        {(profile.backgroundImage || bgName) && !removeBg && (
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    if (bgName) {
                                                        setBgName(null);
                                                        if (bgInputRef.current) bgInputRef.current.value = '';
                                                    } else {
                                                        setRemoveBg(true);
                                                    }
                                                }}
                                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 z-30"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-[0.2em] text-zinc-600">Background Blur (px)</label>
                                    <div className="flex items-center gap-4 h-24">
                                        <input
                                            name="backgroundBlur"
                                            type="range"
                                            min="0" max="20" step="1"
                                            defaultValue={profile.backgroundBlur ?? 4}
                                            className="w-full accent-white"
                                        />
                                        <span className="font-mono text-zinc-400 w-8 text-center">{profile.backgroundBlur ?? 4}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h3 className="text-xs uppercase tracking-widest text-zinc-500 border-b border-white/5 pb-2">Social Links</h3>
                            {['instagram', 'twitter', 'youtube'].map((social) => (
                                <div key={social} className="flex flex-col gap-1">
                                    <label className="text-[10px] uppercase tracking-[0.2em] text-zinc-600">{social}</label>
                                    <input
                                        name={social}
                                        defaultValue={(profile.socials as any)?.[social] || ''}
                                        placeholder={`https://${social}.com/...`}
                                        className="bg-transparent border-b border-white/10 py-2 text-zinc-400 text-sm focus:outline-none focus:border-white/50 transition-colors font-mono"
                                    />
                                </div>
                            ))}
                        </div>

                        <button
                            type="submit" disabled={loading}
                            className="px-8 py-3 bg-white text-black text-xs font-bold uppercase tracking-[0.2em] rounded hover:bg-zinc-200 transition-colors disabled:opacity-50 float-right"
                        >
                            {loading ? 'Saving...' : 'Update Profile'}
                        </button>
                    </form>
                )}
            </main>
            <ConfirmModal
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={confirmDelete}
                title="Delete Track"
                description="Are you sure you want to delete this track? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                isDestructive={true}
            />
        </div>
    );
}
