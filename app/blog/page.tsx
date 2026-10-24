import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import SiteLayoutWrapper from "@/components/SiteLayoutWrapper";
import { LEGAL } from "@/lib/legal";
import { POSTS, formatPostDate } from "@/lib/blog";

export const metadata: Metadata = {
  title: `Blog: Tea Guides, Recipes & Brewing Tips | ${LEGAL.brand}`,
  description: "Learn about Indian teas, how to brew them, chai recipes and how to keep your tea fresh.",
};

export default function BlogIndexPage() {
  const [featured, ...rest] = POSTS;

  return (
    <SiteLayoutWrapper>
      <div className="bg-[#fafafa] text-[#202020]">
        <section className="bg-[#1f3a2c] text-white px-4 sm:px-6 py-12 sm:py-16">
          <div className="max-w-[1100px] mx-auto">
            <nav aria-label="Breadcrumb" className="text-[13px] text-[#a3c4b2] mb-4">
              <Link href="/" className="hover:underline">
                Home
              </Link>{" "}
              › <span className="text-white">Blog</span>
            </nav>
            <h1 className="font-stencil text-[32px] sm:text-[44px] font-bold leading-tight">The Tea Journal</h1>
            <p className="text-[15px] text-[#c9d6cd] mt-2 max-w-[560px]">
              Guides, recipes and brewing tips to help you get the best out of every cup.
            </p>
          </div>
        </section>

        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-10">
          <Link
            href={`/blog/${featured.slug}`}
            className="group grid md:grid-cols-2 bg-white border border-[#e7e2d8] rounded-2xl overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="relative aspect-[16/10] md:aspect-auto md:min-h-[320px] bg-[#f3f1ec]">
              <Image
                src={featured.image}
                alt={featured.imageAlt}
                fill
                sizes="(min-width: 768px) 550px, 100vw"
                className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
                priority
              />
            </div>
            <div className="p-6 sm:p-8 flex flex-col justify-center">
              <div className="text-[12px] font-bold uppercase tracking-[1.5px] text-[#02a84a]">{featured.category}</div>
              <h2 className="text-[22px] sm:text-[26px] font-bold text-[#1f3a2c] mt-2 leading-snug group-hover:underline">
                {featured.title}
              </h2>
              <p className="text-[14.5px] text-[#5c5a52] mt-3 leading-relaxed">{featured.excerpt}</p>
              <div className="text-[12.5px] text-[#747576] mt-4">
                {formatPostDate(featured.date)} · {featured.readMinutes} min read
              </div>
            </div>
          </Link>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group bg-white border border-[#e7e2d8] rounded-2xl overflow-hidden hover:shadow-lg transition-shadow flex flex-col"
              >
                <div className="relative aspect-[16/10] bg-[#f3f1ec]">
                  <Image
                    src={post.image}
                    alt={post.imageAlt}
                    fill
                    sizes="(min-width: 1024px) 350px, (min-width: 640px) 50vw, 100vw"
                    className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
                  />
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <div className="text-[11.5px] font-bold uppercase tracking-[1.5px] text-[#02a84a]">{post.category}</div>
                  <h2 className="text-[17px] font-bold text-[#1f3a2c] mt-1.5 leading-snug group-hover:underline">{post.title}</h2>
                  <p className="text-[13.5px] text-[#5c5a52] mt-2 leading-relaxed flex-1">{post.excerpt}</p>
                  <div className="text-[12px] text-[#747576] mt-4">
                    {formatPostDate(post.date)} · {post.readMinutes} min read
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </SiteLayoutWrapper>
  );
}
