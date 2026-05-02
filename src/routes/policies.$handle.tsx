import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { getPolicyByHandle } from "@/lib/shopify";

export const Route = createFileRoute("/policies/$handle")({
  loader: async ({ params }) => {
    const policy = await getPolicyByHandle(params.handle);
    if (!policy) throw notFound();
    return { policy };
  },
  head: ({ loaderData }) => {
    const t = loaderData?.policy.title ?? "Policy";
    return {
      meta: [
        { title: `${t} | BLANQ` },
        { name: "description", content: `${t} — BLANQ.` },
        { property: "og:title", content: `${t} | BLANQ` },
      ],
    };
  },
  component: PolicyPage,
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-6 md:px-10 py-32 md:py-40 text-center">
      <p className="eyebrow mb-4">Not found</p>
      <h1 className="font-serif text-3xl text-ink">This policy is not available</h1>
      <Link to="/" className="mt-6 inline-block link-underline text-[11px] uppercase tracking-[0.22em]">
        Return home
      </Link>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-2xl px-6 md:px-10 py-32 md:py-40 text-center">
      <p className="eyebrow mb-4">Something went wrong</p>
      <p className="text-sm text-muted-foreground">{error.message}</p>
    </div>
  ),
});

function PolicyPage() {
  const { policy } = Route.useLoaderData();
  return (
    <article className="mx-auto max-w-3xl px-5 md:px-10 py-20 md:py-28">
      <p className="eyebrow mb-6">
        <Link to="/" className="link-underline">Home</Link>
        <span className="mx-2">/</span>
        <span>Policies</span>
      </p>
      <h1 className="font-serif text-4xl md:text-6xl leading-[1.05] tracking-tight text-ink">
        {policy.title}
      </h1>
      <div className="hairline my-10" />
      <div
        className="prose-blanq text-foreground/85 leading-[1.8] text-[15px] md:text-base [&_h2]:font-serif [&_h2]:text-2xl [&_h2]:md:text-3xl [&_h2]:text-ink [&_h2]:mt-12 [&_h2]:mb-4 [&_h3]:font-serif [&_h3]:text-xl [&_h3]:text-ink [&_h3]:mt-8 [&_h3]:mb-3 [&_p]:mb-5 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-5 [&_li]:mb-2 [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:opacity-70 [&_strong]:text-ink [&_table]:w-full [&_table]:my-6 [&_th]:text-left [&_th]:py-2 [&_th]:border-b [&_th]:border-border [&_td]:py-2 [&_td]:border-b [&_td]:border-border"
        dangerouslySetInnerHTML={{ __html: policy.body }}
      />
      <div className="mt-16 pt-8 border-t border-border">
        <Link to="/" className="link-underline text-[11px] uppercase tracking-[0.22em]">
          ← Return to BLANQ
        </Link>
      </div>
    </article>
  );
}
