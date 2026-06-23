"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
    Car, Shield, CheckCircle, XCircle, Clock, Eye, RefreshCw,
    Search, Filter, ChevronDown, AlertCircle, Loader2, X,
    Download, BarChart2, Users, TrendingUp, ZoomIn,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

// ─── Types ────────────────────────────────────────────────────────────────────

type VerificationStatus = "pending" | "approved" | "rejected" | "flagged";

interface Verification {
    id: string;
    user_id: string;
    full_name: string | null;
    cnic_front_url: string;
    cnic_back_url: string;
    selfie_url: string;
    status: VerificationStatus;
    created_at: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<VerificationStatus, {
    label: string;
    bg: string;
    text: string;
    border: string;
    icon: React.ElementType;
}> = {
    pending:  { label: "Pending",  bg: "bg-yellow-50",  text: "text-yellow-700", border: "border-yellow-200", icon: Clock },
    approved: { label: "Approved", bg: "bg-green-50",   text: "text-green-700",  border: "border-green-200",  icon: CheckCircle },
    rejected: { label: "Rejected", bg: "bg-red-50",     text: "text-red-700",    border: "border-red-200",    icon: XCircle },
    flagged:  { label: "Flagged",  bg: "bg-orange-50",  text: "text-orange-700", border: "border-orange-200", icon: AlertCircle },
};

const REJECTION_REASONS = [
    "CNIC image is blurry or unreadable",
    "CNIC appears to be expired",
    "Face does not match CNIC photo",
    "CNIC image is incomplete (corners cut off)",
    "Suspected fraudulent document",
    "Selfie quality too low",
    "Custom reason…",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1)  return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
}

function fmtDate(iso: string): string {
    return new Date(iso).toLocaleDateString("en-PK", {
        day: "numeric", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
}

// ─── Image lightbox ───────────────────────────────────────────────────────────

function Lightbox({ url, label, onClose }: { url: string; label: string; onClose: () => void }) {
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div className="relative max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
                <div className="bg-black rounded-t-2xl px-5 py-3 flex items-center justify-between">
                    <p className="text-[12px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X size={18} />
                    </button>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={label} className="w-full rounded-b-2xl object-contain max-h-[80vh]" />
            </div>
        </div>
    );
}

// ─── Image thumbnail ──────────────────────────────────────────────────────────

function Thumb({ url, label }: { url: string; label: string }) {
    const [open, setOpen] = useState(false);
    return (
        <>
            {open && <Lightbox url={url} label={label} onClose={() => setOpen(false)} />}
            <button
                onClick={() => setOpen(true)}
                className="relative group rounded-xl overflow-hidden border border-gray-200 hover:border-black transition-colors flex-shrink-0"
                style={{ width: 80, height: 56 }}
                title={`View ${label}`}
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={label} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                    <ZoomIn size={14} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
            </button>
        </>
    );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: VerificationStatus }) {
    const cfg = STATUS_CONFIG[status];
    const Icon = cfg.icon;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
            <Icon size={11} /> {cfg.label}
        </span>
    );
}

// ─── Stats card ───────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, color }: {
    icon: React.ElementType; label: string; value: number | string; sub?: string; color: string;
}) {
    return (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
                <Icon size={18} className="text-white" />
            </div>
            <p className="text-2xl font-black tracking-tight">{value}</p>
            <p className="text-[12px] font-bold text-gray-500 mt-0.5">{label}</p>
            {sub && <p className="text-[11px] text-gray-400 mt-1">{sub}</p>}
        </div>
    );
}

// ─── Review modal ─────────────────────────────────────────────────────────────

function ReviewModal({
    item,
    onClose,
    onUpdate,
}: {
    item: Verification;
    onClose: () => void;
    onUpdate: (id: string, status: VerificationStatus, reason?: string) => Promise<void>;
}) {
    const [action, setAction] = useState<"approve" | "reject" | "flag" | null>(null);
    const [reason, setReason] = useState(REJECTION_REASONS[0]);
    const [customReason, setCustomReason] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const finalReason = reason === "Custom reason…" ? customReason : reason;

    const handleConfirm = async () => {
        if (!action) return;
        if (action === "reject" && !finalReason.trim()) {
            setError("Please provide a rejection reason.");
            return;
        }
        setSaving(true);
        setError("");
        const statusMap: Record<typeof action, VerificationStatus> = {
            approve: "approved",
            reject: "rejected",
            flag: "flagged",
        };
        try {
            await onUpdate(item.id, statusMap[action], action === "reject" ? finalReason : undefined);
            onClose();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to update. Try again.");
            setSaving(false);
        }
    };

    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">

                {/* Header */}
                <div className="bg-black px-6 py-4 flex items-center justify-between sticky top-0">
                    <div className="flex items-center gap-2">
                        <Eye size={14} className="text-green-400" />
                        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Review Submission</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-6 space-y-6">

                    {/* User info */}
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-black text-lg">{item.full_name ?? "Anonymous User"}</p>
                            <p className="text-[11px] text-gray-400 font-mono mt-0.5">{item.user_id}</p>
                            <p className="text-[12px] text-gray-500 mt-1">Submitted {fmtDate(item.created_at)}</p>
                        </div>
                        <StatusBadge status={item.status} />
                    </div>

                    {/* Document images */}
                    <div className="space-y-3">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Documents</p>
                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <p className="text-[11px] font-bold text-gray-500 mb-2">CNIC — Front</p>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={item.cnic_front_url} alt="CNIC Front"
                                    className="w-full rounded-xl border border-gray-200 object-contain max-h-48 bg-gray-50" />
                            </div>
                            <div>
                                <p className="text-[11px] font-bold text-gray-500 mb-2">CNIC — Back</p>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={item.cnic_back_url} alt="CNIC Back"
                                    className="w-full rounded-xl border border-gray-200 object-contain max-h-48 bg-gray-50" />
                            </div>
                            <div>
                                <p className="text-[11px] font-bold text-gray-500 mb-2">Selfie</p>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={item.selfie_url} alt="Selfie"
                                    className="w-full rounded-xl border border-gray-200 object-contain max-h-48 bg-gray-50 scale-x-[-1]" />
                            </div>
                        </div>
                    </div>

                    {/* Action selector */}
                    {item.status !== "approved" && (
                        <div className="space-y-3">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Decision</p>
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { id: "approve" as const, label: "Approve", icon: CheckCircle, color: "border-green-400 bg-green-50 text-green-700" },
                                    { id: "reject" as const, label: "Reject", icon: XCircle, color: "border-red-400 bg-red-50 text-red-700" },
                                    { id: "flag" as const, label: "Flag", icon: AlertCircle, color: "border-orange-400 bg-orange-50 text-orange-700" },
                                ].map(({ id, label, icon: Icon, color }) => (
                                    <button
                                        key={id}
                                        onClick={() => setAction(id)}
                                        className={`flex flex-col items-center gap-2 py-4 rounded-xl border-2 font-black text-[13px] transition-all ${action === id ? color : "border-gray-200 bg-gray-50 text-gray-400 hover:border-gray-300"}`}
                                    >
                                        <Icon size={20} />
                                        {label}
                                    </button>
                                ))}
                            </div>

                            {action === "reject" && (
                                <div className="space-y-3">
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Rejection Reason</p>
                                    <div className="relative">
                                        <select
                                            value={reason}
                                            onChange={(e) => setReason(e.target.value)}
                                            className="w-full h-11 pl-4 pr-10 border border-gray-200 rounded-xl text-[13px] font-semibold appearance-none bg-white focus:outline-none focus:border-black"
                                        >
                                            {REJECTION_REASONS.map((r) => (
                                                <option key={r} value={r}>{r}</option>
                                            ))}
                                        </select>
                                        <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    </div>
                                    {reason === "Custom reason…" && (
                                        <textarea
                                            value={customReason}
                                            onChange={(e) => setCustomReason(e.target.value)}
                                            placeholder="Describe the issue clearly…"
                                            rows={3}
                                            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-[13px] resize-none focus:outline-none focus:border-black"
                                        />
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {error && (
                        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                            <AlertCircle size={14} className="text-red-500" />
                            <p className="text-[12px] text-red-700 font-semibold">{error}</p>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="flex gap-3 pt-2">
                        <button onClick={onClose} className="flex-1 h-12 border border-gray-200 hover:border-black rounded-xl font-bold text-[14px] transition-colors">
                            Cancel
                        </button>
                        {item.status !== "approved" && (
                            <button
                                onClick={handleConfirm}
                                disabled={!action || saving}
                                className="flex-1 h-12 bg-black hover:bg-gray-900 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-black text-[14px] rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                {saving ? <><Loader2 size={16} className="animate-spin" /> Saving…</> : "Confirm Decision"}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Row ──────────────────────────────────────────────────────────────────────

function VerificationRow({
    item,
    onReview,
}: {
    item: Verification;
    onReview: (item: Verification) => void;
}) {
    return (
        <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors group">
            <td className="px-5 py-4">
                <div>
                    <p className="text-[13px] font-black">{item.full_name ?? "—"}</p>
                    <p className="text-[11px] text-gray-400 font-mono mt-0.5 truncate max-w-[140px]">{item.user_id}</p>
                </div>
            </td>
            <td className="px-5 py-4">
                <div className="flex items-center gap-2">
                    <Thumb url={item.cnic_front_url} label="CNIC Front" />
                    <Thumb url={item.cnic_back_url}  label="CNIC Back" />
                    <Thumb url={item.selfie_url}     label="Selfie" />
                </div>
            </td>
            <td className="px-5 py-4">
                <StatusBadge status={item.status} />
            </td>
            <td className="px-5 py-4">
                <p className="text-[12px] text-gray-600">{timeAgo(item.created_at)}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{fmtDate(item.created_at)}</p>
            </td>
            <td className="px-5 py-4">
                <button
                    onClick={() => onReview(item)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-black text-white text-[12px] font-black rounded-lg hover:bg-gray-800 transition-colors opacity-0 group-hover:opacity-100"
                >
                    <Eye size={12} /> Review
                </button>
            </td>
        </tr>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminVerificationsPage() {
    const [verifications, setVerifications] = useState<Verification[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<VerificationStatus | "all">("all");
    const [reviewing, setReviewing] = useState<Verification | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = useCallback(async () => {
        setError("");
        try {
            let query = supabase
                .from("verifications")
                .select("*")
                .order("created_at", { ascending: false });

            if (statusFilter !== "all") query = query.eq("status", statusFilter);

            const { data, error: dbErr } = await query;
            if (dbErr) throw new Error(dbErr.message);
            setVerifications((data as Verification[]) ?? []);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to load data.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [statusFilter]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleRefresh = () => { setRefreshing(true); fetchData(); };

    // ─── Replace your existing handleUpdate function with this ───────────────────
// (inside AdminVerificationsPage component, in app/admin/verifications/page.tsx)

const handleUpdate = async (id: string, status: VerificationStatus, reason?: string) => {
    // Get the user_id for this verification so we can sync their profile
    const { data: verification, error: fetchErr } = await supabase
        .from("verifications")
        .select("user_id")
        .eq("id", id)
        .single();

    if (fetchErr) throw new Error(fetchErr.message);

    const { error: dbErr } = await supabase
        .from("verifications")
        .update({
            status,
            review_notes: reason ?? null,
            updated_at:   new Date().toISOString(),
        })
        .eq("id", id);
    if (dbErr) throw new Error(dbErr.message);

    // ── Sync status to the profiles table so Navbar / Offer Ride reflect it ──
    if (verification?.user_id) {
        const { error: profileErr } = await supabase
            .from("profiles")
            .update({ verification_status: status })
            .eq("id", verification.user_id);

        if (profileErr) {
            console.warn("[admin] Failed to sync profile status:", profileErr.message);
        }
    }

    // Optimistic update
    setVerifications((prev) =>
        prev.map((v) => v.id === id ? { ...v, status } : v)
    );
};

    const filtered = verifications.filter((v) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            (v.full_name?.toLowerCase().includes(q) ?? false) ||
            v.user_id.toLowerCase().includes(q)
        );
    });

    // Stats
    const stats = {
        total:    verifications.length,
        pending:  verifications.filter((v) => v.status === "pending").length,
        approved: verifications.filter((v) => v.status === "approved").length,
        rejected: verifications.filter((v) => v.status === "rejected").length,
        flagged:  verifications.filter((v) => v.status === "flagged").length,
    };
    const approvalRate = stats.total > 0
        ? Math.round((stats.approved / stats.total) * 100)
        : 0;

    return (
        <div className="min-h-screen bg-[#f9f9f8] text-black antialiased">

            {reviewing && (
                <ReviewModal
                    item={reviewing}
                    onClose={() => setReviewing(null)}
                    onUpdate={handleUpdate}
                />
            )}

            {/* ── NAVBAR ── */}
            <header className="fixed top-0 left-0 right-0 z-40 px-4 pt-3 pointer-events-none">
                <div className="max-w-[1400px] mx-auto pointer-events-auto">
                    <div className="bg-white/90 backdrop-blur-md border border-black/10 rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.08)] h-14 flex items-center justify-between px-4">
                        <div className="flex items-center gap-3">
                            <Link href="/" className="flex items-center gap-2">
                                <div className="w-[34px] h-[34px] bg-black rounded-[10px] flex items-center justify-center flex-shrink-0">
                                    <Car size={15} className="text-green-400" />
                                </div>
                                <span className="font-black text-[17px] tracking-tight">
                                    Movento<span className="text-green-500">.</span>
                                </span>
                            </Link>
                            <div className="w-px h-5 bg-gray-200" />
                            <span className="text-[13px] font-bold text-gray-500">Admin</span>
                        </div>
                        <nav className="flex items-center gap-0.5">
                            {[
                                { href: "/admin", label: "Dashboard" },
                                { href: "/admin/verifications", label: "Verifications" },
                                { href: "/admin/users", label: "Users" },
                                { href: "/admin/rides", label: "Rides" },
                            ].map((link) => (
                                <Link key={link.href} href={link.href}
                                    className="text-[13px] font-semibold px-3 py-[7px] rounded-[10px] text-gray-500 hover:text-black hover:bg-gray-100 transition-colors">
                                    {link.label}
                                </Link>
                            ))}
                        </nav>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-black text-white rounded-[10px]">
                                <Shield size={12} className="text-green-400" />
                                <span className="text-[12px] font-black">Admin Panel</span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* ── BLACK STRIP ── */}
            <div className="mt-[76px] bg-black">
                <div className="max-w-[1400px] mx-auto px-6 py-6 flex items-end justify-between">
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-1">Admin · Identity</p>
                        <h1 className="text-3xl font-black text-white tracking-tight">Verifications</h1>
                        <p className="text-[13px] text-gray-500 mt-1">Review and action identity submissions from Movento users.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="flex items-center gap-2 px-4 h-10 border border-gray-700 hover:border-white text-gray-400 hover:text-white text-[13px] font-bold rounded-xl transition-colors disabled:opacity-50"
                        >
                            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
                            Refresh
                        </button>
                        <button className="flex items-center gap-2 px-4 h-10 bg-white text-black text-[13px] font-black rounded-xl hover:bg-gray-100 transition-colors">
                            <Download size={14} />
                            Export CSV
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-[1400px] mx-auto px-4 py-8 space-y-6">

                {/* ── STATS ── */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    <StatCard icon={Users}     label="Total"    value={stats.total}    color="bg-black"         sub="all submissions" />
                    <StatCard icon={Clock}     label="Pending"  value={stats.pending}  color="bg-yellow-400"    sub="awaiting review" />
                    <StatCard icon={CheckCircle} label="Approved" value={stats.approved} color="bg-green-500"  sub={`${approvalRate}% approval rate`} />
                    <StatCard icon={XCircle}   label="Rejected" value={stats.rejected} color="bg-red-500"       sub="declined" />
                    <StatCard icon={AlertCircle} label="Flagged" value={stats.flagged} color="bg-orange-400"   sub="needs attention" />
                </div>

                {/* ── APPROVAL RATE BAR ── */}
                {stats.total > 0 && (
                    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <BarChart2 size={14} className="text-gray-400" />
                                <p className="text-[12px] font-bold text-gray-500 uppercase tracking-wider">Status Breakdown</p>
                            </div>
                            <p className="text-[12px] text-gray-400">{stats.total} total</p>
                        </div>
                        <div className="flex h-3 rounded-full overflow-hidden gap-px">
                            {stats.approved > 0 && (
                                <div className="bg-green-500 transition-all" style={{ width: `${(stats.approved / stats.total) * 100}%` }} />
                            )}
                            {stats.pending > 0 && (
                                <div className="bg-yellow-400 transition-all" style={{ width: `${(stats.pending / stats.total) * 100}%` }} />
                            )}
                            {stats.rejected > 0 && (
                                <div className="bg-red-500 transition-all" style={{ width: `${(stats.rejected / stats.total) * 100}%` }} />
                            )}
                            {stats.flagged > 0 && (
                                <div className="bg-orange-400 transition-all" style={{ width: `${(stats.flagged / stats.total) * 100}%` }} />
                            )}
                        </div>
                        <div className="flex items-center gap-5 mt-3">
                            {[
                                { label: "Approved", color: "bg-green-500", count: stats.approved },
                                { label: "Pending",  color: "bg-yellow-400", count: stats.pending },
                                { label: "Rejected", color: "bg-red-500",   count: stats.rejected },
                                { label: "Flagged",  color: "bg-orange-400", count: stats.flagged },
                            ].map((s) => (
                                <div key={s.label} className="flex items-center gap-1.5">
                                    <div className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
                                    <span className="text-[11px] text-gray-500 font-medium">{s.label} ({s.count})</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── TABLE ── */}
                <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.06)]">

                    {/* Table toolbar */}
                    <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        <div className="relative flex-1 max-w-sm">
                            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by name or user key…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-9 pr-4 h-10 border border-gray-200 rounded-xl text-[13px] focus:outline-none focus:border-black transition-colors"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Filter size={13} className="text-gray-400" />
                            <div className="flex gap-1">
                                {(["all", "pending", "approved", "rejected", "flagged"] as const).map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => setStatusFilter(s)}
                                        className={`px-3 py-1.5 rounded-lg text-[12px] font-black capitalize transition-colors ${statusFilter === s
                                            ? "bg-black text-white"
                                            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                            }`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <p className="text-[12px] text-gray-400 ml-auto whitespace-nowrap">
                            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
                        </p>
                    </div>

                    {/* Table */}
                    {loading ? (
                        <div className="flex items-center justify-center py-20 gap-3 text-gray-400">
                            <Loader2 size={20} className="animate-spin" />
                            <p className="text-[14px] font-semibold">Loading submissions…</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center px-6">
                            <AlertCircle size={28} className="text-red-400" />
                            <p className="text-[14px] font-bold text-red-600">{error}</p>
                            <button onClick={handleRefresh} className="px-4 h-9 bg-black text-white text-[13px] font-black rounded-xl hover:bg-gray-900 transition-colors">
                                Retry
                            </button>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
                            <TrendingUp size={28} className="text-gray-200" />
                            <p className="text-[14px] font-bold text-gray-400">No submissions found</p>
                            {search && <p className="text-[12px] text-gray-300">Try clearing your search</p>}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-[#f9f9f8]">
                                        {["User", "Documents", "Status", "Submitted", ""].map((h) => (
                                            <th key={h} className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((item) => (
                                        <VerificationRow
                                            key={item.id}
                                            item={item}
                                            onReview={setReviewing}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}