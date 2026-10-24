import Link from "next/link";
import SiteLayoutWrapper from "@/components/SiteLayoutWrapper";
import { LEGAL } from "@/lib/legal";

export interface LegalSection {
  id: string;
  title: string;
  body: React.ReactNode;
}

/** Shared layout for the legal pages: title, contents list and numbered sections. */
export default function LegalPage({
  title,
  intro,
  sections,
}: {
  title: string;
  intro: React.ReactNode;
  sections: LegalSection[];
}) {
  return (
    <SiteLayoutWrapper>
      <div className="bg-[#fafafa] text-[#202020]">
        <section className="bg-[#1f3a2c] text-white px-4 sm:px-6 py-12 sm:py-16">
          <div className="max-w-[1100px] mx-auto">
            <nav aria-label="Breadcrumb" className="text-[13px] text-[#a3c4b2] mb-4">
              <Link href="/" className="hover:underline">
                Home
              </Link>{" "}
              › <span className="text-white">{title}</span>
            </nav>
            <h1 className="font-stencil text-[32px] sm:text-[44px] font-bold leading-tight">{title}</h1>
            <p className="text-[13.5px] text-[#a3c4b2] mt-2">Last updated: {LEGAL.lastUpdated}</p>
          </div>
        </section>

        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-10 sm:py-14 grid gap-10 lg:grid-cols-[240px_1fr]">
          <aside className="lg:sticky lg:top-24 self-start">
            <div className="text-[11.5px] font-bold uppercase tracking-[1.5px] text-[#747576] mb-3">On this page</div>
            <ol className="space-y-1.5 text-[13.5px]">
              {sections.map((s, i) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="text-[#1f3a2c] hover:text-[#02a84a] hover:underline">
                    {i + 1}. {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </aside>

          <article className="bg-white border border-[#e7e2d8] rounded-2xl p-6 sm:p-10 min-w-0">
            <div className="text-[15px] leading-[1.75] text-[#3a3a36] space-y-4 [&_a]:text-[#016c2f] [&_a]:underline">{intro}</div>
            {sections.map((s, i) => (
              <section key={s.id} id={s.id} className="scroll-mt-28 pt-8 mt-8 border-t border-[#f0ede6]">
                <h2 className="text-[19px] sm:text-[21px] font-bold text-[#1f3a2c] mb-3">
                  {i + 1}. {s.title}
                </h2>
                <div className="text-[15px] leading-[1.75] text-[#3a3a36] space-y-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_a]:text-[#016c2f] [&_a]:underline [&_strong]:text-[#202020]">
                  {s.body}
                </div>
              </section>
            ))}
          </article>
        </div>
      </div>
    </SiteLayoutWrapper>
  );
}
