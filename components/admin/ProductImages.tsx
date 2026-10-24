"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, ChevronLeft, ChevronRight, Crop, Images, Loader2, RefreshCw, Star, X } from "lucide-react";
import { toast } from "sonner";
import PhotoCropDialog from "./PhotoCropDialog";

// Product photos: take one with the camera or pick from the gallery, crop it to a square, then
// upload to /api/admin/media, which saves it as a 600 × 600 WebP.

async function upload(file: Blob, name: string): Promise<string> {
  const form = new FormData();
  form.append("file", file, name);
  const res = await fetch("/api/admin/media", { method: "POST", body: form });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Upload failed");
  return data.url as string;
}

const isTouchDevice = () => typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;

/** A photo waiting to be cropped. `replaces` is set when re-cropping a photo already on the product. */
interface Pending {
  file: Blob;
  name: string;
  replaces?: string;
}

export default function ProductImages({ images, onChange }: { images: string[]; onChange: (images: string[]) => void }) {
  const galleryInput = useRef<HTMLInputElement>(null);
  const cameraInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [queue, setQueue] = useState<Pending[]>([]);
  const [batchSize, setBatchSize] = useState(0);
  const latest = useRef(images);
  useEffect(() => {
    latest.current = images;
  }, [images]);

  // Photos are cropped one at a time, in the order they were picked
  const enqueue = (items: Pending[]) => {
    setBatchSize((n) => (queue.length === 0 ? items.length : n + items.length));
    setQueue((q) => [...q, ...items]);
  };
  const next = () => setQueue((q) => q.slice(1));

  const uploadPhoto = async (photo: Blob, item: Pending) => {
    setUploading((n) => n + 1);
    try {
      const url = await upload(photo, item.name.replace(/\.[^.]+$/, "") + ".jpg");
      latest.current = item.replaces
        ? latest.current.map((src) => (src === item.replaces ? url : src))
        : [...latest.current, url];
      onChange(latest.current);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading((n) => n - 1);
    }
  };

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (files.length) enqueue(files.map((f) => ({ file: f, name: f.name })));
  };

  const recrop = async (src: string) => {
    try {
      const res = await fetch(src);
      if (!res.ok) throw new Error();
      enqueue([{ file: await res.blob(), name: "photo.jpg", replaces: src }]);
    } catch {
      toast.error("Couldn't open this photo for cropping");
    }
  };

  const takePhoto = () => {
    // Phones and tablets open their camera app; laptops get a live camera window
    if (isTouchDevice()) cameraInput.current?.click();
    else setCameraOpen(true);
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= images.length) return;
    const next = [...images];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  return (
    <div>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {images.map((src, i) => (
          <div key={`${src}-${i}`} className="relative group aspect-square rounded-xl border border-[#e7e2d8] bg-[#fafafa] overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="w-full h-full object-contain" />
            {i === 0 && (
              <span className="absolute top-1.5 left-1.5 bg-[#1f3a2c] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">MAIN</span>
            )}
            {src.startsWith("/") && (
              <button
                type="button"
                onClick={() => recrop(src)}
                aria-label="Crop photo again"
                className="absolute top-1.5 right-9 w-6 h-6 rounded-full bg-white/95 border border-[#e7e2d8] flex items-center justify-center text-[#1f3a2c] cursor-pointer"
              >
                <Crop size={12} />
              </button>
            )}
            <button
              type="button"
              onClick={() => onChange(images.filter((_, j) => j !== i))}
              aria-label="Remove photo"
              className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-white/95 border border-[#e7e2d8] flex items-center justify-center text-[#c62828] cursor-pointer"
            >
              <X size={13} />
            </button>
            <div className="absolute bottom-1.5 inset-x-1.5 flex justify-between gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
              <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label="Move left" className="w-6 h-6 rounded-full bg-white/95 border border-[#e7e2d8] flex items-center justify-center disabled:opacity-30 cursor-pointer">
                <ChevronLeft size={13} />
              </button>
              {i !== 0 && (
                <button type="button" onClick={() => move(i, 0)} aria-label="Make main photo" className="h-6 px-1.5 rounded-full bg-white/95 border border-[#e7e2d8] flex items-center gap-0.5 text-[10px] font-bold cursor-pointer">
                  <Star size={10} /> Main
                </button>
              )}
              <button type="button" onClick={() => move(i, i + 1)} disabled={i === images.length - 1} aria-label="Move right" className="w-6 h-6 rounded-full bg-white/95 border border-[#e7e2d8] flex items-center justify-center disabled:opacity-30 cursor-pointer">
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        ))}

        {Array.from({ length: uploading }).map((_, i) => (
          <div key={`up-${i}`} className="aspect-square rounded-xl border border-dashed border-[#c9c3b6] bg-[#fafafa] flex items-center justify-center">
            <Loader2 size={20} className="animate-spin text-[#747576]" />
          </div>
        ))}

        <button
          type="button"
          onClick={takePhoto}
          className="aspect-square rounded-xl border-2 border-dashed border-[#c9c3b6] hover:border-[#1f3a2c] flex flex-col items-center justify-center gap-1.5 text-[#1f3a2c] text-[12.5px] font-semibold cursor-pointer transition-colors"
        >
          <Camera size={22} /> Take photo
        </button>
        <button
          type="button"
          onClick={() => galleryInput.current?.click()}
          className="aspect-square rounded-xl border-2 border-dashed border-[#c9c3b6] hover:border-[#1f3a2c] flex flex-col items-center justify-center gap-1.5 text-[#1f3a2c] text-[12.5px] font-semibold cursor-pointer transition-colors"
        >
          <Images size={22} /> Gallery
        </button>
      </div>
      <p className="text-[11.5px] text-[#747576] mt-2">
        You choose the square to keep for each photo; it&apos;s saved as 600 × 600 WebP. The first photo is the main
        one on product cards; the second shows on hover.
      </p>

      <input ref={galleryInput} type="file" accept="image/*" multiple hidden onChange={onPick} />
      <input ref={cameraInput} type="file" accept="image/*" capture="environment" hidden onChange={onPick} />

      {cameraOpen && (
        <CameraDialog
          onClose={() => setCameraOpen(false)}
          onCapture={(blob) => {
            setCameraOpen(false);
            enqueue([{ file: blob, name: `camera-${Date.now()}.jpg` }]);
          }}
        />
      )}

      {queue[0] && (
        <PhotoCropDialog
          key={`${batchSize}-${queue.length}`}
          file={queue[0].file}
          label={batchSize > 1 ? `Photo ${batchSize - queue.length + 1} of ${batchSize}` : undefined}
          onCancel={next}
          onDone={(photo) => {
            const item = queue[0];
            next();
            uploadPhoto(photo, item);
          }}
        />
      )}
    </div>
  );
}

/** Live camera for laptops and desktops. The browser asks for camera permission the first time. */
function CameraDialog({ onClose, onCapture }: { onClose: () => void; onCapture: (photo: Blob) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const camerasRef = useRef<MediaDeviceInfo[]>([]);
  const [cameraIndex, setCameraIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("This browser can't open the camera here. Use Gallery instead, or open the admin over https.");
        return;
      }
      try {
        const deviceId = camerasRef.current[cameraIndex]?.deviceId;
        const media = await navigator.mediaDevices.getUserMedia({
          video: deviceId ? { deviceId: { exact: deviceId } } : { facingMode: "environment", width: { ideal: 1920 } },
          audio: false,
        });
        if (cancelled) {
          media.getTracks().forEach((t) => t.stop());
          return;
        }
        stream.current?.getTracks().forEach((t) => t.stop());
        stream.current = media;
        if (video.current) video.current.srcObject = media;
        setError(null);
        // Device names are only listed after permission is granted
        if (camerasRef.current.length === 0) {
          const devices = await navigator.mediaDevices.enumerateDevices();
          camerasRef.current = devices.filter((d) => d.kind === "videoinput");
          if (!cancelled) setCameras(camerasRef.current);
        }
      } catch (err) {
        const name = err instanceof DOMException ? err.name : "";
        setError(
          name === "NotAllowedError"
            ? "Camera permission is blocked. Click the camera icon in the address bar, choose Allow, then try again."
            : name === "NotFoundError"
              ? "No camera found on this device. Use Gallery instead."
              : "Couldn't start the camera. Close other apps using it, or use Gallery instead."
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [cameraIndex]);

  // Turn the camera off when the window closes
  useEffect(() => () => stream.current?.getTracks().forEach((t) => t.stop()), []);

  const capture = () => {
    const v = video.current;
    if (!v || !v.videoWidth) return;
    // The whole frame; the crop step that follows picks the square to keep
    const canvas = document.createElement("canvas");
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    canvas.getContext("2d")!.drawImage(v, 0, 0);
    canvas.toBlob((blob) => blob && onCapture(blob), "image/jpeg", 0.92);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Take a photo">
      <div className="bg-white rounded-2xl w-full max-w-[640px] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#e7e2d8]">
          <span className="font-bold text-[#1f3a2c]">Take a photo</span>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1 cursor-pointer">
            <X size={18} />
          </button>
        </div>
        <div className="bg-black aspect-[4/3] flex items-center justify-center">
          {error ? (
            <p className="text-white text-[14px] text-center px-6">{error}</p>
          ) : (
            <video ref={video} autoPlay playsInline muted className="w-full h-full object-contain" />
          )}
        </div>
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          {cameras.length > 1 ? (
            <button
              type="button"
              onClick={() => setCameraIndex((i) => (i + 1) % cameras.length)}
              className="flex items-center gap-1.5 text-[13px] font-semibold text-[#1f3a2c] cursor-pointer"
            >
              <RefreshCw size={14} /> Switch camera
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={capture}
            disabled={Boolean(error)}
            className="flex items-center gap-2 bg-[#02cb5a] hover:bg-[#02b851] disabled:opacity-50 text-[#1f3a2c] font-bold px-5 py-2.5 rounded-xl cursor-pointer"
          >
            <Camera size={16} /> Capture
          </button>
        </div>
      </div>
    </div>
  );
}
