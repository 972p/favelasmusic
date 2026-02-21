"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, MessageSquare } from "lucide-react";
import { Comment } from "@/lib/storage";

interface CommentSectionProps {
    beatId: string;
}

export function CommentSection({ beatId }: CommentSectionProps) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [author, setAuthor] = useState("");
    const [content, setContent] = useState("");
    const [sending, setSending] = useState(false);

    useEffect(() => {
        fetch(`/api/beats/${beatId}/comments`)
            .then((r) => r.json())
            .then((data) => {
                setComments(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [beatId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!author.trim() || !content.trim()) return;
        setSending(true);
        try {
            const res = await fetch(`/api/beats/${beatId}/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ author: author.trim(), content: content.trim() }),
            });
            if (res.ok) {
                const newComment: Comment = await res.json();
                setComments((prev) => [...prev, newComment]);
                setContent("");
            }
        } finally {
            setSending(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
        >
            <div className="mx-4 mt-1 mb-3 rounded-xl bg-white/3 border border-white/5 p-4 space-y-4">
                {/* Existing comments */}
                <div className="space-y-3 max-h-52 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10">
                    {loading ? (
                        <p className="text-xs text-zinc-600 italic">Chargement…</p>
                    ) : comments.length === 0 ? (
                        <div className="flex items-center gap-2 text-xs text-zinc-600 italic">
                            <MessageSquare className="w-3.5 h-3.5" />
                            Aucun commentaire pour l'instant. Soyez le premier !
                        </div>
                    ) : (
                        <AnimatePresence initial={false}>
                            {comments.map((c) => (
                                <motion.div
                                    key={c.id}
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex gap-3"
                                >
                                    <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-zinc-300 shrink-0 uppercase">
                                        {c.author[0]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-xs font-semibold text-zinc-300">{c.author}</span>
                                            <span className="text-[10px] text-zinc-600">
                                                {new Date(c.created_at).toLocaleDateString("fr-FR", {
                                                    day: "numeric",
                                                    month: "short",
                                                })}
                                            </span>
                                        </div>
                                        <p className="text-xs text-zinc-400 mt-0.5 break-words">{c.content}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex flex-col gap-2 border-t border-white/5 pt-3">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={author}
                            onChange={(e) => setAuthor(e.target.value)}
                            placeholder="Pseudo"
                            maxLength={30}
                            className="w-28 shrink-0 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-white/25 transition-colors"
                        />
                        <input
                            type="text"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Laisse un commentaire…"
                            maxLength={300}
                            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-white/25 transition-colors"
                        />
                        <button
                            type="submit"
                            disabled={sending || !author.trim() || !content.trim()}
                            className="shrink-0 p-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-zinc-300"
                        >
                            <Send className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </form>
            </div>
        </motion.div>
    );
}
