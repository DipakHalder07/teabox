"use client";

import { useEffect, useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Check, Loader2, RotateCw, X, ZoomIn, ZoomOut } from "lucide-react";

// Crop a product photo to a square before upload. The whole photo is shown: the bright square is
// kept, the darkened part is cut off, and a live preview shows exactly what will be saved.
// "Whole photo" keeps everything on a white background instead. Saved as 600 × 600 WebP.

const OUTPUT = 1200; // the server makes the final 600 × 600; extra pixels keep it sharp
const PREVIEW = 240;

type Mode = "crop" | "whole";

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// The turned photo is reused while only the crop or zoom changes (phone photos are large)
const turnedCache = new WeakMap<HTMLImageElement, { rotation: number; canvas: HTMLCanvasElement }>();

/** The photo turned by `rotation` degrees, drawn on its own canvas. */
function rotated(img: HTMLImageElement, rotation: number) {
  const cached = turnedCache.get(img);
  if (cached && cached.rotation === rotation) return cached.canvas;
  const canvas = turn(img, rotation);
  turnedCache.set(img, { rotation, canvas });
  return canvas;
}

function turn(img: HTMLImageElement, rotation: number) {
  const rad = (rotation * Math.PI) / 180;
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const bw = Math.abs(Math.cos(rad) * w) + Math.abs(Math.sin(rad) * h);
  const bh = Math.abs(Math.sin(rad) * w) + Math.abs(Math.cos(rad) * h);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bw);
  canvas.height = Math.round(bh);
  const ctx = canvas.getContext("2d")!;
  ctx.translate(bw / 2, bh / 2);
  ctx.rotate(rad);
  ctx.drawImage(img, -w / 2, -h / 2);
  return canvas;
}

/** Draws the final square: the chosen crop, or the whole photo on white. */
function draw(img: HTMLImageElement, mode: Mode, rotation: number, area: Area | null, size: number) {
  const source = rotated(img, rotation);
  const out = document.createElement("canvas");
  out.width = size;
  out.height = size;
  const ctx = out.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);
  ctx.imageSmoothingQuality = "high";
  if (mode === "whole" || !area) {
    const scale = Math.min(size / source.width, size / source.height);
    const w = source.width * scale;
    const h = source.height * scale;
    ctx.drawImage(source, (size - w) / 2, (size - h) / 2, w, h);
  } else {
    ctx.drawImage(source, area.x, area.y, area.width, area.height, 0, 0, size, size);
  }
  return out;
}

export default function PhotoCropDialog({
  file,
  label,
  onCancel,
  onDone,
}: {
  file: Blob;
  label?: string; // e.g. "Photo 2 of 3"
  onCancel: () => void;
  onDone: (photo: Blob) => void;
}) {
  const [image, setImage] = useState<{ src: string; el: HTMLImageElement } | null>(null);
  const [unreadable, setUnreadable] = useState(false);
  const [mode, setMode] = useState<Mode>("crop");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [area, setArea] = useState<Area | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // A temporary link to the picked photo, made and removed together (safe when React mounts twice)
  useEffect(() => {
    const src = URL.createObjectURL(file);
    let cancelled = false;
    loadImage(src)
      .then((el) => !cancelled && setImage({ src, el }))
      .catch(() => !cancelled && setUnreadable(true));
    return () => {
      cancelled = true;
      URL.revokeObjectURL(src);
    };
  }, [file]);

  // Live "how it will look" preview, redrawn shortly after each change
  useEffect(() => {
    if (!image) return;
    if (previewTimer.current) clearTimeout(previewTimer.current);
    previewTimer.current = setTimeout(() => {
      setPreview(draw(image.el, mode, rotation, area, PREVIEW).toDataURL("image/jpeg", 0.85));
    }, 120);
    return () => {
      if (previewTimer.current) clearTimeout(previewTimer.current);
    };
  }, [image, mode, rotation, area]);

  // Esc skips this photo
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const done = async () => {
    if (!image) {
      onDone(file); // the browser can't show it (e.g. HEIC on a laptop): the server keeps the centre square
      return;
    }
    setWorking(true);
    try {
      const canvas = draw(image.el, mode, rotation, area, OUTPUT);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
      if (blob) onDone(blob);
    } finally {
      setWorking(false);
    }
  };

  const tab = (m: Mode, text: string) => (
    <button
      type="button"
      onClick={() => setMode(m)}
      className={`flex-1 py-2 text-[13px] font-semibold rounded-lg cursor-pointer transition-colors ${
        mode === m ? "bg-white text-[#1f3a2c] shadow-sm" : "text-[#5c5a52] hover:text-[#202020]"
      }`}
    >
      {text}
    </button>
  );

  return (
    <div className="fixed inset-0 z-[110] bg-black/75 flex items-center justify-center p-2 sm:p-4" role="dialog" aria-modal="true" aria-label="Crop photo">
      <div className="bg-white rounded-2xl w-full max-w-[680px] max-h-[96vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#e7e2d8]">
          <div>
            <div className="font-bold text-[#1f3a2c]">Choose what to show</div>
            <div className="text-[11.5px] text-[#747576]">{label ? `${label} · ` : ""}Saved as a 600 × 600 square</div>
          </div>
          <button type="button" onClick={onCancel} aria-label="Skip this photo" className="p-1 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto">
          {unreadable ? (
            <div className="m-4 aspect-[4/3] rounded-xl bg-[#f3f1ec] flex items-center justify-center p-8 text-center text-[14px] text-[#5c5a52]">
              This browser can&apos;t show this photo (for example an iPhone HEIC photo on a laptop). You can still upload
              it; the centre square will be kept.
            </div>
          ) : (
            <>
              <div className="px-4 pt-3">
                <div className="flex gap-1 bg-[#f3f1ec] p-1 rounded-xl">
                  {tab("crop", "Crop to square")}
                  {tab("whole", "Keep whole photo")}
                </div>
              </div>

              {/* The whole photo: inside the frame is kept, the dark part is cut off */}
              <div className="relative aspect-[4/3] mx-4 mt-3 rounded-xl overflow-hidden bg-[#2a2a2a]">
                {!image ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="animate-spin text-white/70" />
                  </div>
                ) : mode === "crop" ? (
                  <Cropper
                    image={image.src}
                    crop={crop}
                    zoom={zoom}
                    rotation={rotation}
                    aspect={1}
                    minZoom={1}
                    maxZoom={4}
                    objectFit="contain"
                    showGrid
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={(_, pixels) => setArea(pixels)}
                    style={{ cropAreaStyle: { border: "2px solid #ffffff", color: "rgba(0, 0, 0, 0.6)" } }}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-full aspect-square bg-white flex items-center justify-center outline-2 outline-white">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={image.src} alt="" className="max-w-full max-h-full object-contain" style={{ transform: `rotate(${rotation}deg)` }} />
                    </div>
                  </div>
                )}
              </div>

              <div className="px-4 pt-3 flex items-center gap-3">
                {mode === "crop" ? (
                  <>
                    <ZoomOut size={16} className="text-[#747576] shrink-0" />
                    <input
                      type="range"
                      min={1}
                      max={4}
                      step={0.01}
                      value={zoom}
                      onChange={(e) => setZoom(Number(e.target.value))}
                      aria-label="Zoom"
                      className="flex-1 accent-[#1f3a2c]"
                    />
                    <ZoomIn size={16} className="text-[#747576] shrink-0" />
                  </>
                ) : (
                  <span className="flex-1 text-[12.5px] text-[#5c5a52]">Nothing is cut off: white space fills the square.</span>
                )}
                <button
                  type="button"
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  aria-label="Rotate 90 degrees"
                  className="shrink-0 p-2 rounded-lg border border-[#d6d3cb] hover:border-[#1f3a2c] cursor-pointer"
                >
                  <RotateCw size={16} />
                </button>
              </div>

              <div className="m-4 flex items-center gap-4 bg-[#fafafa] border border-[#e7e2d8] rounded-xl p-3">
                <div className="w-[96px] h-[96px] shrink-0 rounded-lg border border-[#e7e2d8] bg-white overflow-hidden flex items-center justify-center">
                  {preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={preview} alt="How the photo will look" className="w-full h-full" />
                  ) : (
                    <Loader2 size={16} className="animate-spin text-[#747576]" />
                  )}
                </div>
                <div className="text-[12.5px] text-[#5c5a52] leading-relaxed">
                  <div className="font-bold text-[#202020] text-[13.5px]">How it will look in the shop</div>
                  {mode === "crop" ? (
                    <>
                      Only the part <strong>inside the white frame</strong> is kept; the darkened part is cut off. Drag the
                      photo to move it, pinch or use the slider to zoom.
                    </>
                  ) : (
                    <>The whole photo is kept, centred on a white square.</>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-[#e7e2d8]">
          <button type="button" onClick={onCancel} className="px-4 py-2.5 rounded-xl border border-[#d6d3cb] text-[13.5px] font-semibold cursor-pointer">
            Skip
          </button>
          <button
            type="button"
            onClick={done}
            disabled={working || (!image && !unreadable)}
            className="flex items-center gap-2 bg-[#1f3a2c] hover:bg-[#16291f] disabled:opacity-60 text-white font-bold text-[14px] px-5 py-2.5 rounded-xl cursor-pointer"
          >
            {working ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
            Use photo
          </button>
        </div>
      </div>
    </div>
  );
}
