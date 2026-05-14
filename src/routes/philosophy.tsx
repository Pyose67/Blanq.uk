import { createFileRoute, Link } from "@tanstack/react-router";
import fabricImg from "@/assets/fabric-merino.jpg";
import lifestyleImg from "@/assets/lifestyle-london.jpg";

export const Route = createFileRoute("/philosophy")({
  head: () => ({
    meta: [
      { title: "Philosophy — Blanq" },
      {
        name: "description",
        content:
          "On material, restraint, and the discipline of making fewer, better garments. The Blanq philosophy.",
      },
      { property: "og:title", content: "Philosophy — Blanq" },
      {
        property: "og:description",
        content: "On material, restraint, and the discipline of making fewer, better garments.",
      },
    ],
  }),
  component: PhilosophyPage,
});

function PhilosophyPage() {
  return (
    <>
      <section className="mx-auto max-w-[1480px] px-6 md:px-10 pt-24 md:pt-32 pb-20 md:pb-28">
        <p className="eyebrow mb-8 reveal-subtle">The Philosophy</p>
        <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl leading-[1.02] max-w-5xl tracking-tight reveal">
          Less, but considered absolutely.
        </h1>
      </section>

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
            <p className="md:col-span-3 eyebrow text-offwhite/60 md:sticky md:top-28 reveal-subtle">I — Material</p>
            <div className="md:col-span-8 md:col-start-5 space-y-8 reveal">
              <p className="font-serif text-2xl md:text-3xl leading-[1.4] text-offwhite">
                We begin with the fibre. Not the silhouette, not the season. The fibre.
              </p>
              <p className="text-offwhite/80 leading-[1.85] font-light">
                The behaviour of a garment is largely determined before it is cut. A poorly chosen
                fibre cannot be redeemed by tailoring; a well-chosen fibre demands very little
                intervention. We work, accordingly, with raw materials selected on a single criterion:
                that they perform beyond the requirements of the garment.
              </p>
              <p className="text-offwhite/80 leading-[1.85] font-light">
                In wool, this means 17.9-micron Australian Merino, classed and traded by station
                rather than commodity lot. In cotton, it means long-staple Pima, combed twice. In
                outerwear, it means a cashmere-wool blend woven on slow looms in the Biella valley,
                where the air is humid enough to keep the fibre supple during finishing.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1480px] px-6 md:px-10 py-24 md:py-32">
        <div className="grid md:grid-cols-12 gap-10 md:gap-16 items-start">
          <p className="md:col-span-3 eyebrow md:sticky md:top-28 reveal-subtle">II — Provenance</p>
          <div className="md:col-span-8 md:col-start-5 space-y-8 reveal">
            <p className="font-serif text-2xl md:text-3xl leading-[1.4] text-foreground">
              Global to global. We travel to the source.
            </p>
            <p className="text-foreground/80 leading-[1.85]">
              There is no logic in routing mediocre raw materials around the world in pursuit of
              cheap finishing. There is logic in identifying the finest version of a single material
              in its country of origin, and pairing it with the workshop best equipped to handle it
              — wherever that workshop is located.
            </p>
            <p className="text-foreground/80 leading-[1.85]">
              Our wool is grown in New South Wales and finished in Biella. Our cotton is grown in
              Peru and woven in Porto. Our tailoring is drafted in Naples. We work directly with
              each maker. There are no intermediaries between the house and the hand.
            </p>
          </div>
        </div>
      </section>

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
          <div className="grid md:grid-cols-12 gap-10">
            <p className="md:col-span-3 eyebrow text-offwhite/60 reveal-subtle">III — Restraint</p>
            <div className="md:col-span-8 md:col-start-5 space-y-8 reveal">
              <p className="font-serif text-3xl md:text-5xl leading-[1.2]">
                The discipline is in what we choose not to make.
              </p>
              <p className="text-offwhite/80 leading-[1.85] font-light">
                We release a small number of garments each year, and most of them remain in the
                catalogue indefinitely. There are no seasonal departures, no capsules, no campaigns
                engineered around urgency. A piece is added when it earns its place. It is removed
                only when a better version of it is found.
              </p>
              <p className="text-offwhite/80 leading-[1.85] font-light">
                This is, finally, what quiet luxury means to us. Not an aesthetic. A method.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1480px] px-6 md:px-10 py-32 text-center">
        <p className="eyebrow mb-6 reveal-subtle">Begin</p>
        <h2 className="font-serif text-4xl md:text-6xl leading-tight max-w-3xl mx-auto reveal">
          A wardrobe assembled slowly.
        </h2>
        <div className="mt-12 flex flex-wrap justify-center gap-10">
          <Link
            to="/collections/$series"
            params={{ series: "merino" }}
            className="text-[11px] uppercase tracking-[0.22em] border-b border-foreground pb-1"
          >
            The Merino Series
          </Link>
          <Link
            to="/collections/$series"
            params={{ series: "core" }}
            className="text-[11px] uppercase tracking-[0.22em] link-underline"
          >
            The Core Collection
          </Link>
        </div>
      </section>
    </>
  );
}
