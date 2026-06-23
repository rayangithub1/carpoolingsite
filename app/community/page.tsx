"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar"; // adjust path to match your project
import {
  Car,
  Send,
  MessageSquare,
  User,
  Clock,
  Users,
  LogOut,
  MapPin,
  ThumbsUp,
  Reply,
  X,
  Flame,
  AlertTriangle,
  Lightbulb,
  HelpCircle,
  Navigation,
  Heart,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Reply {
  id: number;
  name: string;
  text: string;
  createdAt: string;
}

interface Post {
  id: number;
  name: string;
  text: string;
  createdAt: string;
  likes: number;
  likedBy: number[];
  replies: Reply[];
  tag?: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const TAGS = [
  {
    label: "Ride chahiye",
    icon: Users,
    color: "bg-blue-50 text-blue-700 border-blue-200",
  },
  {
    label: "Seat available",
    icon: Car,
    color: "bg-green-50 text-green-700 border-green-200",
  },
  {
    label: "Traffic alert",
    icon: AlertTriangle,
    color: "bg-red-50 text-red-600 border-red-200",
  },
  {
    label: "Tip & advice",
    icon: Lightbulb,
    color: "bg-yellow-50 text-yellow-700 border-yellow-200",
  },
  {
    label: "Sawaal",
    icon: HelpCircle,
    color: "bg-purple-50 text-purple-700 border-purple-200",
  },
  {
    label: "Shukriya",
    icon: Heart,
    color: "bg-pink-50 text-pink-700 border-pink-200",
  },
];

const STARTER_POSTS: Post[] = [
  {
    id: 1,
    name: "Ahmed Raza",
    text: "Kal subah 7:30 AM ko Bahria Town se DHA Phase 5 jaana hai. Koi seat available hai? Rs 350 dene ko tayar hoon.",
    createdAt: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
    likes: 3,
    likedBy: [],
    replies: [
      { id: 101, name: "Ali Khan", text: "Bhai mere paas ek seat hai! Find Ride pe meri listing dekho 👍", createdAt: new Date(Date.now() - 1000 * 60 * 2).toISOString() },
    ],
    tag: "Ride chahiye",
  },
  {
    id: 2,
    name: "Sara Khan",
    text: "🚨 TRAFFIC ALERT: Shahrah-e-Faisal pe Nursery ke paas bahut jam hai abhi. Alternate route lo KPT se. Savdhaan rahein!",
    createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    likes: 24,
    likedBy: [],
    replies: [
      { id: 102, name: "Bilal", text: "Shukriya Sara baji! Mein abhi nikal raha tha 😅", createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString() },
      { id: 103, name: "Tariq", text: "KPT se bhi thodi der lag rahi hai but better hai", createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString() },
    ],
    tag: "Traffic alert",
  },
  {
    id: 3,
    name: "Bilal Mirza",
    text: "💡 PRO TIP: Sunday raat ko poori agle hafte ki rides book kar lo. Best drivers milte hain aur last minute tension nahi hoti. Mein 2 mahine se yeh kar raha hoon — zindagi aasan ho gayi!",
    createdAt: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
    likes: 31,
    likedBy: [],
    replies: [
      { id: 104, name: "Farhan", text: "Ekdum sahi baat hai bhai! Mein bhi yahi karta hoon 🔥", createdAt: new Date(Date.now() - 1000 * 60 * 40).toISOString() },
      { id: 105, name: "Zainab", text: "Bohot acha tip hai, try karungi!", createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString() },
    ],
    tag: "Tip & advice",
  },
  {
    id: 4,
    name: "Hassan Sheikh",
    text: "Aaj Clifton se Bahria Town 6:30 PM ko ja raha hoon. 2 seats available hain. Rs 400 per seat. Interested log bata dein!",
    createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    likes: 8,
    likedBy: [],
    replies: [],
    tag: "Seat available",
  },
];

const AVATAR_COLORS = [
  "bg-indigo-500", "bg-pink-500", "bg-teal-500",
  "bg-orange-500", "bg-violet-500", "bg-cyan-600",
  "bg-rose-500", "bg-amber-500", "bg-emerald-600",
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(date: string) {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60) return "ابھی ابھی";
  if (diff < 3600) return `${Math.floor(diff / 60)} منٹ پہلے`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} گھنٹے پہلے`;
  return new Date(date).toLocaleDateString("en-PK", { day: "numeric", month: "short" });
}

function avatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function tagInfo(label: string) {
  return (
    TAGS.find((t) => t.label === label) ?? {
      label,
      icon: MessageSquare,
      color: "bg-gray-50 text-gray-600 border-gray-200",
    }
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function CommunityPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [user, setUser] = useState<{ name: string } | null>(null);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [filterTag, setFilterTag] = useState("");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [newPostIds, setNewPostIds] = useState<number[]>([]);
  const [deviceId] = useState(() => {
    if (typeof window === "undefined") return 0;
    const stored = localStorage.getItem("device_id");
    if (stored) return Number(stored);
    const id = Date.now();
    localStorage.setItem("device_id", String(id));
    return id;
  });

  const patch = (raw: Post[]) =>
    raw.map((p) => ({
      ...p,
      likes: p.likes ?? 0,
      likedBy: p.likedBy ?? [],
      replies: p.replies ?? [],
    }));

  // Load on mount
  useEffect(() => {
    const stored = localStorage.getItem("community_posts");
    if (stored) {
      setPosts(patch(JSON.parse(stored)));
    } else {
      localStorage.setItem("community_posts", JSON.stringify(STARTER_POSTS));
      setPosts(STARTER_POSTS);
    }
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const u = JSON.parse(storedUser);
      setUser(u);
      setName(u.name);
    }
  }, []);

  // Live polling
  useEffect(() => {
    const interval = setInterval(() => {
      const stored = localStorage.getItem("community_posts");
      if (stored) setPosts(patch(JSON.parse(stored)));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const savePosts = (updated: Post[]) => {
    setPosts(updated);
    localStorage.setItem("community_posts", JSON.stringify(updated));
  };

  const handlePost = () => {
    if (!message.trim()) return;
    const newPost: Post = {
      id: Date.now(),
      name: name.trim() || "Stranger",
      text: message.trim(),
      createdAt: new Date().toISOString(),
      likes: 0,
      likedBy: [],
      replies: [],
      tag: selectedTag || undefined,
    };
    savePosts([newPost, ...posts]);
    setNewPostIds((prev) => [...prev, newPost.id]);
    setTimeout(() => setNewPostIds((prev) => prev.filter((id) => id !== newPost.id)), 2000);
    setMessage("");
    setSelectedTag("");
  };

  const handleLike = (postId: number) => {
    savePosts(posts.map((p) => {
      if (p.id !== postId) return p;
      const likedBy = p.likedBy ?? [];
      const alreadyLiked = likedBy.includes(deviceId);
      return {
        ...p,
        likes: alreadyLiked ? p.likes - 1 : p.likes + 1,
        likedBy: alreadyLiked ? likedBy.filter((id) => id !== deviceId) : [...likedBy, deviceId],
      };
    }));
  };

  const handleReply = (postId: number) => {
    if (!replyText.trim()) return;
    savePosts(posts.map((p) => {
      if (p.id !== postId) return p;
      return {
        ...p,
        replies: [...(p.replies ?? []), {
          id: Date.now(),
          name: name.trim() || "Stranger",
          text: replyText.trim(),
          createdAt: new Date().toISOString(),
        }],
      };
    }));
    setReplyText("");
    setReplyingTo(null);
  };

  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
    setName("");
  };

  const filtered = filterTag ? posts.filter((p) => p.tag === filterTag) : posts;
  const firstName = user?.name?.split(" ")[0] || "";
  const hotPosts = [...posts].sort((a, b) => (b.likes + b.replies.length * 2) - (a.likes + a.replies.length * 2)).slice(0, 3);

  return (
    <div className="min-h-screen bg-[#f9f9f8]">

      {/* ── NAVBAR ── */}
      <Navbar />

      {/* ── HERO ── */}
      <div className="pt-[76px] bg-black relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />

        <div className="relative z-10 max-w-[1100px] mx-auto px-6 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[10px] text-gray-400 tracking-widest">live community, violators will be banned permanently</span>
              </div>
              <h1 className="text-3xl font-black text-white tracking-tight leading-tight">
                Ride Sharing Pakistan<br />
                <span className="text-green-400">Abhi Book karo or travel karo in budget</span>
              </h1>
              <p className="text-gray-400 text-[13px] mt-2 max-w-md">
                Find Rides from Point A to Point B in Karachi in Budget, Save up to 60% here on Movento ride sharing. To abhi Ride book karo or travel karo
              </p>
            </div>

            {/* Live stats */}
            <div className="flex gap-4 sm:flex-col sm:items-end">
              <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-center">
                <div className="text-[24px] font-black text-white leading-none">{posts.length}</div>
                <div className="text-[11px] text-gray-500 mt-0.5">Posts</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-center">
                <div className="text-[24px] font-black text-green-400 leading-none">
                  {posts.reduce((acc, p) => acc + (p.replies?.length ?? 0), 0)}
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5">Replies</div>
              </div>
            </div>
          </div>

          {/* Tag quick filters */}
          <div className="flex gap-2 flex-wrap mt-6 pt-5 border-t border-white/8">
            <button onClick={() => setFilterTag("")}
              className={`flex items-center gap-1.5 text-[12px] font-bold px-3 py-1.5 rounded-full border transition-colors ${!filterTag ? "bg-white text-black border-white" : "border-white/20 text-gray-400 hover:border-white/40 hover:text-white"
                }`}>
              View all
            </button>
            {TAGS.map((tag) => {
              const Icon = tag.icon;

              return (
                <button
                  key={tag.label}
                  onClick={() =>
                    setFilterTag(filterTag === tag.label ? "" : tag.label)
                  }
                  className={`flex items-center gap-1.5 text-[12px] font-bold px-3 py-1.5 rounded-full border transition-colors ${filterTag === tag.label
                    ? "bg-white text-black border-white"
                    : "border-white/20 text-gray-400 hover:border-white/40 hover:text-white"
                    }`}
                >
                  <Icon size={14} />
                  {tag.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="max-w-[1100px] mx-auto px-4 py-6 flex gap-6 items-start">

        {/* ── MAIN FEED ── */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">

          {/* ── COMPOSE BOX ── */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-black text-white flex-shrink-0 ${avatarColor(name || "Stranger")}`}>
                {(name || "?").charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-[14px] font-black">{name || "Stranger"}</p>
                <p className="text-[11px] text-gray-400">Kuch share karo community ke saath</p>
              </div>
            </div>

            {!user && (
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Apna naam likho (optional)"
                className="w-full h-11 px-4 rounded-xl border border-gray-200 focus:border-black outline-none text-[13px] transition-colors mb-3"
              />
            )}

            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && e.metaKey) handlePost(); }}
              placeholder="Ride chahiye? Traffic update? Koi sawaal? Yahan likho... 👇"
              className="w-full rounded-xl border border-gray-200 focus:border-black outline-none p-4 resize-none text-[13px] transition-colors leading-relaxed mb-3"
            />

            {/* Tag selector */}
            <div className="flex flex-wrap gap-2 mb-4">
              <p className="w-full text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                Post ka type chunno:
              </p>
              {TAGS.map((tag) => {
                const Icon = tag.icon;

                return (
                  <button
                    key={tag.label}
                    onClick={() =>
                      setSelectedTag(
                        selectedTag === tag.label ? "" : tag.label
                      )
                    }
                    className={`flex items-center gap-1.5 text-[12px] font-bold px-3 py-1.5 rounded-full border transition-colors ${selectedTag === tag.label
                      ? "bg-black text-white border-black"
                      : "border-gray-200 text-gray-500 hover:border-black bg-gray-50"
                      }`}
                  >
                    <Icon size={14} />
                    <span>{tag.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between">
              <p className="text-[11px] text-gray-300">⌘ + Enter se bhi post ho jaata hai</p>
              <button onClick={handlePost} disabled={!message.trim()}
                className="flex items-center gap-2 px-5 py-2.5 bg-green-500 hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[13px] font-black rounded-xl transition-colors">
                <Send size={13} />
                Post Karo
              </button>
            </div>
          </div>

          {/* ── POSTS FEED ── */}
          {filtered.length === 0 ? (
            <div className="bg-white border border-dashed border-gray-200 rounded-2xl p-16 text-center">
              <MessageSquare size={28} className="text-gray-200 mx-auto mb-3" />
              <p className="font-black text-[16px] mb-1">Koi post nahi</p>
              <p className="text-[13px] text-gray-400">Pehla post aap karo!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filtered.map((post) => {
                const isLiked = (post.likedBy ?? []).includes(deviceId);
                const isReplying = replyingTo === post.id;
                const isNew = newPostIds.includes(post.id);
                const tag = post.tag ? tagInfo(post.tag) : null;

                return (
                  <div key={post.id}
                    className={`bg-white border rounded-2xl p-6 transition-all duration-500 ${isNew
                      ? "border-green-300 shadow-[0_0_0_3px_rgba(34,197,94,0.15)]"
                      : "border-gray-100 hover:border-gray-200"
                      }`}>

                    {/* Post header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[14px] font-black text-white flex-shrink-0 ${avatarColor(post.name)}`}>
                          {post.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-[14px] font-black leading-none">{post.name}</p>
                            {isNew && (
                              <span className="text-[10px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                                ✨ Naya
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1">
                            <Clock size={10} />
                            {timeAgo(post.createdAt)}
                          </p>
                        </div>
                      </div>
                      {tag && (
                        (() => {
                          const TagIcon = tag.icon;

                          return (
                            <span
                              className={`text-[11px] font-bold px-2.5 py-1 rounded-full border flex-shrink-0 flex items-center gap-1.5 ${tag.color}`}
                            >
                              <TagIcon size={12} />
                              {tag.label}
                            </span>
                          );
                        })()
                      )}
                    </div>

                    {/* Post text */}
                    <p className="text-[14px] text-gray-800 leading-relaxed whitespace-pre-wrap mb-4">
                      {post.text}
                    </p>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                      <button onClick={() => handleLike(post.id)}
                        className={`flex items-center gap-1.5 text-[12px] font-bold px-3 py-1.5 rounded-xl transition-all ${isLiked
                          ? "bg-green-500 text-white shadow-sm"
                          : "text-gray-500 hover:bg-gray-50 border border-gray-100"
                          }`}>
                        <ThumbsUp size={13} />
                        {post.likes > 0 ? `${post.likes} Helpful` : "Helpful"}
                      </button>

                      <button onClick={() => { setReplyingTo(isReplying ? null : post.id); setReplyText(""); }}
                        className="flex items-center gap-1.5 text-[12px] font-bold px-3 py-1.5 rounded-xl text-gray-500 hover:bg-gray-50 border border-gray-100 transition-colors">
                        <Reply size={13} />
                        Jawab do {post.replies?.length > 0 && `(${post.replies.length})`}
                      </button>
                    </div>

                    {/* Replies */}
                    {(post.replies ?? []).length > 0 && (
                      <div className="mt-4 space-y-3">
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                          {post.replies.length} {post.replies.length === 1 ? "Jawab" : "Jawabaat"}
                        </p>
                        <div className="pl-4 border-l-2 border-gray-100 space-y-3">
                          {post.replies.map((reply) => (
                            <div key={reply.id} className="flex gap-3">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black text-white flex-shrink-0 ${avatarColor(reply.name)}`}>
                                {reply.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0 bg-gray-50 rounded-xl px-3 py-2">
                                <div className="flex items-baseline gap-2 mb-0.5">
                                  <span className="text-[13px] font-black">{reply.name}</span>
                                  <span className="text-[10px] text-gray-400">{timeAgo(reply.createdAt)}</span>
                                </div>
                                <p className="text-[13px] text-gray-600 leading-relaxed">{reply.text}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Reply input */}
                    {isReplying && (
                      <div className="mt-3 flex gap-2">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black text-white flex-shrink-0 mt-1.5 ${avatarColor(name || "Stranger")}`}>
                          {(name || "?").charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 flex gap-2">
                          <input
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") handleReply(post.id); }}
                            placeholder="Jawab likho... (Enter dabao)"
                            autoFocus
                            className="flex-1 h-10 px-4 rounded-xl border border-gray-200 focus:border-black outline-none text-[13px] transition-colors bg-gray-50"
                          />
                          <button onClick={() => handleReply(post.id)} disabled={!replyText.trim()}
                            className="h-10 w-10 bg-black text-white rounded-xl flex items-center justify-center hover:bg-gray-800 transition-colors disabled:opacity-40 flex-shrink-0">
                            <Send size={13} />
                          </button>
                          <button onClick={() => setReplyingTo(null)}
                            className="h-10 w-10 border border-gray-200 rounded-xl flex items-center justify-center hover:border-black transition-colors text-gray-400 flex-shrink-0">
                            <X size={13} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── RIGHT SIDEBAR ── */}
        <aside className="hidden lg:flex flex-col gap-4 w-64 flex-shrink-0 sticky top-[76px]">

          {/* Quick actions */}
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
            <div className="bg-black px-5 py-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Quick Links</p>
            </div>
            {[
              { href: "/find-ride", icon: Navigation, label: "Ride Dhundho", desc: "Available seats dekho" },
              { href: "/offer-ride", icon: Car, label: "Ride Offer Karo", desc: "Khali seat share karo" },
              { href: "/dashboard", icon: User, label: "Mera Dashboard", desc: "Bookings dekho" },
            ].map(({ href, icon: Icon, label, desc }) => (
              <Link key={href} href={href}
                className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors group">
                <div className="w-8 h-8 rounded-xl bg-gray-50 group-hover:bg-black flex items-center justify-center transition-colors flex-shrink-0">
                  <Icon size={14} className="text-gray-400 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <p className="text-[13px] font-bold text-black">{label}</p>
                  <p className="text-[11px] text-gray-400">{desc}</p>
                </div>
              </Link>
            ))}
          </div>

          {/* Filter by tag */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3">Filter karo</p>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => setFilterTag("")}
                className={`text-left text-[13px] px-3 py-2 rounded-xl font-bold transition-colors ${!filterTag
                    ? "bg-black text-white"
                    : "text-gray-600 hover:bg-gray-50"
                  }`}
              >
                Sab Posts
              </button>

              {TAGS.map((tag) => {
                const Icon = tag.icon;

                return (
                  <button
                    key={tag.label}
                    onClick={() =>
                      setFilterTag(filterTag === tag.label ? "" : tag.label)
                    }
                    className={`flex items-center gap-2 text-left text-[13px] px-3 py-2 rounded-xl font-bold transition-colors ${filterTag === tag.label
                        ? "bg-black text-white"
                        : "text-gray-600 hover:bg-gray-50"
                      }`}
                  >
                    <Icon size={14} />
                    <span>{tag.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Community vibe */}
          <div className="bg-black rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.05] pointer-events-none"
              style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "18px 18px" }} />
            <p className="text-[13px] font-black text-white mb-1 relative z-10">Movento Ride Sharing</p>
            <p className="text-[11px] text-gray-400 leading-relaxed relative z-10">
              This Community is for Karachi Citizens only for now, help each other, answer to questions and ride safely
            </p>
          </div>

        </aside>
      </div>
    </div>
  );
}