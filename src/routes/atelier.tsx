import { createFileRoute, Link } from "@tanstack/react-router";
import fabricImg from "@/assets/fabric-merino.jpg";
import atelierImg from "@/assets/atelier-interior.jpg";
import provenanceImg from "@/assets/provenance-studio.jpg";
import lifestyleImg from "@/assets/lifestyle-london.jpg";
import productImg from "@/assets/product-coat.jpg";

export const Route = createFileRoute("/atelier")({
  head: () => ({
    meta: [
      { title: "The Atelier — Blanq" },
      {
        name: "description",
        content:
          "The care is in the parts no one sees. On how Blanq pieces are decided, made, and finished.",
      },
      { property: "og:title", content: "The Atelier — Blanq" },
      {
        property: "og:description",
        content: "The care is in the parts no one sees.",
      },
    ],
  }),
  component: AtelierPage,
});

function AtelierPage() {
  return (
    <>
      <section className="mx-auto max-w-[1480px] px-6 md:px-10 pt-24 md:pt-32 pb-20 md:pb-28">
        <p className="eyebrow mb-8 reveal-subtle">The Atelier</p>
        <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl leading-[1.02] max-w-5xl tracking-tight reveal">
          The care is in the parts no one sees.
        </h1>
        <p className="mt-10 text-muted-foreground leading-[1.85] max-w-2xl font-light reveal">
          A garment can be judged in a shop in a matter of seconds. It can only be{" "}
          <em>made</em> well over a far longer time — in places a customer will never visit,
          through choices a customer will never see. Blanq is built around those choices, because
          they are the only thing that separates a piece that is good from one that merely looks
          good on the day it is bought.
        </p>
      </section>

      {/* I — THE DECISION */}
      <section className="bg-charcoal text-offwhite py-32 md:py-44 relative overflow-hidden">
        <img
          src={atelierImg}
          alt=""
          loading="lazy"
          width={1920}
          height={1080}
          className="absolute inset-0 h-full w-full object-cover opacity-[0.18]"
        />
        <div className="relative mx-auto max-w-[1480px] px-6 md:px-10">
          <div className="grid md:grid-cols-12 gap-10 md:gap-16 items-start">
            <p className="md:col-span-3 eyebrow text-offwhite/60 md:sticky md:top-28 reveal-subtle">I — The Decision</p>
            <div className="md:col-span-8 md:col-start-5 space-y-8 reveal">
              <p className="font-serif text-2xl md:text-3xl leading-[1.4] text-offwhite">
                Most of our work is deciding what not to make.
              </p>
              <p className="text-offwhite/80 leading-[1.85] font-light">
                A piece enters production only when three things agree: the material is right, the
                workshop is right, and the reason for it to exist is honest. If one of them is
                missing, the piece is not made — however strong the idea, however well it might
                sell.
              </p>
              <p className="text-offwhite/80 leading-[1.85] font-light">
                We hold back far more than we release. That restraint is where quality begins, long
                before anything is cut.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* II — THE YARN */}
      <section className="bg-charcoal text-offwhite py-32 md:py-44 relative overflow-hidden">
        <img
          src={fabricImg}
          alt=""
          loading="lazy"
          width={1920}
          height={1080}
          className="absolute inset-0 h-full w-full object-cover opacity-20"
        />
        <div className="relative mx-auto max-w-[1480px] px-6 md:px-10">
          <div className="grid md:grid-cols-12 gap-10 md:gap-16 items-start">
            <p className="md:col-span-3 eyebrow text-offwhite/60 md:sticky md:top-28 reveal-subtle">II — The Yarn</p>
            <div className="md:col-span-8 md:col-start-5 space-y-8 reveal">
              <p className="font-serif text-2xl md:text-3xl leading-[1.4] text-offwhite">
                Good cloth is decided long before the loom.
              </p>
              <p className="text-offwhite/80 leading-[1.85] font-light">
                Before a single piece takes shape, the fibre is prepared with a patience modern
                production rarely permits — combed, and combed again, then turned into yarn slowly.
                Haste frays a yarn early; patience is what allows a piece to survive its fiftieth
                wear as gracefully as its first.
              </p>
              <p className="text-offwhite/80 leading-[1.85] font-light">
                None of this can be seen at the moment of purchase. By the second winter, it is
                the whole story.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* III — THE HAND */}
      <section className="bg-charcoal text-offwhite py-32 md:py-44 relative overflow-hidden">
        <img
          src={provenanceImg}
          alt=""
          loading="lazy"
          width={1920}
          height={1080}
          className="absolute inset-0 h-full w-full object-cover opacity-[0.15]"
        />
        <div className="relative mx-auto max-w-[1480px] px-6 md:px-10">
          <div className="grid md:grid-cols-12 gap-10 md:gap-16 items-start">
            <p className="md:col-span-3 eyebrow text-offwhite/60 md:sticky md:top-28 reveal-subtle">III — The Hand</p>
            <div className="md:col-span-8 md:col-start-5 space-y-8 reveal">
              <p className="font-serif text-2xl md:text-3xl leading-[1.4] text-offwhite">
                A machine can assemble a garment. Only a practised hand can make one well.
              </p>
              <p className="text-offwhite/80 leading-[1.85] font-light">
                Our pieces are built in a small number of workshops we return to, season after
                season, by people who have made the same things for years. We do not move to
                cheaper hands each season, because skill of this kind cannot be written into a
                spreadsheet.
              </p>
              <p className="text-offwhite/80 leading-[1.85] font-light">
                It lives in those who have done the work a thousand times, and who recognise a
                wrong shoulder before any measure does.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* IV — THE FINISH */}
      <section className="bg-charcoal text-offwhite py-32 md:py-44 relative overflow-hidden">
        <img
          src={lifestyleImg}
          alt=""
          loading="lazy"
          width={1920}
          height={1080}
          className="absolute inset-0 h-full w-full object-cover opacity-20"
        />
        <div className="relative mx-auto max-w-[1480px] px-6 md:px-10">
          <div className="grid md:grid-cols-12 gap-10 md:gap-16 items-start">
            <p className="md:col-span-3 eyebrow text-offwhite/60 md:sticky md:top-28 reveal-subtle">IV — The Finish</p>
            <div className="md:col-span-8 md:col-start-5 space-y-8 reveal">
              <p className="font-serif text-2xl md:text-3xl leading-[1.4] text-offwhite">
                How a garment ages is decided in its final hours.
              </p>
              <p className="text-offwhite/80 leading-[1.85] font-light">
                Finishing is where corners are most quietly cut, precisely because the buyer cannot
                see it at the point of sale — only later, when a piece holds its shape or slowly
                surrenders it. We treat it as the most demanding stage of all.
              </p>
              <p className="text-offwhite/80 leading-[1.85] font-light">
                Our cashmere is finished in humid air, so the fibre stays supple; everything we
                make is pressed and allowed to settle slowly, so that what reaches you has already
                become what it will be.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* V — THE REFUSAL */}
      <section className="bg-charcoal text-offwhite py-32 md:py-44 relative overflow-hidden">
        <img
          src={productImg}
          alt=""
          loading="lazy"
          width={1920}
          height={1080}
          className="absolute inset-0 h-full w-full object-cover opacity-[0.12]"
        />
        <div className="relative mx-auto max-w-[1480px] px-6 md:px-10">
          <div className="grid md:grid-cols-12 gap-10 md:gap-16 items-start">
            <p className="md:col-span-3 eyebrow text-offwhite/60 md:sticky md:top-28 reveal-subtle">V — The Refusal</p>
            <div className="md:col-span-8 md:col-start-5 space-y-8 reveal">
              <p className="font-serif text-2xl md:text-3xl leading-[1.4] text-offwhite">
                The final question is the simplest one we ask. Is it good enough to carry the name?
              </p>
              <p className="text-offwhite/80 leading-[1.85] font-light">
                Nothing leaves until that question has an honest answer. What falls short is not
                discounted, relabelled, or quietly let through — it is held back. We would rather
                have less to offer than put forward something we cannot stand behind.
              </p>
              <p className="text-offwhite/80 leading-[1.85] font-light">
                This, in the end, is the only definition of luxury we accept: not the willingness
                to add, but the willingness to refuse.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-[1480px] px-6 md:px-10 py-32 text-center">
        <p className="eyebrow mb-6 reveal-subtle">The Catalogue</p>
        <h2 className="font-serif text-4xl md:text-6xl leading-tight max-w-3xl mx-auto reveal">
          Pieces made this way.
        </h2>
        <div className="mt-12 flex flex-wrap justify-center gap-10">
          <Link
            to="/collections"
            className="text-[11px] uppercase tracking-[0.22em] border-b border-foreground pb-1"
          >
            Explore the Collection
          </Link>
        </div>
      </section>
    </>
  );
}
