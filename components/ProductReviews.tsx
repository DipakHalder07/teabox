"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Star,
  Check,
  Search,
  Filter,
  ChevronDown,
  ThumbsUp,
  ThumbsDown,
  Pin,
  X,
  Camera,
  Plus,
} from "lucide-react";

interface Review {
  id: string;
  name: string;
  avatarLetter: string;
  verified: boolean;
  location: string;
  flag: string;
  date: string;
  rating: number;
  title: string;
  comment: string;
  helpfulCount: number;
  unhelpfulCount: number;
  isPinned?: boolean;
  hasPhoto?: boolean;
  photoUrl?: string;
}

const DEFAULT_REVIEWS: Review[] = [
  {
    id: "rev-1",
    name: "TeLa",
    avatarLetter: "T",
    verified: true,
    location: "McKinney, US",
    flag: "🇺🇸",
    date: "08/03/24",
    rating: 5,
    title: "My 1st order",
    comment: "A really nice cup of tea! Absolutely no bitterness! Packed with utmost freshness and clean aroma.",
    helpfulCount: 14,
    unhelpfulCount: 0,
    isPinned: true,
  },
  {
    id: "rev-2",
    name: "Ted Smith",
    avatarLetter: "T",
    verified: true,
    location: "Loveland, US",
    flag: "🇺🇸",
    date: "16/02/24",
    rating: 5,
    title: "This is very flavorful tea",
    comment: "Have been drinking this for awhile as an iced tea. I love it. It is extremely flavorful, unlike the popular teas you can get in other outlets.",
    helpfulCount: 21,
    unhelpfulCount: 1,
    isPinned: true,
  },
  {
    id: "rev-3",
    name: "Pushpa Bakrania",
    avatarLetter: "P",
    verified: true,
    location: "London, UK",
    flag: "🇬🇧",
    date: "24/05/24",
    rating: 5,
    title: "Brilliant tea",
    comment: "Very pleased to receive fresh tea from my mother land. Thank you very nice and so carefully packed. Thank you 🙏",
    helpfulCount: 18,
    unhelpfulCount: 0,
    isPinned: true,
  },
  {
    id: "rev-4",
    name: "Yuvaraj V",
    avatarLetter: "Y",
    verified: true,
    location: "Chennai, IN",
    flag: "🇮🇳",
    date: "12/08/24",
    rating: 5,
    title: "Best Green Tea",
    comment: "I usually buy Silver Needle White tea and for a change I thought of Trying Green tea. This Green tea is best as I know. The taste is bit harder than White tea. But after a sip, I could feel freshness and aroma.",
    helpfulCount: 9,
    unhelpfulCount: 0,
    hasPhoto: true,
    photoUrl: "https://in.teabox.com/cdn/shop/files/darjeeling-carousel-2nd.webp?v=1786966351&width=400",
  },
  {
    id: "rev-5",
    name: "Soumyajit",
    avatarLetter: "S",
    verified: true,
    location: "Kolkata, IN",
    flag: "🇮🇳",
    date: "09/07/23",
    rating: 5,
    title: "Fresh AF!",
    comment: "Fresh quality and also nicely packed. Pure whole leaves with no dust or artificial aromas.",
    helpfulCount: 11,
    unhelpfulCount: 0,
    hasPhoto: true,
    photoUrl: "https://in.teabox.com/cdn/shop/files/darjeeling-carousel-1st.webp?v=1786966351&width=400",
  },
  {
    id: "rev-6",
    name: "Ujjwal",
    avatarLetter: "U",
    verified: true,
    location: "New Delhi, IN",
    flag: "🇮🇳",
    date: "18/12/22",
    rating: 4,
    title: "For its good quality",
    comment: "I like it. Clean, floral, refreshing taste that stays throughout the morning.",
    helpfulCount: 7,
    unhelpfulCount: 0,
  },
];

const CUSTOMER_PHOTOS = [
  "https://in.teabox.com/cdn/shop/files/darjeeling-carousel-1st.webp?v=1786966351&width=400",
  "https://in.teabox.com/cdn/shop/files/darjeeling-carousel-2nd.webp?v=1786966351&width=400",
  "https://in.teabox.com/cdn/shop/files/darjeeling-carousel-3rd.webp?v=1786966351&width=400",
  "https://in.teabox.com/cdn/shop/files/darjeeling-carousel-4th.webp?v=1786966351&width=400",
  "https://in.teabox.com/cdn/shop/files/darjeeling-carousel-5th.webp?v=1786966351&width=400",
];

export default function ProductReviews({
  productTitle,
  rating = 4.9,
  reviewsCount = 117,
}: {
  productTitle: string;
  rating?: number;
  reviewsCount?: number;
}) {
  const [reviews, setReviews] = useState<Review[]>(DEFAULT_REVIEWS);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [sortBy, setSortBy] = useState<"pictures" | "recent" | "highest" | "lowest">("pictures");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [selectedPhotoModal, setSelectedPhotoModal] = useState<string | null>(null);

  // Write a review modal state
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newComment, setNewComment] = useState("");
  const [submittedMessage, setSubmittedMessage] = useState(false);

  // Helpful counter click handler
  const handleVote = (id: string, type: "up" | "down") => {
    setReviews((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          return {
            ...r,
            helpfulCount: type === "up" ? r.helpfulCount + 1 : r.helpfulCount,
            unhelpfulCount: type === "down" ? r.unhelpfulCount + 1 : r.unhelpfulCount,
          };
        }
        return r;
      })
    );
  };

  const handleWriteReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newTitle || !newComment) return;

    const newRev: Review = {
      id: `rev-${Date.now()}`,
      name: newName,
      avatarLetter: newName.charAt(0).toUpperCase() || "C",
      verified: true,
      location: "India",
      flag: "🇮🇳",
      date: new Date().toLocaleDateString("en-GB"),
      rating: newRating,
      title: newTitle,
      comment: newComment,
      helpfulCount: 0,
      unhelpfulCount: 0,
    };

    setReviews([newRev, ...reviews]);
    setSubmittedMessage(true);
    setTimeout(() => {
      setSubmittedMessage(false);
      setIsWriteModalOpen(false);
      setNewName("");
      setNewEmail("");
      setNewTitle("");
      setNewComment("");
    }, 1500);
  };

  // Filter and sort reviews
  const displayedReviews = reviews
    .filter((r) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        r.title.toLowerCase().includes(q) ||
        r.comment.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sortBy === "pictures") {
        if (a.hasPhoto && !b.hasPhoto) return -1;
        if (!a.hasPhoto && b.hasPhoto) return 1;
        return 0;
      }
      if (sortBy === "highest") return b.rating - a.rating;
      if (sortBy === "lowest") return a.rating - b.rating;
      return 0; // recent
    });

  return (
    <section id="judgeme_product_reviews" className="w-full bg-[#fafafa] border-t border-[#E7E2D8] py-12 sm:py-16 px-4 sm:px-6 lg:px-12 scroll-mt-24">
      <div className="max-w-[1200px] mx-auto space-y-8">
        {/* ========================================================================= */}
        {/* 1. SECTION HEADER (TITLE, SCORE, CONTROLS)                                */}
        {/* ========================================================================= */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-[#e7e2d8] pb-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-10">
            <div>
              <h2 className="text-[26px] sm:text-[32px] font-bold text-[#202020] leading-tight">
                Customer Reviews
              </h2>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center text-[#1f3a2c]">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={19} className="fill-[#1f3a2c] text-[#1f3a2c]" />
                  ))}
                </div>
                <span className="text-[20px] font-bold text-[#202020]">{rating}</span>
                <span className="text-[14px] text-[#747576]">·</span>
                <span className="text-[14px] text-[#5c5a52]">Based on {reviewsCount} reviews</span>
              </div>
            </div>

            {/* Judge.me Rating Distribution Histogram */}
            <div className="flex flex-col gap-1 text-[12px] text-[#5c5a52] min-w-[200px]">
              <div className="flex items-center gap-2">
                <span className="w-12 text-right">5 stars</span>
                <div className="w-24 sm:w-32 h-2.5 bg-[#e8e6df] rounded-full overflow-hidden">
                  <div className="h-full bg-[#1f3a2c] rounded-full" style={{ width: "88%" }} />
                </div>
                <span>88% (103)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-12 text-right">4 stars</span>
                <div className="w-24 sm:w-32 h-2.5 bg-[#e8e6df] rounded-full overflow-hidden">
                  <div className="h-full bg-[#1f3a2c] rounded-full" style={{ width: "12%" }} />
                </div>
                <span>12% (14)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-12 text-right">3 stars</span>
                <div className="w-24 sm:w-32 h-2.5 bg-[#e8e6df] rounded-full overflow-hidden">
                  <div className="h-full bg-[#1f3a2c] rounded-full" style={{ width: "0%" }} />
                </div>
                <span>0% (0)</span>
              </div>
            </div>
          </div>

          {/* Action buttons: Search, Filter, Sort Dropdown & Write Review */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search Toggle */}
            <button
              type="button"
              onClick={() => setShowSearch(!showSearch)}
              aria-label="Search reviews"
              className="p-2.5 rounded-lg border border-[#202020] hover:bg-white text-[#202020] transition-colors cursor-pointer"
            >
              <Search size={16} />
            </button>

            {/* Sort Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsSortOpen(!isSortOpen)}
                className="px-3.5 py-2.5 rounded-lg border border-[#202020] text-[13.5px] font-semibold text-[#202020] flex items-center gap-2 hover:bg-white transition-colors cursor-pointer"
              >
                <span>
                  {sortBy === "pictures"
                    ? "Pictures First"
                    : sortBy === "recent"
                    ? "Most Recent"
                    : sortBy === "highest"
                    ? "Highest Rating"
                    : "Lowest Rating"}
                </span>
                <ChevronDown size={14} />
              </button>

              {isSortOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setIsSortOpen(false)} />
                  <div className="absolute right-0 top-full mt-1.5 w-[180px] bg-white border border-[#e7e2d8] rounded-lg shadow-xl z-40 py-1.5 animate-in fade-in zoom-in-95 duration-100">
                    {[
                      { id: "pictures", label: "Pictures First" },
                      { id: "recent", label: "Most Recent" },
                      { id: "highest", label: "Highest Rating" },
                      { id: "lowest", label: "Lowest Rating" },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setSortBy(opt.id as any);
                          setIsSortOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2 text-[13px] hover:bg-[#fafafa] cursor-pointer ${
                          sortBy === opt.id ? "font-bold text-[#016c2f] bg-[#f0f9f3]" : "text-[#202020]"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Write a Review Button */}
            <button
              type="button"
              onClick={() => setIsWriteModalOpen(true)}
              className="bg-[#1f3a2c] hover:bg-[#016c2f] text-white px-4 py-2.5 rounded-lg text-[13.5px] font-bold tracking-wide transition-colors cursor-pointer"
            >
              Write a Review
            </button>
          </div>
        </div>

        {/* Search Input Bar (when expanded) */}
        {showSearch && (
          <div className="animate-in fade-in duration-150">
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reviews by keywords, flavors, or aroma..."
              className="w-full px-4 py-2.5 border border-[#e7e2d8] rounded-lg text-[14px] bg-white outline-none focus:border-[#02cb5a]"
            />
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. REAL CUSTOMER PHOTOS GALLERY STRIP                                     */}
        {/* ========================================================================= */}
        <div className="space-y-2">
          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
            {CUSTOMER_PHOTOS.map((src, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedPhotoModal(src)}
                className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-[10px] overflow-hidden border border-[#e7e2d8] bg-white shrink-0 cursor-pointer hover:border-[#1f3a2c] transition-all group"
              >
                <Image
                  src={src}
                  alt={`Customer Photo ${idx + 1}`}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            ))}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. REVIEWS LIST                                                           */}
        {/* ========================================================================= */}
        <div className="divide-y divide-[#e7e2d8]">
          {displayedReviews.map((rev) => (
            <article key={rev.id} className="py-6 sm:py-8 space-y-3">
              {/* Stars & Pin Icon */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-[#1f3a2c]">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={15}
                      className={
                        i < rev.rating
                          ? "fill-[#1f3a2c] text-[#1f3a2c]"
                          : "text-[#d6d4cb]"
                      }
                    />
                  ))}
                </div>

                {rev.isPinned && (
                  <span
                    className="p-1 text-[#5c5a52] hover:text-[#202020]"
                    title="Featured Review"
                  >
                    <Pin size={15} className="rotate-45 text-[#1f3a2c] fill-[#1f3a2c]" />
                  </span>
                )}
              </div>

              {/* Author & Verification Info */}
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#e8e6df] text-[#202020] font-bold text-[13px] flex items-center justify-center shrink-0">
                  {rev.avatarLetter}
                </div>
                <div className="flex items-center gap-2 flex-wrap text-[13.5px]">
                  <span className="font-bold text-[#202020]">{rev.name}</span>
                  {rev.verified && (
                    <span className="border border-[#d6d4cb] bg-white text-[#5c5a52] text-[11px] font-semibold px-2 py-0.5 rounded-full">
                      Verified
                    </span>
                  )}
                  <span className="text-[#747576]">
                    {rev.location} {rev.flag} • {rev.date}
                  </span>
                </div>
              </div>

              {/* Review Title */}
              <h4 className="text-[16px] font-bold text-[#202020] leading-snug">
                {rev.title}
              </h4>

              {/* Review Text Body */}
              <p className="text-[14px] sm:text-[14.5px] text-[#3d3b36] leading-relaxed max-w-[800px]">
                {rev.comment}
              </p>

              {/* Attached Review Photo if any */}
              {rev.hasPhoto && rev.photoUrl && (
                <div
                  onClick={() => setSelectedPhotoModal(rev.photoUrl!)}
                  className="relative w-20 h-20 rounded-[8px] overflow-hidden border border-[#e7e2d8] cursor-pointer hover:border-[#1f3a2c] transition-all mt-2"
                >
                  <Image
                    src={rev.photoUrl}
                    alt={rev.title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}

              {/* Helpful Actions */}
              <div className="flex items-center gap-4 pt-2 text-[12.5px] text-[#747576]">
                <span>Was this helpful?</span>
                <button
                  type="button"
                  onClick={() => handleVote(rev.id, "up")}
                  className="flex items-center gap-1.5 hover:text-[#1f3a2c] cursor-pointer transition-colors"
                >
                  <ThumbsUp size={14} />
                  <span>({rev.helpfulCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleVote(rev.id, "down")}
                  className="flex items-center gap-1.5 hover:text-[#e53935] cursor-pointer transition-colors"
                >
                  <ThumbsDown size={14} />
                  <span>({rev.unhelpfulCount})</span>
                </button>
              </div>
            </article>
          ))}
        </div>

        {/* Load More Button */}
        <div className="text-center pt-4 border-t border-[#e7e2d8]">
          <button
            type="button"
            className="border border-[#1f3a2c] hover:bg-white text-[#1f3a2c] font-bold text-[14px] px-8 py-3 rounded-lg transition-colors cursor-pointer"
          >
            Load More Reviews ({reviews.length} of {reviewsCount})
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. PHOTO LIGHTBOX MODAL                                                   */}
      {/* ========================================================================= */}
      {selectedPhotoModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 animate-in fade-in"
          onClick={() => setSelectedPhotoModal(null)}
        >
          <button
            type="button"
            onClick={() => setSelectedPhotoModal(null)}
            className="absolute top-5 right-5 text-white/80 hover:text-white p-2 rounded-full cursor-pointer"
          >
            <X size={28} />
          </button>
          <div className="relative max-w-[90vw] max-h-[85vh] w-[600px] h-[600px]">
            <Image
              src={selectedPhotoModal}
              alt="Customer Review Photo"
              fill
              className="object-contain"
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. WRITE A REVIEW MODAL                                                   */}
      {/* ========================================================================= */}
      {isWriteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-[500px] bg-white rounded-2xl shadow-2xl border border-[#e7e2d8] p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between border-b border-[#e7e2d8] pb-3">
              <h3 className="font-bold text-[18px] text-[#202020]">
                Write a Review for {productTitle}
              </h3>
              <button
                type="button"
                onClick={() => setIsWriteModalOpen(false)}
                className="text-[#5c5a52] hover:text-[#202020] p-1 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {submittedMessage ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-[#02cb5a]/20 border-2 border-[#02cb5a] flex items-center justify-center mx-auto text-[#016c2f]">
                  <Check size={32} />
                </div>
                <h4 className="font-bold text-[18px] text-[#202020]">
                  Thank You For Your Review!
                </h4>
                <p className="text-[13.5px] text-[#5c5a52]">
                  Your review has been verified and posted.
                </p>
              </div>
            ) : (
              <form onSubmit={handleWriteReviewSubmit} className="space-y-4">
                {/* Rating Stars Picker */}
                <div>
                  <label className="block text-[13px] font-bold text-[#202020] mb-1">
                    Rating *
                  </label>
                  <div className="flex items-center gap-1.5 text-[#1f3a2c]">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewRating(star)}
                        className="cursor-pointer hover:scale-110 transition-transform"
                      >
                        <Star
                          size={24}
                          className={
                            star <= newRating
                              ? "fill-[#1f3a2c] text-[#1f3a2c]"
                              : "text-[#d6d4cb]"
                          }
                        />
                      </button>
                    ))}
                    <span className="text-[13px] font-bold text-[#202020] ml-2">
                      {newRating} / 5 Stars
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-[12.5px] font-bold text-[#202020] mb-1">
                    Review Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Delicious morning tea!"
                    className="w-full px-3.5 py-2 border border-[#e7e2d8] rounded-lg text-[14px] outline-none focus:border-[#02cb5a]"
                  />
                </div>

                <div>
                  <label className="block text-[12.5px] font-bold text-[#202020] mb-1">
                    Your Review *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Describe the aroma, flavor notes, and freshness..."
                    className="w-full px-3.5 py-2 border border-[#e7e2d8] rounded-lg text-[14px] outline-none focus:border-[#02cb5a]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[12.5px] font-bold text-[#202020] mb-1">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="e.g. Priya"
                      className="w-full px-3.5 py-2 border border-[#e7e2d8] rounded-lg text-[14px] outline-none focus:border-[#02cb5a]"
                    />
                  </div>
                  <div>
                    <label className="block text-[12.5px] font-bold text-[#202020] mb-1">
                      Your Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full px-3.5 py-2 border border-[#e7e2d8] rounded-lg text-[14px] outline-none focus:border-[#02cb5a]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#02cb5a] hover:bg-[#02b851] text-[#1f3a2c] font-bold text-[15px] py-3 rounded-lg uppercase tracking-wider transition-colors cursor-pointer shadow-sm mt-2"
                >
                  Submit Review
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
