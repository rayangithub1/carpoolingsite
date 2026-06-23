"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar"; // adjust path to match your project
import {
    Car, Upload, Camera, CheckCircle, AlertCircle, ChevronRight,
    RotateCcw, Shield, Clock, Eye, X, Loader2, LogOut,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

// ─── Types ────────────────────────────────────────────────────────────────────

type VerifyStep = "cnic" | "face" | "submitted";

interface CNICData {
    front: File | null;
    back: File | null;
}

interface FaceData {
    blob: Blob | null;
    dataUrl: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fileToDataUrl(file: File): Promise<string> {
    return new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result as string);
        r.onerror = rej;
        r.readAsDataURL(file);
    });
}

/**
 * Sanitise a string into a valid Supabase Storage path segment.
 * Keeps alphanumeric chars, hyphens, and underscores. UUIDs are fine.
 */
function sanitiseKey(raw: string): string {
    const cleaned = raw.trim().replace(/[^a-zA-Z0-9\-_]/g, "").slice(0, 64);
    return cleaned.length > 0 ? cleaned : `session-${Date.now()}`;
}

/**
 * Upload a File or Blob to Supabase Storage and return the public URL.
 */
async function uploadToSupabase(
    path: string,
    data: File | Blob,
    mimeType: string,
): Promise<string> {
    const safePath = path?.trim();

    if (!safePath || safePath.length === 0) {
        throw new Error("Upload path is empty");
    }
    if (safePath.startsWith("/") || safePath.includes("//")) {
        throw new Error(`Invalid path format: ${safePath}`);
    }
    if (data.size === 0) {
        throw new Error(`[upload] File is 0 bytes for "${safePath}". The file was not read correctly.`);
    }

    console.log("[upload] →", { path: safePath, mime: mimeType, bytes: data.size });

    const { data: uploadData, error: uploadError } = await supabase.storage
        .from("verifications")
        .upload(safePath, data, { contentType: mimeType, upsert: true, cacheControl: "3600" });

    if (uploadError) {
        console.error("[upload] raw error:", JSON.stringify(uploadError));

        let hint = "";
        const msg = uploadError.message ?? "";
        if (msg.toLowerCase().includes("invalid path") || msg.toLowerCase().includes("not found")) {
            hint = "\n\nLikely fix: Check Supabase Storage policies for the 'verifications' bucket.";
        } else if (msg.toLowerCase().includes("row-level") || msg.toLowerCase().includes("violates")) {
            hint = "\n\nRLS policy is blocking the upload. Add an INSERT policy for the authenticated role on storage.objects.";
        }

        throw new Error(`Storage upload failed: ${msg}${hint}`);
    }

    console.log("[upload] ✓", uploadData?.path);

    const { data: urlData } = supabase.storage.from("verifications").getPublicUrl(safePath);
    return urlData.publicUrl;
}

// ─── Image upload card ────────────────────────────────────────────────────────

function ImageUploadCard({
    label, hint, file, preview, onFile, icon: Icon,
}: {
    label: string;
    hint: string;
    file: File | null;
    preview: string;
    onFile: (f: File) => void;
    icon: React.ElementType;
}) {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const f = e.dataTransfer.files[0];
        if (f && f.type.startsWith("image/")) onFile(f);
    };

    return (
        <div
            onClick={() => inputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className={`relative border-2 border-dashed rounded-2xl overflow-hidden cursor-pointer transition-all group min-h-[180px] ${file
                ? "border-green-400 bg-green-50"
                : "border-gray-200 hover:border-black bg-[#f9f9f8]"
                }`}
        >
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }}
            />

            {preview ? (
                <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={preview} alt={label} className="w-full h-full object-cover absolute inset-0 min-h-[180px]" />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="bg-white rounded-xl px-4 py-2 flex items-center gap-2">
                            <RotateCcw size={13} />
                            <span className="text-[12px] font-black">Replace</span>
                        </div>
                    </div>
                    <div className="absolute top-3 right-3 w-7 h-7 bg-green-500 rounded-full flex items-center justify-center shadow">
                        <CheckCircle size={14} className="text-white" />
                    </div>
                </>
            ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center min-h-[180px]">
                    <div className="w-12 h-12 bg-white border border-gray-200 rounded-xl flex items-center justify-center mb-3 shadow-sm group-hover:border-black transition-colors">
                        <Icon size={20} className="text-gray-400 group-hover:text-black transition-colors" />
                    </div>
                    <p className="text-[13px] font-black text-black mb-1">{label}</p>
                    <p className="text-[11px] text-gray-400 leading-relaxed">{hint}</p>
                    <div className="mt-4 flex items-center gap-1.5 text-[11px] font-bold text-gray-500">
                        <Upload size={11} /> Tap to upload or drag &amp; drop
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Webcam capture ───────────────────────────────────────────────────────────

function WebcamCapture({
    onCapture, onClose,
}: {
    onCapture: (blob: Blob, dataUrl: string) => void;
    onClose: () => void;
}) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const [ready, setReady] = useState(false);
    const [error, setError] = useState("");
    const [countdown, setCountdown] = useState<number | null>(null);

    const startCamera = useCallback(async () => {
        setError("");
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => setReady(true);
            }
        } catch {
            setError("Camera access denied. Please allow camera access and try again.");
        }
    }, []);

    useEffect(() => {
        startCamera();
        return () => { streamRef.current?.getTracks().forEach((t) => t.stop()); };
    }, [startCamera]);

    const capture = () => {
        if (!videoRef.current || !canvasRef.current || !ready) return;
        let count = 3;
        setCountdown(count);
        const interval = setInterval(() => {
            count--;
            if (count === 0) {
                clearInterval(interval);
                setCountdown(null);
                const canvas = canvasRef.current!;
                const video = videoRef.current!;
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                canvas.getContext("2d")!.drawImage(video, 0, 0);
                canvas.toBlob((blob) => {
                    if (blob) onCapture(blob, canvas.toDataURL("image/jpeg", 0.92));
                }, "image/jpeg", 0.92);
                streamRef.current?.getTracks().forEach((t) => t.stop());
            } else {
                setCountdown(count);
            }
        }, 1000);
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl overflow-hidden w-full max-w-md shadow-2xl">
                <div className="bg-black px-5 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Camera size={14} className="text-green-400" />
                        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Selfie Verification</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X size={18} />
                    </button>
                </div>
                <div className="p-5">
                    {error ? (
                        <div className="flex flex-col items-center gap-4 py-8 text-center">
                            <AlertCircle size={32} className="text-red-400" />
                            <p className="text-[13px] text-red-600 font-semibold leading-relaxed">{error}</p>
                            <button onClick={startCamera}
                                className="px-5 h-10 bg-black text-white text-[13px] font-black rounded-xl hover:bg-gray-900 transition-colors">
                                Try Again
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="relative bg-black rounded-2xl overflow-hidden mb-4" style={{ aspectRatio: "4/3" }}>
                                <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="border-2 border-white/50 rounded-full"
                                        style={{ width: "52%", height: "70%", borderStyle: "dashed" }} />
                                </div>
                                {countdown !== null && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                        <span className="text-7xl font-black text-white">{countdown}</span>
                                    </div>
                                )}
                                {!ready && !error && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black">
                                        <Loader2 size={24} className="text-white animate-spin" />
                                    </div>
                                )}
                            </div>
                            <canvas ref={canvasRef} className="hidden" />
                            <p className="text-[11px] text-gray-500 text-center mb-4 leading-relaxed">
                                Centre your face in the oval. Remove glasses. Make sure you are well lit.
                            </p>
                            <button onClick={capture} disabled={!ready || countdown !== null}
                                className="w-full h-12 bg-black hover:bg-gray-900 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-black text-[14px] rounded-xl transition-colors flex items-center justify-center gap-2">
                                <Camera size={16} />
                                {countdown !== null ? `Taking photo in ${countdown}…` : "Take Photo"}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Step bar ─────────────────────────────────────────────────────────────────

function StepBar({ current }: { current: VerifyStep }) {
    const steps: { id: VerifyStep; label: string }[] = [
        { id: "cnic", label: "ID Document" },
        { id: "face", label: "Selfie" },
        { id: "submitted", label: "Submitted" },
    ];
    const idx = steps.findIndex((s) => s.id === current);
    return (
        <div className="flex items-center mb-8">
            {steps.map((step, i) => {
                const done = i < idx; const active = i === idx;
                return (
                    <div key={step.id} className="flex items-center flex-1 last:flex-none">
                        <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-black flex-shrink-0 transition-colors ${done ? "bg-green-500 text-white" : active ? "bg-black text-white" : "bg-gray-100 text-gray-400"
                                }`}>
                                {done ? <CheckCircle size={14} /> : i + 1}
                            </div>
                            <span className={`text-[12px] font-bold hidden sm:block ${active ? "text-black" : done ? "text-green-600" : "text-gray-400"}`}>
                                {step.label}
                            </span>
                        </div>
                        {i < steps.length - 1 && (
                            <div className={`flex-1 h-px mx-3 ${i < idx ? "bg-green-400" : "bg-gray-200"}`} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ─── Upload progress item ─────────────────────────────────────────────────────

function UploadProgress({ label, done }: { label: string; done: boolean }) {
    return (
        <div className="flex items-center gap-3">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${done ? "bg-green-500" : "bg-gray-100"}`}>
                {done
                    ? <CheckCircle size={12} className="text-white" />
                    : <Loader2 size={12} className="text-gray-400 animate-spin" />}
            </div>
            <span className={`text-[13px] font-bold transition-colors ${done ? "text-black" : "text-gray-400"}`}>
                {label}
            </span>
        </div>
    );
}

// ─── Submitted screen ─────────────────────────────────────────────────────────

function SubmittedScreen({ urls }: { urls: { front: string; back: string; selfie: string } }) {
    return (
        <div className="text-center py-8">
            <div className="w-16 h-16 bg-yellow-400 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <Clock size={30} className="text-white" />
            </div>
            <h2 className="text-2xl font-black tracking-tight mb-2">Under Review</h2>
            <p className="text-gray-500 text-[14px] mb-6 max-w-xs mx-auto leading-relaxed">
                Your documents have been uploaded successfully. Our team reviews submissions within 24 hours.
            </p>

            <div className="bg-[#f9f9f8] border border-gray-200 rounded-2xl p-5 text-left mb-6 max-w-sm mx-auto">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">Uploaded Documents</p>
                <div className="space-y-3">
                    {[
                        { label: "CNIC Front", url: urls.front },
                        { label: "CNIC Back", url: urls.back },
                        { label: "Selfie", url: urls.selfie },
                    ].map((f) => (
                        <div key={f.label} className="flex items-center gap-3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={f.url} alt={f.label}
                                className="w-12 h-12 object-cover rounded-lg border border-gray-200 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-[12px] font-black">{f.label}</p>
                                <p className="text-[10px] text-green-600 font-bold mt-0.5 flex items-center gap-1">
                                    <CheckCircle size={10} /> Uploaded successfully
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-[#f9f9f8] border border-gray-200 rounded-2xl p-5 text-left mb-6 max-w-sm mx-auto">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">What happens next</p>
                <div className="space-y-4">
                    {[
                        { icon: Eye, label: "Document check", desc: "We confirm your CNIC front & back are legible." },
                        { icon: Camera, label: "Face match", desc: "Your selfie is compared to the photo on your CNIC." },
                        { icon: CheckCircle, label: "Account approved", desc: "You'll be notified once verification is complete." },
                    ].map(({ icon: Icon, label, desc }) => (
                        <div key={label} className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-white border border-gray-200 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                                <Icon size={14} className="text-black" />
                            </div>
                            <div>
                                <p className="text-[13px] font-black">{label}</p>
                                <p className="text-[11px] text-gray-500 mt-0.5">{desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex flex-col gap-3 max-w-sm mx-auto">
                <Link href="/"
                    className="flex items-center justify-center gap-2 w-full h-12 bg-black hover:bg-gray-900 text-white font-black text-[14px] rounded-xl transition-colors no-underline">
                    Back to Home
                </Link>
                <Link href="/dashboard"
                    className="flex items-center justify-center gap-2 w-full h-12 border border-gray-200 hover:border-black font-semibold text-[14px] rounded-xl transition-colors no-underline text-black">
                    Go to Dashboard
                </Link>
            </div>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function VerifyPage() {
    const [step, setStep] = useState<VerifyStep>("cnic");
    const [cnic, setCnic] = useState<CNICData>({ front: null, back: null });
    const [frontPreview, setFrontPreview] = useState("");
    const [backPreview, setBackPreview] = useState("");
    const [face, setFace] = useState<FaceData>({ blob: null, dataUrl: "" });
    const [showCam, setShowCam] = useState(false);
    const [errors, setErrors] = useState<{ front?: string; back?: string; face?: string }>({});
    const [user, setUser] = useState<{ name: string; id?: string; email?: string; phone?: string } | null>(null);

    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState("");
    const [uploadedUrls, setUploadedUrls] = useState({ front: "", back: "", selfie: "" });
    const [uploadProgress, setUploadProgress] = useState({ front: false, back: false, selfie: false });

    useEffect(() => {
        try {
            const stored = localStorage.getItem("user");
            if (stored) setUser(JSON.parse(stored));
        } catch {}

        // Smoke-test bucket reachability
        supabase.storage.from("verifications").list("", { limit: 1 }).then(({ error }) => {
            if (error) {
                console.warn("[verify] Bucket smoke-test failed:", error.message);
            } else {
                console.log("[verify] Bucket smoke-test passed ✓");
            }
        });
    }, []);

    const handleFront = async (f: File) => {
        setCnic((p) => ({ ...p, front: f }));
        setErrors((e) => ({ ...e, front: undefined }));
        setFrontPreview(await fileToDataUrl(f));
    };

    const handleBack = async (f: File) => {
        setCnic((p) => ({ ...p, back: f }));
        setErrors((e) => ({ ...e, back: undefined }));
        setBackPreview(await fileToDataUrl(f));
    };

    const handleCapture = (blob: Blob, dataUrl: string) => {
        setFace({ blob, dataUrl });
        setErrors((e) => ({ ...e, face: undefined }));
        setShowCam(false);
    };

    const validateCnic = () => {
        const e: typeof errors = {};
        if (!cnic.front) e.front = "Upload the front of your CNIC";
        if (!cnic.back) e.back = "Upload the back of your CNIC";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const validateFace = () => {
        const e: typeof errors = {};
        if (!face.blob) e.face = "Take a selfie to continue";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleCnicNext = () => {
        if (validateCnic()) { setErrors({}); setStep("face"); }
    };

    // ── THE FIX: use the real authenticated Supabase user, save email + phone ──
    const handleSubmit = async () => {
        if (!validateFace()) return;
        if (!cnic.front || !cnic.back || !face.blob) {
            setUploadError("Missing files. Please go back and try again.");
            return;
        }

        const { data: authData, error: authErr } = await supabase.auth.getUser();
        const authUser = authData?.user;

        if (authErr || !authUser) {
            setUploadError("You must be logged in to submit verification.");
            return;
        }

        const folderKey = sanitiseKey(authUser.id);

        setUploading(true);
        setUploadError("");
        setUploadProgress({ front: false, back: false, selfie: false });

        try {
            // 1. CNIC FRONT
            const frontUrl = await uploadToSupabase(
                `${folderKey}/cnic-front.jpg`, cnic.front, cnic.front.type || "image/jpeg"
            );
            setUploadProgress((p) => ({ ...p, front: true }));

            // 2. CNIC BACK
            const backUrl = await uploadToSupabase(
                `${folderKey}/cnic-back.jpg`, cnic.back, cnic.back.type || "image/jpeg"
            );
            setUploadProgress((p) => ({ ...p, back: true }));

            // 3. SELFIE
            const selfieUrl = await uploadToSupabase(
                `${folderKey}/selfie.jpg`, face.blob, "image/jpeg"
            );
            setUploadProgress((p) => ({ ...p, selfie: true }));

            // 4. INSERT — real user_id + email + phone captured here
            const { error: dbError } = await supabase.from("verifications").insert({
                user_id:        authUser.id,
                full_name:      user?.name ?? authUser.user_metadata?.full_name ?? null,
                email:          authUser.email ?? user?.email ?? null,
                phone:          user?.phone ?? authUser.user_metadata?.phone ?? null,
                cnic_front_url: frontUrl,
                cnic_back_url:  backUrl,
                selfie_url:     selfieUrl,
                status:         "pending",
                created_at:     new Date().toISOString(),
            });

            if (dbError) {
                console.warn("[verify] DB insert failed:", dbError.message);
                throw new Error(dbError.message);
            }

            // 5. Sync pending status to profile (source of truth)
            await supabase
                .from("profiles")
                .update({ verification_status: "pending" })
                .eq("id", authUser.id);

            // 6. Update localStorage immediately so Navbar reflects it without reload
            try {
                const stored = localStorage.getItem("user");
                if (stored) {
                    const parsed = JSON.parse(stored);
                    parsed.verificationStatus = "pending";
                    localStorage.setItem("user", JSON.stringify(parsed));
                    window.dispatchEvent(new Event("movento:auth"));
                }
            } catch {}

            setUploadedUrls({ front: frontUrl, back: backUrl, selfie: selfieUrl });
            setUploading(false);
            setStep("submitted");

        } catch (err) {
            setUploading(false);
            setUploadError(
                err instanceof Error ? err.message : "Upload failed. Please try again."
            );
        }
    };

    return (
        <div className="min-h-screen bg-[#f9f9f8] text-black antialiased">

            {showCam && <WebcamCapture onCapture={handleCapture} onClose={() => setShowCam(false)} />}

            <Navbar />

            <div className="mt-[76px] bg-[#f9f9f8]">
                <div className="max-w-[1100px] mx-auto px-6 py-6">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-1">Account</p>
                    <h1 className="text-3xl font-black text-black tracking-tight mb-1">Identity Verification</h1>
                    <p className="text-[13px] text-gray-500">
                        Verify your identity to build trust with other commuters on Movento.
                    </p>
                </div>
            </div>

            <div className="max-w-[1100px] mx-auto px-4 py-8 flex gap-8 items-start">

                <div className="flex-1 min-w-0 max-w-2xl">

                    {step !== "submitted" && <StepBar current={step} />}

                    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.06)]">

                        <div className="bg-black px-6 py-4 flex items-center gap-2">
                            {step === "cnic" && <><Shield size={14} className="text-green-400" /><p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Step 1 — Upload Your CNIC</p></>}
                            {step === "face" && <><Camera size={14} className="text-green-400" /><p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Step 2 — Take a Selfie</p></>}
                            {step === "submitted" && <><CheckCircle size={14} className="text-green-400" /><p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Verification Submitted</p></>}
                        </div>

                        <div className="p-6">

                            {step === "cnic" && (
                                <div className="space-y-5">
                                    <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4">
                                        <Shield size={15} className="text-blue-600 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-[13px] font-bold text-blue-800">Your data is encrypted</p>
                                            <p className="text-[11px] text-blue-600 mt-0.5 leading-relaxed">
                                                CNIC images are uploaded directly to encrypted Supabase Storage and used only for identity verification. Never shared with other users.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2">Front of CNIC</p>
                                            <ImageUploadCard
                                                label="Front side" hint="Photo, name, and CNIC number must be visible"
                                                file={cnic.front} preview={frontPreview} onFile={handleFront} icon={Upload}
                                            />
                                            {errors.front && (
                                                <p className="flex items-center gap-1 text-[11px] text-red-500 mt-2 font-medium">
                                                    <AlertCircle size={11} />{errors.front}
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2">Back of CNIC</p>
                                            <ImageUploadCard
                                                label="Back side" hint="Address and thumbprint must be visible"
                                                file={cnic.back} preview={backPreview} onFile={handleBack} icon={Upload}
                                            />
                                            {errors.back && (
                                                <p className="flex items-center gap-1 text-[11px] text-red-500 mt-2 font-medium">
                                                    <AlertCircle size={11} />{errors.back}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-[#f9f9f8] border border-gray-100 rounded-xl p-4">
                                        <p className="text-[11px] font-bold text-gray-500 mb-2 uppercase tracking-wider">Tips for a good photo</p>
                                        <ul className="space-y-1.5">
                                            {[
                                                "Place your CNIC on a flat, dark surface",
                                                "All four corners must be in frame",
                                                "Avoid glare or shadows on the card",
                                                "Natural light works best",
                                            ].map((tip) => (
                                                <li key={tip} className="flex items-start gap-2">
                                                    <CheckCircle size={12} className="text-green-500 flex-shrink-0 mt-0.5" />
                                                    <span className="text-[12px] text-gray-600">{tip}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <button onClick={handleCnicNext}
                                        className="w-full h-12 bg-black hover:bg-gray-900 text-white font-black text-[14px] rounded-xl transition-colors flex items-center justify-center gap-2">
                                        Continue to Selfie <ChevronRight size={16} />
                                    </button>
                                </div>
                            )}

                            {step === "face" && (
                                <div className="space-y-5">

                                    {face.dataUrl ? (
                                        <div className="relative rounded-2xl overflow-hidden" style={{ aspectRatio: "4/3" }}>
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={face.dataUrl} alt="Selfie" className="w-full h-full object-cover scale-x-[-1]" />
                                            <div className="absolute top-3 right-3 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow">
                                                <CheckCircle size={16} className="text-white" />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-[#f9f9f8] border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-center p-10" style={{ aspectRatio: "4/3" }}>
                                            <div className="w-16 h-16 bg-white border border-gray-200 rounded-full flex items-center justify-center mb-4 shadow-sm">
                                                <Camera size={28} className="text-gray-300" />
                                            </div>
                                            <p className="text-[14px] font-black text-gray-400 mb-1">No selfie yet</p>
                                            <p className="text-[12px] text-gray-300">Tap "Open Camera" below</p>
                                        </div>
                                    )}

                                    {errors.face && (
                                        <p className="flex items-center gap-1 text-[11px] text-red-500 font-medium">
                                            <AlertCircle size={11} />{errors.face}
                                        </p>
                                    )}

                                    {uploading && (
                                        <div className="bg-[#f9f9f8] border border-gray-200 rounded-xl p-4 space-y-3">
                                            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                                                Uploading to Supabase…
                                            </p>
                                            <UploadProgress label="CNIC Front" done={uploadProgress.front} />
                                            <UploadProgress label="CNIC Back" done={uploadProgress.back} />
                                            <UploadProgress label="Selfie" done={uploadProgress.selfie} />
                                        </div>
                                    )}

                                    {uploadError && (
                                        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
                                            <AlertCircle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-[13px] font-bold text-red-700">Upload failed</p>
                                                <p className="text-[11px] text-red-600 mt-0.5 leading-relaxed">{uploadError}</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex gap-3">
                                        <button onClick={() => setShowCam(true)} disabled={uploading}
                                            className={`flex-1 h-12 font-black text-[14px] rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${face.dataUrl
                                                ? "border-2 border-gray-200 hover:border-black text-black"
                                                : "bg-black hover:bg-gray-900 text-white"
                                                }`}>
                                            <Camera size={16} />
                                            {face.dataUrl ? "Retake Selfie" : "Open Camera"}
                                        </button>
                                        {face.dataUrl && (
                                            <button onClick={handleSubmit} disabled={uploading}
                                                className="flex-1 h-12 bg-green-500 hover:bg-green-600 disabled:bg-green-400 disabled:cursor-not-allowed text-white font-black text-[14px] rounded-xl transition-colors flex items-center justify-center gap-2">
                                                {uploading
                                                    ? <><Loader2 size={16} className="animate-spin" />Uploading…</>
                                                    : <><CheckCircle size={16} />Submit</>}
                                            </button>
                                        )}
                                    </div>

                                    <div className="bg-[#f9f9f8] border border-gray-100 rounded-xl p-4">
                                        <p className="text-[11px] font-bold text-gray-500 mb-2 uppercase tracking-wider">Tips for a good selfie</p>
                                        <ul className="space-y-1.5">
                                            {[
                                                "Face the camera directly — no side angles",
                                                "Remove sunglasses or face covering",
                                                "Avoid strong backlighting",
                                                "Keep a neutral expression",
                                            ].map((tip) => (
                                                <li key={tip} className="flex items-start gap-2">
                                                    <CheckCircle size={12} className="text-green-500 flex-shrink-0 mt-0.5" />
                                                    <span className="text-[12px] text-gray-600">{tip}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <button onClick={() => setStep("cnic")} disabled={uploading}
                                        className="w-full h-11 border border-gray-200 hover:border-black font-bold text-[14px] rounded-xl transition-colors text-black disabled:opacity-50">
                                        ← Back to CNIC
                                    </button>
                                </div>
                            )}

                            {step === "submitted" && <SubmittedScreen urls={uploadedUrls} />}

                        </div>
                    </div>
                </div>

                <aside className="hidden lg:flex flex-col gap-4 w-[280px] flex-shrink-0 sticky top-[76px]">

                    <div className="bg-[#f9f9f8] border border-gray-200 rounded-2xl p-4">
                        <div className="rounded px-5 py-2">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Why verify?</p>
                        </div>
                        <div className="bg-[#f9f9f8] divide-y divide-gray-200">
                            {[
                                { icon: Shield, title: "Build trust", desc: "Verified badge builds confidence with passengers and drivers." },
                                { icon: CheckCircle, title: "More bookings", desc: "Verified drivers receive up to 4× more booking requests." },
                                { icon: Eye, title: "Safer community", desc: "Real identity checks keep bad actors off the platform." },
                            ].map(({ icon: Icon, title, desc }) => (
                                <div key={title} className="flex items-start gap-3 px-5 py-4">
                                    <div className="w-8 h-8 bg-[#f9f9f8] border border-gray-200 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <Icon size={15} className="text-black" />
                                    </div>
                                    <div>
                                        <p className="text-[13px] font-black mb-0.5">{title}</p>
                                        <p className="text-[11px] text-gray-500 leading-relaxed">{desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="border-2 border-gray-200 rounded-2xl overflow-hidden">
                        <div className="bg-green-200 px-5 py-3">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Your progress</p>
                        </div>
                        <div className="bg-white p-5 space-y-3">
                            {[
                                { label: "CNIC Uploaded", done: step === "face" || step === "submitted" },
                                { label: "Selfie Captured", done: step === "submitted" },
                                { label: "Under Review", done: step === "submitted" },
                            ].map((s) => (
                                <div key={s.label} className="flex items-center gap-3">
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${s.done ? "bg-green-500" : "bg-gray-100"}`}>
                                        {s.done
                                            ? <CheckCircle size={12} className="text-white" />
                                            : <span className="w-2 h-2 rounded-full bg-gray-300" />}
                                    </div>
                                    <span className={`text-[13px] font-bold ${s.done ? "text-black" : "text-gray-400"}`}>
                                        {s.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-[#f9f9f8] border border-gray-200 rounded-2xl p-5">
                        <div className="flex items-center gap-2 mb-3">
                            <Shield size={14} className="text-green-600" />
                            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Privacy</p>
                        </div>
                        <ul className="space-y-2.5">
                            {[
                                "Images stored in encrypted Supabase Storage",
                                "CNIC number never stored as plain text",
                                "Data never sold or shared with third parties",
                                "Request data deletion at any time",
                            ].map((item) => (
                                <li key={item} className="flex items-start gap-2">
                                    <CheckCircle size={12} className="text-green-500 flex-shrink-0 mt-0.5" />
                                    <span className="text-[12px] text-gray-600 leading-relaxed">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                </aside>
            </div>
        </div>
    );
}