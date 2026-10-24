import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Lightbulb } from "lucide-react";
import SiteLayoutWrapper from "@/components/SiteLayoutWrapper";
import { LEGAL } from "@/lib/legal";
import { Block, POSTS, formatPostDate, getPost } from "@/lib/blog";

export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const post = getPost((await params).slug);
  if (!post) return {};
  return {
    title: `${post.title} | ${LEGAL.brand}`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [post.image],
      type: "article",
    },
  };
}

function renderBlock(block: Block, key: number) {
  switch (block.type) {
    case "h2":
      return (
        <h2
          key={key}
          className="text-[21px] sm:text-[23px] font-bold text-[#1f3a2c] pt-4"
        >
          {block.text}
        </h2>
      );
    case "p":
      return <p key={key}>{block.text}</p>;
    case "ul":
      return (
        <ul key={key} className="list-disc pl-5 space-y-2">
          {block.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      );
    case "ol":
      return (
        <ol key={key} className="list-decimal pl-5 space-y-2">
          {block.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ol>
      );
    case "tip":
      return (
        <div
          key={key}
          className="flex gap-3 bg-[#f0fdf4] border border-[#bbe5c8] rounded-xl p-4 text-[15px] text-[#1f3a2c]"
        >
          <Lightbulb size={20} className="text-[#02a84a] shrink-0 mt-0.5" />
          <p>{block.text}</p>
        </div>
      );
    case "table":
      return (
        <div key={key} className="overflow-x-auto -mx-1">
          <table className="w-full text-[14.5px] border-collapse min-w-[460px]">
            <thead>
              <tr className="text-left border-b-2 border-[#1f3a2c]">
                {block.head.map((h) => (
                  <th
                    key={h}
                    className="py-2.5 pr-3 font-semibold text-[#1f3a2c]"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, i) => (
                <tr key={i} className="border-b border-[#f0ede6] align-top">
                  {row.map((cell, j) => (
                    <td
                      key={j}
                      className={`py-2.5 pr-3 ${j === 0 ? "font-semibold text-[#202020]" : ""}`}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
  }
}

type Params = Promise<{ slug: string }>;

// The site frame renders straight away; the article (which needs the URL slug) streams in
// behind a skeleton, so navigating to a post is instant.
export default function BlogPostPage({ params }: { params: Params }) {
  return (
    <SiteLayoutWrapper>
      <div className="bg-[#fafafa] text-[#202020]">
        <Suspense fallback={<ArticleSkeleton />}>
          <BlogArticle params={params} />
        </Suspense>
      </div>
    </SiteLayoutWrapper>
  );
}

function ArticleSkeleton() {
  return (
    <div
      className="max-w-[760px] mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-12 animate-pulse"
      aria-busy="true"
      aria-label="Loading article"
    >
      <div className="h-3 w-28 bg-[#e7e2d8] rounded" />
      <div className="h-9 w-4/5 bg-[#e7e2d8] rounded mt-5" />
      <div className="h-9 w-3/5 bg-[#e7e2d8] rounded mt-3" />
      <div className="aspect-[16/9] bg-[#ece8df] rounded-2xl mt-7" />
      <div className="space-y-3 mt-8">
        <div className="h-4 bg-[#e7e2d8] rounded" />
        <div className="h-4 bg-[#e7e2d8] rounded" />
        <div className="h-4 w-2/3 bg-[#e7e2d8] rounded" />
      </div>
    </div>
  );
}

async function BlogArticle({ params }: { params: Params }) {
  const post = getPost((await params).slug);
  if (!post) notFound();
  const more = POSTS.filter((p) => p.slug !== post.slug).slice(0, 3);

  return (
    <>
      <article className="max-w-[760px] mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-12">
        <nav
          aria-label="Breadcrumb"
          className="text-[13px] text-[#747576] mb-6"
        >
          <Link href="/" className="text-[#1f3a2c] hover:underline">
            Home
          </Link>{" "}
          ›{" "}
          <Link href="/blog" className="text-[#1f3a2c] hover:underline">
            Blog
          </Link>
        </nav>

        <div className="text-[12px] font-bold uppercase tracking-[1.5px] text-[#02a84a]">
          {post.category}
        </div>
        <h1 className="font-stencil text-[30px] sm:text-[40px] font-bold leading-tight text-[#202020] mt-2">
          {post.title}
        </h1>
        <div className="text-[13px] text-[#747576] mt-3">
          {formatPostDate(post.date)} · {post.readMinutes} min read
        </div>

        <div className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-[#f3f1ec] mt-7">
          <Image
            src={post.image}
            alt={post.imageAlt}
            fill
            sizes="(min-width: 768px) 760px, 100vw"
            className="object-cover"
            priority
          />
        </div>

        <div className="mt-8 space-y-5 text-[16.5px] leading-[1.8] text-[#3a3a36]">
          {post.body.map(renderBlock)}
        </div>

        <div className="mt-10 bg-[#1f3a2c] text-white rounded-2xl p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="font-bold text-[18px]">Ready to brew?</div>
            <div className="text-[14px] text-[#c9d6cd]">
              Fresh Indian teas, delivered to your door.
            </div>
          </div>
          <Link
            href="/collections/all"
            className="shrink-0 bg-[#02cb5a] hover:bg-[#02b851] text-[#1f3a2c] font-bold text-[14px] px-6 py-3 rounded-lg text-center transition-colors"
          >
            Shop teas
          </Link>
        </div>
      </article>

      <section className="border-t border-[#e7e2d8] bg-white">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-12">
          <h2 className="text-[20px] font-bold text-[#1f3a2c] mb-6">
            More from the blog
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {more.map((p) => (
              <Link key={p.slug} href={`/blog/${p.slug}`} className="group">
                <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-[#f3f1ec]">
                  <Image
                    src={p.image}
                    alt={p.imageAlt}
                    fill
                    sizes="(min-width: 1024px) 350px, (min-width: 640px) 50vw, 100vw"
                    className="object-cover"
                  />
                </div>
                <div className="text-[11.5px] font-bold uppercase tracking-[1.5px] text-[#02a84a] mt-3">
                  {p.category}
                </div>
                <div className="text-[16px] font-bold text-[#1f3a2c] mt-1 leading-snug group-hover:underline">
                  {p.title}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
