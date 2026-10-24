"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { cleanIndianPhone } from "@/lib/validations/checkout";
import {
  Check,
  Plus,
  Minus,
  CheckCircle2,
  Star,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import SiteLayoutWrapper from "@/components/SiteLayoutWrapper";
import "./corporate-gifting.css";

interface ProductItem {
  id: string;
  title: string;
  image: string;
  bullets: string[];
  badge?: string;
  discount?: string;
}

export default function CorporateGiftingPage() {
  const [activeTab, setActiveTab] = useState<"gifts" | "trial" | "teaware">("gifts");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [clientIndex, setClientIndex] = useState(0);

  // Carousel ref for products
  const productScrollRef = useRef<HTMLDivElement>(null);

  // RFQ Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [quantity, setQuantity] = useState("50 - 200 units");
  const [budget, setBudget] = useState("Under INR 3,000");
  const [selectedGift, setSelectedGift] = useState("");
  const [message, setMessage] = useState("");
  const [formSubmitted, setFormSubmitted] = useState(false);

  // Clean phone input
  useEffect(() => {
    if (phone) {
      const cleaned = cleanIndianPhone(phone);
      if (cleaned !== phone) {
        setPhone(cleaned);
      }
    }
  }, [phone]);

  const handleSelectGift = (giftTitle: string) => {
    setSelectedGift(giftTitle);
    const formElem = document.getElementById("inquiry");
    if (formElem) {
      formElem.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleBudgetClick = (budgetText: string) => {
    setBudget(budgetText);
    const formElem = document.getElementById("inquiry");
    if (formElem) {
      formElem.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const scrollProducts = (direction: "left" | "right") => {
    if (productScrollRef.current) {
      const scrollAmount = 320;
      productScrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = cleanIndianPhone(phone);
    if (!name.trim()) {
      alert("Please enter your name.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      alert("Please enter a valid work email.");
      return;
    }
    if (!cleanPhone || cleanPhone.length < 10) {
      alert("Please enter a valid 10-digit Indian phone number.");
      return;
    }
    setFormSubmitted(true);
  };

  // 1. STATS TICKER (3 Pillars)
  const stats = [
    {
      icon: "https://assets.replocdn.com/projects/7711d8fe-fb35-45dc-9008-40f0c2da5c41/65ef9ed7-c361-404c-bdf3-37109e8771bd",
      num: "273",
      label: "Tea Gardens at Source",
    },
    {
      icon: "https://assets.replocdn.com/projects/7711d8fe-fb35-45dc-9008-40f0c2da5c41/fed6460e-e914-4007-8299-8e6678743fdb",
      num: "5 billion+",
      label: "Cups Served",
    },
    {
      icon: "https://assets.replocdn.com/projects/7711d8fe-fb35-45dc-9008-40f0c2da5c41/7677e2b2-b34b-45ea-9ef5-2504ebc7c485",
      num: "125+",
      label: "Countries Shipped to",
    },
  ];

  // 2. BUDGET TIERS (With spinning gold ring animation)
  const budgetTiers = [
    {
      budget: "Under INR 1,000",
      image: "https://assets.replocdn.com/projects/7711d8fe-fb35-45dc-9008-40f0c2da5c41/276971fd-e87a-49ac-8d3c-7d0c33d55620",
    },
    {
      budget: "Under INR 3,000",
      image: "https://assets.replocdn.com/projects/7711d8fe-fb35-45dc-9008-40f0c2da5c41/d13ea56f-9ce0-4c2c-b318-a7df1b28f35a",
    },
    {
      budget: "Under INR 5,000",
      image: "https://assets.replocdn.com/projects/7711d8fe-fb35-45dc-9008-40f0c2da5c41/af58375b-40bc-4bef-aadb-b3c6272bc8de",
    },
    {
      budget: "Above INR 10,000",
      image: "https://assets.replocdn.com/projects/7711d8fe-fb35-45dc-9008-40f0c2da5c41/7cae4bf8-d282-471e-a563-43cbf6ecbacd",
    },
  ];

  // 3. 10 REAL WORKING LOGOS (Verified 200 OK from live Teabox Replo page)
  const clientLogos = [
    "https://assets.replocdn.com/projects/7711d8fe-fb35-45dc-9008-40f0c2da5c41/373829ae-36bc-4dbf-84a2-8fb8cc883fcc",
    "https://assets.replocdn.com/projects/7711d8fe-fb35-45dc-9008-40f0c2da5c41/74dddb0c-70c0-4171-aa5d-e1425ef4a3e9",
    "https://assets.replocdn.com/projects/7711d8fe-fb35-45dc-9008-40f0c2da5c41/9c3356aa-05ee-4d03-9973-22d4425b0ef8",
    "https://assets.replocdn.com/projects/7711d8fe-fb35-45dc-9008-40f0c2da5c41/b66482d2-68e7-44f9-93cf-df2db71aa97e",
    "https://assets.replocdn.com/projects/7711d8fe-fb35-45dc-9008-40f0c2da5c41/d7eb740d-39a3-42e3-a771-045b87772b15",
    "https://assets.replocdn.com/projects/7711d8fe-fb35-45dc-9008-40f0c2da5c41/4330aceb-0e62-4046-b858-df3d20a22a26",
    "https://assets.replocdn.com/projects/7711d8fe-fb35-45dc-9008-40f0c2da5c41/3ab6c681-447c-4132-afc0-eec957ea97a4",
    "https://assets.replocdn.com/projects/7711d8fe-fb35-45dc-9008-40f0c2da5c41/a03677f1-67d1-4b5c-b1ec-eb94270b10d2",
    "https://assets.replocdn.com/projects/7711d8fe-fb35-45dc-9008-40f0c2da5c41/b5bf24ff-1715-4442-bd87-583b5ff150b7",
    "https://assets.replocdn.com/projects/7711d8fe-fb35-45dc-9008-40f0c2da5c41/05e5b7da-4c41-439e-b584-7f713e2a05a5",
  ];

  // Auto-advance client logos slider every 3.5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setClientIndex((prev) => (prev + 1) % clientLogos.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [clientLogos.length]);

  const prevClientSlide = () => {
    setClientIndex((prev) => (prev === 0 ? clientLogos.length - 1 : prev - 1));
  };

  const nextClientSlide = () => {
    setClientIndex((prev) => (prev + 1) % clientLogos.length);
  };

  // 4. WHY TEABOX PILLARS (5 from live page)
  const whyTeabox = [
    {
      icon: "https://assets.replocdn.com/projects/7711d8fe-fb35-45dc-9008-40f0c2da5c41/7cf1d3df-a50b-4991-8038-5a79eaa2ee1f",
      title: "FOR ALL OCCASIONS",
      desc: "Diwali, year-end gifts, milestones, team welcomes, and client appreciation.",
    },
    {
      icon: "https://assets.replocdn.com/projects/7711d8fe-fb35-45dc-9008-40f0c2da5c41/53894580-6b95-429b-b71d-03d63cc32950",
      title: "FOR EVERY BUDGET",
      desc: "Tailored selections ranging from ₹149 up to ultra-luxury bespoke trunks.",
    },
    {
      icon: "https://assets.replocdn.com/projects/7711d8fe-fb35-45dc-9008-40f0c2da5c41/8fbb84fe-0e7d-4951-b165-61c1822184f3",
      title: "CUSTOMIZE & PERSONALIZE",
      desc: "Brand logo screen printing, custom sleeves, personalized notes and ribbon finishes.",
    },
    {
      icon: "https://assets.replocdn.com/projects/7711d8fe-fb35-45dc-9008-40f0c2da5c41/974e1eb3-ff89-4bc8-8daf-731151bd6525",
      title: "50+ FRESH INDIAN TEAS",
      desc: "Direct from 273+ estate gardens across Darjeeling, Assam, and Nilgiri.",
    },
    {
      icon: "https://assets.replocdn.com/projects/7711d8fe-fb35-45dc-9008-40f0c2da5c41/ac4888f9-9c16-4efb-b097-ac699c9841f4",
      title: "CUSTOMER SUPPORT",
      desc: "Dedicated gifting managers offering end-to-end multi-address logistics.",
    },
  ];

  // 5. PRODUCTS (Gifts / Diwali Edition, Trial Packs, Teaware)
  const diwaliGifts: ProductItem[] = [
    {
      id: "darjeeling-gift-box",
      title: "Darjeeling Gift Box",
      image: "https://assets.replocdn.com/projects/7711d8fe-fb35-45dc-9008-40f0c2da5c41/5476811c-5d4f-46a0-b015-b53c75544bb2",
      badge: "DIWALI EDITION",
      bullets: [
        "3 Whole Leaf Darjeeling Teas",
        "Handwoven Cotton Khada",
        "Personalised Postcard Set of 3",
      ],
    },
    {
      id: "chai-lovers-dream",
      title: "Chai Lover's Dream Gift",
      image: "https://assets.replocdn.com/projects/7711d8fe-fb35-45dc-9008-40f0c2da5c41/3f9c8bb6-2c41-40d2-af0a-f80c0f489cdf",
      badge: "DIWALI EDITION",
      bullets: [
        "6 Signature Exotic Chai Blends",
        "Eco-Friendly Illustrated Packaging",
        "Elegant Screw-Lock Tin Caddies",
      ],
    },
    {
      id: "fleur-gourmet",
      title: "Fleur: Gourmet Tea Gift",
      image: "https://assets.replocdn.com/projects/7711d8fe-fb35-45dc-9008-40f0c2da5c41/55c8bbd3-75cf-45d0-af75-cf5aa2ed256b",
      badge: "DIWALI EDITION",
      bullets: [
        "6 gourmet teas",
        "With a timeless infuser",
        "Premium presentation box",
      ],
    },
    {
      id: "vivant-vibrant",
      title: "VIVANT: VIBRANT GIFT BOX",
      image: "https://assets.replocdn.com/projects/7711d8fe-fb35-45dc-9008-40f0c2da5c41/d078e0dc-01ad-4edc-84a2-4b5051ee45d9",
      badge: "DIWALI EDITION",
      bullets: [
        "3 Fragrant Exotic Tea Blends",
        "Screw-Lock Golden Tin Caddies",
        "Sustainable Packaging",
      ],
    },
    {
      id: "assam-soiree",
      title: "ASSAM SOIREE",
      image: "https://assets.replocdn.com/projects/7711d8fe-fb35-45dc-9008-40f0c2da5c41/6335fabc-0a61-43cd-8622-2b6ad7aa2396",
      badge: "DIWALI EDITION",
      bullets: [
        "5 Exquisite Assam Teas in Tins",
        "Traditional Jaapi & Gamocha",
        "Tea Estate Postcards & Poetry",
      ],
    },
    {
      id: "chai-tea-gift-box",
      title: "THE CHAI TEA GIFT BOX",
      image: "https://assets.replocdn.com/projects/7711d8fe-fb35-45dc-9008-40f0c2da5c41/b3e839e7-c657-4e08-b216-d037fc1dfc00",
      badge: "DIWALI EDITION",
      bullets: [
        "6 Signature Indian Chai Blends",
        "Stainless Steel Ideal Teaspoon",
        "Premium Eco-Friendly Packaging",
      ],
    },
    {
      id: "odessey",
      title: "Odessey",
      image: "https://assets.replocdn.com/projects/7711d8fe-fb35-45dc-9008-40f0c2da5c41/323d9ca8-fff8-4576-a13a-ca553010992b",
      badge: "DIWALI EDITION",
      bullets: [
        "9 Exotic Tea Blends",
        "Elegant Golden Tin Caddies",
        "Eco-Friendly Packaging",
      ],
    },
    {
      id: "samriddhi",
      title: "Samriddhi - The Gift of Teabox",
      image: "https://assets.replocdn.com/projects/7711d8fe-fb35-45dc-9008-40f0c2da5c41/3c29381a-1226-4c9d-adbc-6b2a51d1fef9",
      badge: "DIWALI EDITION",
      bullets: [
        "9 Handcrafted Blends",
        "Crafted with Real Ingredients",
        "Screw-Lock Golden Tin Caddies",
      ],
    },
  ];

  const trialPacks: ProductItem[] = [
    {
      id: "authentic-chai-trial",
      title: "Authentic Indian Chai Trial Pack",
      image: "https://in.teabox.com/cdn/shop/files/Authentic_Indian_Chai_Trial_Pack_Free_Valencia_Glass_Teacup_Ideal_Teaspoon_f9b4ab21-d0d8-46c3-8510-cb3d154a1af8.jpg?v=1792663439&width=600",
      bullets: [
        "10 Authentic Indian Chais",
        "Free Double-Walled Glass",
        "Free Stainless Steel Spoon",
      ],
    },
    {
      id: "wellness-green-sampler",
      title: "Wellness Green Teabag Sampler (50 Teabags)",
      image: "https://in.teabox.com/cdn/shop/files/Wellness_Green_Teabag_Sampler_50_Teabags_15c936f3-7756-402e-ba5e-6d85a07814b8.jpg?v=1792663410&width=600",
      bullets: [
        "10 different varieties",
        "Improves Health",
        "50 Teabags In Total",
      ],
    },
    {
      id: "assorted-chai-premix",
      title: "Assorted Chai Premix - Pack of 60 (+ Free Glass Cup)",
      image: "https://in.teabox.com/cdn/shop/files/Two_Premix_Box_Glass_Cup_Free_Listing_Images_2.jpg?v=1773993164&width=600",
      bullets: [
        "Naturally Sweetened",
        "Rich in Prebiotic Fiber (FOS)",
        "5 Iconic Flavours",
      ],
    },
    {
      id: "darjeeling-assam-whole-leaf",
      title: "Darjeeling & Assam Whole Leaf Tea Trial Pack",
      image: "https://in.teabox.com/cdn/shop/files/Darjeeling_Assam_Whole_Leaf_Tea_Trial_Pack_Free_Infuser_Mug_Teaspoon_1_b9729053-0f3f-45c0-8fe9-20ac2f53a29c.jpg?v=1792663384&width=600",
      bullets: [
        "Whole Leaf Darjeeling & Assam",
        "Free Infuser Mug & Ideal Spoon",
        "Explore India's Finest Teas",
      ],
    },
    {
      id: "ayurvedic-chai-trial",
      title: "Ayurvedic Chai Trial Pack (Free Glass Teacup & Spoon)",
      image: "https://in.teabox.com/cdn/shop/files/Ayurvedic_Chai_Trial_Pack_Free_Valencia_Glass_Teacup_Ideal_Teaspoon.jpg?v=1792663493&width=600",
      bullets: [
        "Whole Leaf Darjeeling & Assam Teas",
        "Free Infuser Mug & Ideal Teaspoon",
        "Explore India's Finest Teas",
      ],
    },
  ];

  const teawareItems: ProductItem[] = [
    {
      id: "seidel-glass-mug",
      title: "Seidel Glass Mug with Infuser",
      image: "https://in.teabox.com/cdn/shop/files/Seidel_Glass_Tea_Mug_with_Infuser.jpg?v=1792663201&width=600",
      bullets: [
        "Double-Walled Borosilicate Glass",
        "Stainless Steel Infuser Included",
        "Keeps Tea Hot, Exterior Cool to Touch",
      ],
    },
    {
      id: "valencia-glass-teacup",
      title: "Valencia Glass Teacup",
      image: "https://in.teabox.com/cdn/shop/files/Valencia_Glass_Teacup.jpg?v=1792663152&width=600",
      bullets: [
        "Elegant Double-Walled Design",
        "Keeps Tea Hot, Cup Cool to Touch",
        "Ideal for Gifting or Everyday Use",
      ],
    },
    {
      id: "elegant-ball-infuser",
      title: "Elegant Ball Infuser",
      image: "https://in.teabox.com/cdn/shop/files/Elegant_Ball_Infuser.jpg?v=1792663176&width=600",
      bullets: [
        "Stainless Steel Mesh Ball",
        "Fits Most Cups & Teapots",
        "Easy to Clean, Reusable",
      ],
    },
  ];

  // 6. CUSTOMIZATION (Our Boxes, Your Story)
  const customizationCards = [
    {
      image: "https://assets.replocdn.com/projects/7711d8fe-fb35-45dc-9008-40f0c2da5c41/3d2bdc6d-f445-4185-b040-22d9ebd586c4",
      title: "LOGO ETCHING & PRINTING",
      desc: "Your company's mark, etched onto our packaging or the product itself alongside the Teabox mark.",
    },
    {
      image: "https://assets.replocdn.com/projects/7711d8fe-fb35-45dc-9008-40f0c2da5c41/f1a6e83d-3558-47bf-ae02-1f85c3507658",
      title: "CUSTOM PRINTS",
      desc: "Choose from our library of prints, or collaborate with us on something entirely your own.",
    },
    {
      image: "https://assets.replocdn.com/projects/7711d8fe-fb35-45dc-9008-40f0c2da5c41/7c870037-6b9a-4fec-8d4b-95d27175104a",
      title: "PERSONALISED INSERTS",
      desc: "Note cards, sleeves, and occasion-specific messages, the small details that make a gift feel considered.",
    },
    {
      image: "https://assets.replocdn.com/projects/7711d8fe-fb35-45dc-9008-40f0c2da5c41/697c95f8-bece-450e-99de-477ecb18d327",
      title: "GIFT WRAPPING",
      desc: "A range of wrapping styles and finishes from Ele Wrap to Balloon Silver to Boat Wrap to match the occasion.",
    },
  ];

  // 7. TESTIMONIALS (Creating Lasting Impressions)
  const testimonials = [
    {
      image: "https://assets.replocdn.com/projects/7711d8fe-fb35-45dc-9008-40f0c2da5c41/df2fe8f4-5890-401f-af1d-fc162b797166",
      name: "Tanya Pandit",
      badge: "Verified Buyer",
      quote:
        "We gifted the Vernal box to our entire team for Diwali. Coordinating 80+ boxes could've been a nightmare, but Teabox made it seamless and the feedback from the team was unanimous.",
    },
    {
      image: "https://assets.replocdn.com/projects/7711d8fe-fb35-45dc-9008-40f0c2da5c41/1b41195f-8326-494c-9d4b-58129f1e231b",
      name: "Rohan Kumar",
      badge: "Verified Buyer",
      quote:
        "Ordered the Samriddhi box for our top clients this year instead of the usual hamper. Every single person messaged back the packaging alone made it feel like we'd actually thought about the gift, not just ticked a box.",
    },
    {
      image: "https://assets.replocdn.com/projects/7711d8fe-fb35-45dc-9008-40f0c2da5c41/92b6be70-eace-4cbd-a569-9309d988ed26",
      name: "Anand Lama",
      badge: "Verified Buyer",
      quote:
        "Sent the Fleur gift box to a client visiting from Singapore. She later told me it was the most memorable gift she'd received from an Indian company simple, elegant, and clearly premium.",
    },
    {
      image: "https://assets.replocdn.com/projects/7711d8fe-fb35-45dc-9008-40f0c2da5c41/0074263a-7c6f-4e80-806f-34a3925baac4",
      name: "Ananya Biswas",
      badge: "Verified Buyer",
      quote:
        "Picked the Wellness Green Sampler for our employee wellness week gifts. Simple idea, but it landed better than any of the usual mugs-and-diaries combo we've done in the past.",
    },
  ];

  // 8. FAQS (8 items verbatim from live site)
  const faqs = [
    {
      q: "1. What is the minimum order quantity for corporate gifting?",
      a: "There are no strict minimums. We work with orders as small as 10 units for a personal team gesture, all the way up to bulk orders of thousands for company-wide gifting. Share your requirements, and we'll tailor a quote accordingly.",
    },
    {
      q: "2. Can I customise the gift box with our company logo or a personalised message?",
      a: "Yes. We offer branding on the outer packaging, screen printing your logo, custom inserts and tags, ribbons, sleeves of your design and even personalised notes to match your brand or occasion. Our gifting specialist will walk you through the options based on your budget and quantity.",
    },
    {
      q: "3. What occasions do you cater to?",
      a: "Diwali and festive gifting, year-end and New Year hampers, employee rewards and recognition, business milestones, client appreciation, new hire welcome kits, and wedding favours. We can also build something custom for any occasion you have in mind.",
    },
    {
      q: "4. What is the price range for corporate gift hampers?",
      a: "We have options across budgets, typically starting from 149 per unit and going up based on customisation, packaging, and tea selection. Let us know your budget and headcount, and we'll recommend the best fit.",
    },
    {
      q: "5. How do I place a corporate gifting order?",
      a: "Fill in the 'Tell us what you need' form above, or reach out via email or WhatsApp. A gifting specialist will get back to you with curated options and pricing.",
    },
    {
      q: "6. Can you deliver pan-India, including to multiple offices or addresses?",
      a: "Yes, we handle multi-location and bulk pan-India delivery, including split shipments to different offices or directly to employees' homes.",
    },
    {
      q: "7. What is the lead time for a corporate gifting order?",
      a: "Lead time depends on quantity and customisation. Standard hampers can ship within a few business days, while fully customised/branded orders need more lead time, especially during the festive season. We recommend reaching out at least 2–3 weeks in advance for large or highly customised orders.",
    },
    {
      q: "8. What payment methods are accepted?",
      a: "We accept online payments, bank transfers, and can raise invoices against a PO for registered businesses. Our gifting specialist can guide you on the process based on your company's procurement requirements.",
    },
  ];

  const currentProducts =
    activeTab === "gifts" ? diwaliGifts : activeTab === "trial" ? trialPacks : teawareItems;

  return (
    <SiteLayoutWrapper>
      <div className="w-full bg-white text-[#202020] font-sans antialiased">
        
        {/* ========================================================================= */}
        {/* ========================================================================= */}
        {/* 1. HERO SECTION (1st Section - Pixel-Perfect Live Site Match)             */}
        {/* ========================================================================= */}
        <section className="w-full relative flex flex-col items-center">
          {/* Full-width Responsive Banner with Live Animated Moving Dotted Frame */}
          <div className="w-full relative">
            <picture
              data-dw-frame=""
              tabIndex={0}
              role="link"
              className="w-full block relative cursor-pointer"
            >
              <source
                srcSet="https://assets.replocdn.com/projects/7711d8fe-fb35-45dc-9008-40f0c2da5c41/9679fab5-b0b7-4ba6-8808-a4adb8dc6de8?width=820"
                media="(max-width: 640px)"
              />
              <source
                srcSet="https://assets.replocdn.com/projects/7711d8fe-fb35-45dc-9008-40f0c2da5c41/32803fd2-2571-4e4a-ae3f-dfef6dd63ffd?width=1024"
                media="(min-width: 641px) and (max-width: 1024px)"
              />
              <source
                srcSet="https://assets.replocdn.com/projects/7711d8fe-fb35-45dc-9008-40f0c2da5c41/32803fd2-2571-4e4a-ae3f-dfef6dd63ffd?width=1800"
                media="(min-width: 1025px) and (max-width: 2400px)"
              />
              <img
                src="https://assets.replocdn.com/projects/7711d8fe-fb35-45dc-9008-40f0c2da5c41/32803fd2-2571-4e4a-ae3f-dfef6dd63ffd"
                alt="Corporate Gifting 2026"
                className="w-full h-auto object-cover block"
                loading="eager"
              />
            </picture>
          </div>

          {/* Under-Banner Content Box with Live Centered Seal Disc */}
          <div className="w-full relative z-[3] flex flex-col items-center justify-center text-center pt-[84px] max-sm:pt-[64px] pb-[48px] max-sm:pb-[24px] px-4">
            {/* Centered Circular Seal Badge */}
            <div className="absolute -top-[60px] max-sm:-top-[50px] left-1/2 -translate-x-1/2 w-[120px] max-sm:w-[100px] h-[120px] max-sm:h-[100px] bg-white rounded-full p-[10px] max-sm:p-[6px] shadow-sm z-10 flex items-center justify-center overflow-hidden">
              <picture className="w-full h-full flex items-center justify-center rounded-full overflow-hidden animate-float-subtle">
                <source
                  srcSet="https://assets.replocdn.com/projects/7711d8fe-fb35-45dc-9008-40f0c2da5c41/7071f66a-bf22-4015-b333-2bf9fe335383?width=820"
                  media="(max-width: 640px)"
                />
                <source
                  srcSet="https://assets.replocdn.com/projects/7711d8fe-fb35-45dc-9008-40f0c2da5c41/7071f66a-bf22-4015-b333-2bf9fe335383?width=1024"
                  media="(min-width: 641px) and (max-width: 1024px)"
                />
                <img
                  src="https://assets.replocdn.com/projects/7711d8fe-fb35-45dc-9008-40f0c2da5c41/7071f66a-bf22-4015-b333-2bf9fe335383"
                  alt="The Perfect Gifts For Every Occasion"
                  className="w-full h-full object-cover block rounded-full"
                  loading="eager"
                />
              </picture>
            </div>

            {/* Title, Subtitle and CTA Container */}
            <div className="flex flex-col items-center justify-center gap-3 max-w-[800px] text-center">
              {/* Headline: TeaboxStencilRegular, 42px desktop, 20px mobile */}
              <h1 className="font-stencil-reg text-[#202020] text-[42px] max-sm:text-[20px] leading-[44px] max-sm:leading-[24px] tracking-[1px] font-normal capitalize text-center">
                GIFTS WORTH TALKING ABOUT
              </h1>

              {/* Subtitle: Poppins 300, 20px desktop, 14px mobile */}
              <p className="text-[#5F5F5F] font-light text-[20px] max-sm:text-[14px] leading-[26px] max-sm:leading-[130%] text-center">
                A decade of delivering teas from the source has taught us the best gifts are the ones that carry a story. This season, give tea worth talking about.
              </p>

              {/* CTA Button with Live Sheen Animation */}
              <a
                href="#collection"
                tabIndex={0}
                className="alchemy-rte inline-flex items-center justify-center bg-[#E96951] hover:bg-[#d85841] text-white px-16 py-3 rounded-[4px] transition-colors cursor-pointer mt-3"
              >
                <span className="text-white text-[20px] leading-[20px] font-normal tracking-[0px]">
                  EXPLORE GIFTS
                </span>
              </a>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 2. STATS TICKER STRIP (Infinite Marquee Animation Gliding Seamlessly)      */}
        {/* ========================================================================= */}
        <section className="w-full bg-[#FAF6EE] py-3 border-y border-[#EDE6DB] overflow-hidden">
          <div className="relative w-full overflow-hidden flex">
            {/* Animated Marquee Double Track (40s linear matching live site) */}
            <div className="animate-marquee-infinite flex items-center gap-12 sm:gap-20 whitespace-nowrap">
              {[...stats, ...stats, ...stats, ...stats].map((s, idx) => (
                <div key={idx} className="flex items-center gap-3.5 flex-shrink-0">
                  <Image
                    src={s.icon}
                    alt={s.label}
                    width={28}
                    height={28}
                    unoptimized
                    className="w-6 h-6 sm:w-7 sm:h-7 object-contain"
                  />
                  <span className="text-[15px] sm:text-[16px] font-light text-[#202020] leading-[24px]">
                    {s.num} {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 3. GIFTS FOR EVERY BUDGET (With Rotating Golden Dotted Ring Animation!)    */}
        {/* ========================================================================= */}
        <section className="py-12 px-4 sm:px-6 max-w-[1200px] mx-auto">
          <div className="text-center max-w-[760px] mx-auto mb-8 sm:mb-10">
            <h2 className="font-stencil-reg text-[38px] sm:text-[42px] leading-[42px] sm:leading-[44px] text-[#202020] tracking-[1px] font-normal uppercase text-center">
              GIFTS FOR EVERY BUDGET
            </h2>
            <p className="text-[18px] sm:text-[20px] font-light leading-[24px] sm:leading-[26px] text-[#5F5F5F] text-center mt-2">
              Over 50 Lakh Hampers Delivered
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10">
            {budgetTiers.map((tier, idx) => (
              <div
                key={idx}
                onClick={() => handleBudgetClick(tier.budget)}
                className="group flex flex-col items-center cursor-pointer text-center"
              >
                {/* Rotating Dotted Gold Ring around Circular Image Container */}
                <div className="relative flex items-center justify-center w-[130px] h-[130px] sm:w-[160px] sm:h-[160px] lg:w-[185px] lg:h-[185px]">
                  {/* The Live Continuous Spinning Gold Dotted Ring */}
                  <div
                    className="budget-ring-spinner animate-ring-spin"
                    aria-hidden="true"
                  />

                  {/* Inner Solid Circle */}
                  <div className="relative w-full h-full rounded-full overflow-hidden shadow-sm group-hover:shadow-md transition-all duration-300 bg-white z-[2]">
                    <Image
                      src={tier.image}
                      alt={tier.budget}
                      fill
                      unoptimized
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                </div>

                <div className="mt-6 pb-1 border-b border-[#16301F]/50 group-hover:border-[#16301F] transition-colors">
                  <h3 className="text-[#16301F] text-[13px] font-normal tracking-[1.82px] uppercase">
                    {tier.budget}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 4. TRUSTED BY OVER 1500+ CLIENTS (Interactive Logo Carousel Slider)       */}
        {/* ========================================================================= */}
        <section className="py-12 bg-[#FAF6EE] border-t border-[#EBE3D7] relative overflow-hidden">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 mb-6 text-center">
            <h2 className="font-stencil-reg text-[38px] sm:text-[42px] leading-[42px] sm:leading-[44px] text-[#202020] tracking-[1px] font-normal uppercase text-center">
              TRUSTED BY OVER 1500+ CLIENTS
            </h2>
            <div className="text-[12px] text-[#8C8476] tracking-wider uppercase font-medium mt-2">
              Slide {clientIndex + 1} of {clientLogos.length}
            </div>
          </div>

          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 relative flex items-center">
            {/* Previous Slider Button */}
            <button
              onClick={prevClientSlide}
              aria-label="Previous client slide"
              className="absolute left-2 sm:left-4 z-20 w-9 h-9 rounded-full bg-white/90 shadow-md border border-[#E3DACD] hover:bg-[#FAF6EE] text-[#202020] flex items-center justify-center transition-all active:scale-95"
            >
              <ChevronLeft size={18} />
            </button>

            {/* Logo Carousel Viewport */}
            <div className="w-full overflow-hidden px-10 sm:px-14">
              <div
                className="flex items-center transition-transform duration-500 ease-in-out"
                style={{
                  transform: `translateX(-${(clientIndex * 100) / (typeof window !== "undefined" && window.innerWidth >= 1024 ? 5 : typeof window !== "undefined" && window.innerWidth >= 640 ? 3 : 2)}%)`,
                }}
              >
                {clientLogos.concat(clientLogos).map((logoUrl, i) => (
                  <div
                    key={i}
                    className="w-1/2 sm:w-1/3 lg:w-1/5 flex-shrink-0 flex items-center justify-center p-3 sm:p-4"
                  >
                    <div className="w-[120px] sm:w-[140px] h-[50px] sm:h-[60px] flex items-center justify-center">
                      <Image
                        src={logoUrl}
                        alt={`Client Logo ${i + 1}`}
                        width={140}
                        height={60}
                        unoptimized
                        className="max-h-full max-w-full object-contain filter grayscale hover:grayscale-0 transition-all duration-300"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Next Slider Button */}
            <button
              onClick={nextClientSlide}
              aria-label="Next client slide"
              className="absolute right-2 sm:right-4 z-20 w-9 h-9 rounded-full bg-white/90 shadow-md border border-[#E3DACD] hover:bg-[#FAF6EE] text-[#202020] flex items-center justify-center transition-all active:scale-95"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 5. WHY TEABOX? (5 Feature Pillars)                                        */}
        {/* ========================================================================= */}
        <section className="py-12 px-4 sm:px-6 max-w-[1200px] mx-auto border-t border-[#EBE3D7]">
          <div className="text-center max-w-[760px] mx-auto mb-8 sm:mb-10">
            <h2 className="font-stencil-reg text-[38px] sm:text-[42px] leading-[42px] sm:leading-[44px] text-[#202020] tracking-[1px] font-normal uppercase text-center">
              WHY TEABOX?
            </h2>
            <p className="text-[18px] sm:text-[20px] font-light leading-[24px] sm:leading-[26px] text-[#5F5F5F] text-center mt-2">
              A decade at the source, bringing India&apos;s finest teas to every occasion, every gift, every cup.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 sm:gap-6">
            {whyTeabox.map((item, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl p-5 border border-[#EBE3D7] hover:border-[#202020]/30 hover:shadow-sm transition-all duration-200 flex flex-col items-center text-center group"
              >
                <div className="w-14 h-14 rounded-full bg-[#FAF6EE] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Image
                    src={item.icon}
                    alt={item.title}
                    width={34}
                    height={34}
                    unoptimized
                    className="w-8 h-8 object-contain"
                  />
                </div>
                <h3 className="text-[13px] sm:text-[14px] font-bold text-[#202020] tracking-wider uppercase mb-1.5">
                  {item.title}
                </h3>
                <p className="text-[13px] text-[#5F5F5F] font-light leading-[19px]">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 6. OUR COLLECTION OF GIFTS (Horizontal Carousel Slider with Chevrons)     */}
        {/* ========================================================================= */}
        <section id="collection" className="py-12 bg-[#FAF6EE] border-t border-[#EBE3D7] relative">
          <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
            <div className="text-center max-w-[760px] mx-auto mb-6">
              <h2 className="font-stencil-reg text-[38px] sm:text-[42px] leading-[42px] sm:leading-[44px] text-[#202020] tracking-[1px] font-normal uppercase text-center">
                OUR COLLECTION OF GIFTS
              </h2>
            </div>

            {/* Underlined Tab List (Matching Live Replo Design) */}
            <div className="flex items-center justify-center gap-8 sm:gap-14 border-b border-[#DBDBDB] mb-8 sm:mb-10">
              <button
                onClick={() => {
                  setActiveTab("gifts");
                  if (productScrollRef.current) productScrollRef.current.scrollLeft = 0;
                }}
                className={`text-[14px] uppercase tracking-wide pb-2 transition-all duration-200 cursor-pointer ${
                  activeTab === "gifts"
                    ? "text-[#202020] font-medium border-b-2 border-[#202020]"
                    : "text-[#5F5F5F] font-light border-b-2 border-transparent hover:text-[#202020]"
                }`}
              >
                Gifts
              </button>
              <button
                onClick={() => {
                  setActiveTab("trial");
                  if (productScrollRef.current) productScrollRef.current.scrollLeft = 0;
                }}
                className={`text-[14px] uppercase tracking-wide pb-2 transition-all duration-200 cursor-pointer ${
                  activeTab === "trial"
                    ? "text-[#202020] font-medium border-b-2 border-[#202020]"
                    : "text-[#5F5F5F] font-light border-b-2 border-transparent hover:text-[#202020]"
                }`}
              >
                Trial Packs
              </button>
              <button
                onClick={() => {
                  setActiveTab("teaware");
                  if (productScrollRef.current) productScrollRef.current.scrollLeft = 0;
                }}
                className={`text-[14px] uppercase tracking-wide pb-2 transition-all duration-200 cursor-pointer ${
                  activeTab === "teaware"
                    ? "text-[#202020] font-medium border-b-2 border-[#202020]"
                    : "text-[#5F5F5F] font-light border-b-2 border-transparent hover:text-[#202020]"
                }`}
              >
                TEAWARE
              </button>
            </div>

            {/* Product Slider Container with Left & Right Arrow Buttons */}
            <div className="relative">
              {/* Left Arrow Button */}
              <button
                onClick={() => scrollProducts("left")}
                aria-label="Previous products"
                className="hidden md:flex absolute -left-4 lg:-left-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white shadow-lg border border-[#E3DACD] hover:bg-[#FAF6EE] text-[#202020] items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
              >
                <ChevronLeft size={22} />
              </button>

              {/* Horizontal Scroll Track */}
              <div
                ref={productScrollRef}
                className="flex items-stretch gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory no-scrollbar pb-4 pt-1 px-1"
              >
                {currentProducts.map((p) => (
                  <div
                    key={p.id}
                    className="w-[280px] sm:w-[300px] lg:w-[285px] flex-shrink-0 snap-start bg-white rounded-[4px] border border-[#E8E1D5] overflow-hidden flex flex-col justify-between hover:shadow-md transition-all duration-300 group"
                  >
                    {/* Square Image Box */}
                    <div className="relative w-full aspect-square bg-[#FAF7F2] overflow-hidden">
                      <Image
                        src={p.image}
                        alt={p.title}
                        fill
                        unoptimized
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />

                      {/* Authentic Coral DIWALI EDITION Ribbon */}
                      {p.badge ? (
                        <div className="absolute top-2.5 left-0 z-10 bg-[#E96951] text-white text-[11px] font-bold tracking-[1px] uppercase px-2.5 py-1 shadow-sm">
                          {p.badge}
                        </div>
                      ) : null}
                    </div>

                    {/* Content */}
                    <div className="p-5 flex flex-col flex-grow justify-between">
                      <div>
                        <h3 className="text-[#202020] text-[15px] sm:text-[16px] font-medium uppercase leading-[140%] mb-3">
                          {p.title}
                        </h3>
                        <ul className="space-y-1.5 mb-6">
                          {p.bullets.map((bullet, bIdx) => (
                            <li
                              key={bIdx}
                              className="text-[13px] sm:text-[14px] text-[#5F5F5F] font-light leading-[22px] flex items-start gap-1.5"
                            >
                              <span className="text-[#8C8476] mt-0.5">•</span>
                              <span>{bullet}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Accent Terracotta Button with Sheen */}
                      <button
                        onClick={() => handleSelectGift(p.title)}
                        className="alchemy-rte w-full py-2.5 px-6 rounded-[4px] bg-[#E96951] hover:bg-[#d85841] text-white text-[14px] font-normal tracking-wide uppercase transition-colors duration-200 active:scale-98 text-center cursor-pointer shadow-none"
                      >
                        Get a quote
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Right Arrow Button */}
              <button
                onClick={() => scrollProducts("right")}
                aria-label="Next products"
                className="hidden md:flex absolute -right-4 lg:-right-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white shadow-lg border border-[#E3DACD] hover:bg-[#FAF6EE] text-[#202020] items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
              >
                <ChevronRight size={22} />
              </button>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 7. OUR BOXES, YOUR STORY (4 Customization Features)                        */}
        {/* ========================================================================= */}
        <section className="py-12 px-4 sm:px-6 max-w-[1200px] mx-auto">
          <div className="text-center max-w-[760px] mx-auto mb-8 sm:mb-10">
            <h2 className="font-stencil-reg text-[38px] sm:text-[42px] leading-[42px] sm:leading-[44px] text-[#202020] tracking-[1px] font-normal uppercase text-center">
              OUR BOXES, YOUR STORY
            </h2>
            <p className="text-[18px] sm:text-[20px] font-light leading-[24px] sm:leading-[26px] text-[#5F5F5F] text-center mt-2">
              From co-branded packaging to personalised inserts, every detail can be shaped to tell your story.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {customizationCards.map((card, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl p-5 border border-[#EBE3D7] hover:border-[#202020]/30 hover:shadow-sm transition-all duration-300 flex flex-col items-center text-center group"
              >
                <div className="w-16 h-16 rounded-full bg-[#FAF6EE] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <Image
                    src={card.image}
                    alt={card.title}
                    width={44}
                    height={44}
                    unoptimized
                    className="w-10 h-10 object-contain"
                  />
                </div>
                <h3 className="text-[13px] sm:text-[14px] font-bold text-[#202020] tracking-wider uppercase mb-2">
                  {card.title}
                </h3>
                <p className="text-[13px] text-[#5F5F5F] font-light leading-[19px]">
                  {card.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 8. CREATING LASTING IMPRESSIONS (Authentic Live Testimonials Grid)         */}
        {/* ========================================================================= */}
        <section className="py-12 bg-[#FAF6EE] border-y border-[#16301F]/10">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
            <div className="text-center max-w-[760px] mx-auto mb-8 sm:mb-10">
              <h2 className="font-stencil-reg text-[38px] sm:text-[42px] leading-[42px] sm:leading-[44px] text-[#202020] tracking-[1px] font-normal uppercase text-center">
                CREATING LASTING IMPRESSIONS
              </h2>
              <p className="text-[18px] sm:text-[20px] font-light leading-[24px] sm:leading-[26px] text-[#5F5F5F] text-center mt-2">
                We were lucky to be a part of their special occasion and here’s what they had to say!
              </p>
            </div>

            {/* 2-Column Responsive Card Grid matching live site */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
              {testimonials.map((t, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-[11px] border border-[#E5DFD4] p-5 sm:p-6 flex flex-col justify-between shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:shadow-md transition-all duration-300"
                >
                  <div>
                    {/* 5 Stars in Terracotta Accent (#E96951) */}
                    <div className="flex items-center gap-1 text-[#E96951] mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} fill="#E96951" stroke="none" />
                      ))}
                    </div>

                    <p className="text-[14px] text-[#5F5F5F] leading-[22px] font-normal mb-5">
                      &ldquo;{t.quote}&rdquo;
                    </p>
                  </div>

                  {/* Author line with Verified Buyer badge */}
                  <div className="pt-3 border-t border-[#F0EBE1] flex items-center justify-between">
                    <div className="text-[14px] font-medium text-black">
                      {t.name}
                    </div>
                    <div className="text-[12px] font-normal text-[#5F5F5F] flex items-center gap-1">
                      <CheckCircle2 size={13} className="text-[#02CB5A]" />
                      <span>{t.badge}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 9. BEGIN YOUR GIFTING JOURNEY (Split Section & RFQ Form)                  */}
        {/* ========================================================================= */}
        <section id="inquiry" className="py-12 px-4 sm:px-6 max-w-[1200px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
            
            {/* Left Column: Direct Info */}
            <div className="lg:col-span-5 flex flex-col justify-between">
              <div>
                <h2 className="font-stencil-reg text-[36px] sm:text-[42px] leading-[40px] sm:leading-[46px] text-[#202020] uppercase mb-3">
                  BEGIN YOUR <br />
                  <span>GIFTING JOURNEY</span>
                </h2>
                <p className="text-[#5F5F5F] font-light text-[17px] sm:text-[18px] leading-[26px] mb-6">
                  Want to know more about Teabox&apos;s bulk gifting services?
                </p>

                {/* Contact details */}
                <div className="space-y-3 text-[15px] sm:text-[16px] text-[#5F5F5F] font-light">
                  <p>
                    <span>Give us a call: </span>
                    <a href="tel:+919733061444" className="text-[#202020] font-medium hover:text-[#E96951] transition-colors">
                      +91 97330 61444
                    </a>
                  </p>
                  <p>
                    <span>Email us at: </span>
                    <a
                      href="mailto:help.in@teabox.com"
                      className="text-[#202020] font-medium underline hover:text-[#E96951] transition-colors"
                    >
                      help.in@teabox.com
                    </a>
                  </p>
                </div>

                {/* WhatsApp Button */}
                <div className="mt-6">
                  <a
                    href="https://wa.me/919733061444"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="alchemy-rte inline-flex items-center gap-2.5 bg-[#E96951] hover:bg-[#d85841] text-white py-2.5 px-6 rounded-[4px] text-[14px] uppercase tracking-wide transition-all shadow-none cursor-pointer"
                  >
                    <Image
                      src="https://assets.replocdn.com/projects/7711d8fe-fb35-45dc-9008-40f0c2da5c41/d6abc0a7-1ea7-43c8-b120-cb85e829f049"
                      alt="WhatsApp"
                      width={18}
                      height={18}
                      unoptimized
                      className="w-4 h-4 object-contain brightness-0 invert"
                    />
                    <span>ENQUIRE ON WHATSAPP</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Quote Request Form */}
            <div className="lg:col-span-7 bg-[#FAF6EE] p-6 sm:p-8 rounded-xl border border-[#E5DFD4]">
              <h3 className="font-stencil-reg text-[22px] sm:text-[24px] text-[#202020] uppercase mb-1.5">
                Request a Custom Quote
              </h3>
              <p className="text-[14px] text-[#5F5F5F] font-light mb-5">
                Tell us about your occasion, headcount, and budget. Our gifting team will respond quickly.
              </p>

              {formSubmitted ? (
                <div className="p-6 rounded-xl bg-white border border-[#B3DFC2] text-center py-8">
                  <div className="w-12 h-12 rounded-full bg-[#E96951] text-white mx-auto flex items-center justify-center mb-3">
                    <Check size={24} />
                  </div>
                  <h4 className="font-stencil-reg text-[19px] text-[#202020] mb-2 uppercase">
                    Inquiry Received!
                  </h4>
                  <p className="text-[14px] text-[#5F5F5F] max-w-[420px] mx-auto mb-5">
                    Thank you, <strong className="text-[#202020]">{name}</strong>. Our corporate gifting specialist will get in touch with you at <strong className="text-[#202020]">{email}</strong> shortly.
                  </p>
                  <button
                    onClick={() => {
                      setFormSubmitted(false);
                      setName("");
                      setEmail("");
                      setPhone("");
                      setMessage("");
                    }}
                    className="px-6 py-2 rounded-[4px] bg-[#202020] text-white text-[13px] uppercase tracking-wider cursor-pointer"
                  >
                    Submit Another Request
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[12px] font-bold text-[#4A453F] uppercase tracking-wider mb-1">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Vikram Sharma"
                        className="w-full px-3.5 py-2 rounded-[4px] border border-[#D5CDBD] text-[14px] focus:outline-none focus:border-[#E96951] bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[12px] font-bold text-[#4A453F] uppercase tracking-wider mb-1">
                        Work Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="vikram@company.com"
                        className="w-full px-3.5 py-2 rounded-[4px] border border-[#D5CDBD] text-[14px] focus:outline-none focus:border-[#E96951] bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[12px] font-bold text-[#4A453F] uppercase tracking-wider mb-1">
                        Phone Number *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[14px] text-[#787268] font-medium">
                          +91
                        </span>
                        <input
                          type="tel"
                          required
                          maxLength={10}
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                          placeholder="9876543210"
                          className="w-full pl-11 pr-3.5 py-2 rounded-[4px] border border-[#D5CDBD] text-[14px] focus:outline-none focus:border-[#E96951] bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[12px] font-bold text-[#4A453F] uppercase tracking-wider mb-1">
                        Company Name
                      </label>
                      <input
                        type="text"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder="e.g. Acme Corp"
                        className="w-full px-3.5 py-2 rounded-[4px] border border-[#D5CDBD] text-[14px] focus:outline-none focus:border-[#E96951] bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[12px] font-bold text-[#4A453F] uppercase tracking-wider mb-1">
                        Estimated Quantity
                      </label>
                      <select
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-[4px] border border-[#D5CDBD] text-[14px] focus:outline-none focus:border-[#E96951] bg-white"
                      >
                        <option>10 - 50 units</option>
                        <option>50 - 200 units</option>
                        <option>200 - 500 units</option>
                        <option>500 - 1,000 units</option>
                        <option>1,000+ units</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[12px] font-bold text-[#4A453F] uppercase tracking-wider mb-1">
                        Budget per Gift
                      </label>
                      <select
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-[4px] border border-[#D5CDBD] text-[14px] focus:outline-none focus:border-[#E96951] bg-white"
                      >
                        <option>Under INR 1,000</option>
                        <option>Under INR 3,000</option>
                        <option>Under INR 5,000</option>
                        <option>Above INR 10,000</option>
                        <option>Flexible / Need Recommendation</option>
                      </select>
                    </div>
                  </div>

                  {selectedGift && (
                    <div className="p-2.5 rounded-[4px] bg-white border border-[#E0D8CB] flex items-center justify-between">
                      <div className="text-[13px] text-[#423E38]">
                        Selected Gift: <strong className="text-[#E96951]">{selectedGift}</strong>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedGift("")}
                        className="text-[12px] text-[#91897C] hover:text-[#202020] underline cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                  )}

                  <div>
                    <label className="block text-[12px] font-bold text-[#4A453F] uppercase tracking-wider mb-1">
                      Specific Requirements / Customization Needs
                    </label>
                    <textarea
                      rows={2}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Tell us about branding requirements (logo etching, sleeve, card), target delivery date..."
                      className="w-full px-3.5 py-2 rounded-[4px] border border-[#D5CDBD] text-[14px] focus:outline-none focus:border-[#E96951] bg-white"
                    />
                  </div>

                  <button
                    type="submit"
                    className="alchemy-rte w-full py-3 rounded-[4px] bg-[#E96951] hover:bg-[#d85841] text-white font-normal text-[15px] tracking-wider uppercase transition-all shadow-none cursor-pointer"
                  >
                    SUBMIT INQUIRY
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 10. FULL-WIDTH WHATSAPP BANNER (Authentic Live Background)                */}
        {/* ========================================================================= */}
        <section
          className="w-full py-12 px-4 bg-cover bg-center relative flex flex-col items-center justify-center text-center"
          style={{
            backgroundImage: `url("https://assets.replocdn.com/projects/7711d8fe-fb35-45dc-9008-40f0c2da5c41/a1c33bb9-0704-4af1-9cf9-719c82a5b8e6")`,
          }}
        >
          <div className="max-w-[560px] mx-auto flex flex-col items-center">
            <h2 className="font-stencil-reg text-[28px] sm:text-[36px] text-[#202020] uppercase tracking-[1px] mb-2">
              WANT TO GET IN TOUCH?
            </h2>
            <p className="text-[15px] sm:text-[16px] text-[#5F5F5F] font-light leading-[24px] mb-5">
              Have a question or need help? Reach out to us on WhatsApp. Our team is happy to help with your queries
            </p>
            <a
              href="https://wa.me/919733061444"
              target="_blank"
              rel="noopener noreferrer"
              className="alchemy-rte inline-flex items-center gap-2 bg-[#E96951] hover:bg-[#d85841] text-white py-2.5 px-8 rounded-[4px] text-[15px] font-normal uppercase tracking-wide transition-all shadow-none cursor-pointer"
            >
              <Image
                src="https://assets.replocdn.com/projects/7711d8fe-fb35-45dc-9008-40f0c2da5c41/d6abc0a7-1ea7-43c8-b120-cb85e829f049"
                alt="WhatsApp"
                width={18}
                height={18}
                unoptimized
                className="w-4 h-4 object-contain brightness-0 invert"
              />
              <span>ENQUIRE ON WHATSAPP</span>
            </a>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 11. YOU ASKED, WE ANSWERED (8 FAQs Matching Live Site)                    */}
        {/* ========================================================================= */}
        <section className="py-12 bg-white border-t border-[#EBE3D7]">
          <div className="max-w-[840px] mx-auto px-4 sm:px-6">
            <div className="text-center mb-8 sm:mb-10">
              <h2 className="font-stencil-reg text-[38px] sm:text-[42px] leading-[42px] sm:leading-[44px] text-[#202020] tracking-[1px] font-normal uppercase text-center">
                YOU ASKED, WE ANSWERED
              </h2>
            </div>

            <div className="space-y-0">
              {faqs.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={idx}
                    className="border-b border-[#DBDBDB] transition-all duration-200"
                  >
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full py-4 sm:py-5 flex items-center justify-between text-left gap-4 transition-colors cursor-pointer"
                    >
                      <span className="text-[16px] sm:text-[17px] font-medium text-[#202020]">
                        {faq.q}
                      </span>
                      <span className="text-[#5F5F5F] flex-shrink-0">
                        {isOpen ? <Minus size={18} /> : <Plus size={18} />}
                      </span>
                    </button>

                    {isOpen && (
                      <div className="pb-5 text-[14px] sm:text-[15px] text-[#5F5F5F] font-light leading-[24px]">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

      </div>
    </SiteLayoutWrapper>
  );
}
