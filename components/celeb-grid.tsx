"use client";

import { useState } from "react";

type Celeb = { name: string; title: string; img: string };

function CelebCard({ celeb }: { celeb: Celeb }) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="grid gap-sm">
      <button
        type="button"
        className="group block w-full overflow-hidden border border-border cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-fg"
        style={{ aspectRatio: "3/4" }}
        onClick={() => setRevealed((v) => !v)}
        aria-label={revealed ? `Hide colour — ${celeb.name}` : `Reveal colour — ${celeb.name}`}
      >
        <img
          src={celeb.img}
          alt={celeb.name}
          className={[
            "h-full w-full object-cover object-top transition-all duration-700",
            revealed ? "grayscale-0 scale-105" : "grayscale group-hover:grayscale-0 group-hover:scale-105",
          ].join(" ")}
          loading="lazy"
        />
      </button>
      <div>
        <p
          className="font-display uppercase text-fg"
          style={{ fontSize: "var(--title-sm-size)", letterSpacing: "var(--title-sm-tracking)" }}
        >
          {celeb.name}
        </p>
        <p
          className="font-mono uppercase text-muted-fg"
          style={{ fontSize: "var(--caption-size)", letterSpacing: "var(--caption-tracking)" }}
        >
          {celeb.title}
        </p>
      </div>
    </div>
  );
}

const CELEBS: Celeb[] = [
  {
    name: "Elissa",
    title: "Lebanese Pop Icon",
    img: "https://yehiaandzakaria.wordpress.com/wp-content/uploads/2012/05/yehia-and-zakaria-with-elissa.jpg",
  },
  {
    name: "Najwa Karam",
    title: "Queen of Arabic Music",
    img: "https://yehiaandzakaria.wordpress.com/wp-content/uploads/2011/07/260569_164428703623300_153413258058178_375154_4661680_n.jpg",
  },
  {
    name: "Yara",
    title: "Lebanese Singer & Artist",
    img: "https://yehiaandzakaria.wordpress.com/wp-content/uploads/2011/06/247594_159194700813367_153413258058178_347761_8365526_n.jpg",
  },
  {
    name: "Youssra",
    title: "Icon of Arab Cinema",
    img: "https://yehiaandzakaria.wordpress.com/wp-content/uploads/2011/07/259840_165043886895115_153413258058178_378663_3592992_n.jpg",
  },
];

export function CelebGrid() {
  return (
    <div className="grid grid-cols-2 gap-xs sm:gap-md lg:grid-cols-4">
      {CELEBS.map((celeb) => (
        <CelebCard key={celeb.name} celeb={celeb} />
      ))}
    </div>
  );
}
