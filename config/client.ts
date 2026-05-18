export type ClientVocabulary = {
  singular: string;
  plural: string;
};

export type ClientConfig = {
  brand: {
    name: string;
    shortName: string;
    tagline: string;
    domain: string;
    logoUrl: string;
    ogImage: string;
  };
  vocabulary: {
    staff: ClientVocabulary;
    service: ClientVocabulary;
    location: ClientVocabulary;
    customer: ClientVocabulary;
  };
  contact: {
    whatsapp: string;
    instagram: string;
    email: string;
    supportPhone: string;
  };
  business: {
    defaultTimezone: string;
    currency: string;
    currencySymbol: string;
    bookingWindowDays: number;
    slotGranularityMin: number;
    cancellationWindowHours: number;
  };
  features: {
    multiLocation: boolean;
    deposits: boolean;
    loyalty: boolean;
    emailConfirmations: boolean;
    whatsappConfirmations: boolean;
    reviewsSection: boolean;
  };
  presentation: {
    locationOrder: string[];
  };
  copy: {
    hero: {
      eyebrow: string;
      title: string;
      body: string;
      primaryCtaLabel: string;
      primaryCtaHref: string;
      secondaryNote: string;
    };
    philosophy: {
      eyebrow: string;
      title: string;
      paragraphs: string[];
    };
    services: {
      eyebrow: string;
      title: string;
      intro: string;
      consultationLabel: string;
    };
    salons: {
      eyebrow: string;
      title: string;
      intro: string;
      appointmentLine: string;
    };
    howItWorks: {
      eyebrow: string;
      title: string;
      steps: Array<{
        title: string;
        body: string;
      }>;
    };
    faq: {
      eyebrow: string;
      title: string;
      items: Array<{
        question: string;
        answer: string;
      }>;
    };
    footerNote: string;
  };
  theme: {
    tokensFile: string;
    colorTokens: {
      background: string;
      foreground: string;
      border: string;
      accent: string;
      card: string;
    };
    fontTokens: {
      display: string;
      body: string;
      mono: string;
    };
    radiusTokens: {
      base: string;
      cta: string;
    };
  };
};

export const clientConfig = {
  brand: {
    name: "Yehia & Zakaria",
    shortName: "Y & Z",
    tagline: "A Lebanese house of hair, since 1998.",
    domain: "yehiazakaria.com",
    logoUrl: "/logo.svg",
    ogImage: "/og.jpg",
  },
  vocabulary: {
    staff: { singular: "stylist", plural: "stylists" },
    service: { singular: "service", plural: "services" },
    location: { singular: "salon", plural: "salons" },
    customer: { singular: "client", plural: "clients" },
  },
  contact: {
    whatsapp: "96170000000",
    instagram: "@yehiaandzakaria",
    email: "concierge@yehiazakaria.com",
    supportPhone: "+961 1 XXX XXX",
  },
  business: {
    defaultTimezone: "Asia/Beirut",
    currency: "USD",
    currencySymbol: "$",
    bookingWindowDays: 21,
    slotGranularityMin: 15,
    cancellationWindowHours: 4,
  },
  features: {
    multiLocation: true,
    deposits: false,
    loyalty: false,
    emailConfirmations: true,
    whatsappConfirmations: true,
    reviewsSection: true,
  },
  presentation: {
    locationOrder: ["verdun", "achrafieh", "kaslik"],
  },
  copy: {
    hero: {
      eyebrow: "Beirut · Since 1998",
      title: "WHERE THE ARAB WORLD COMES TO BE SEEN.",
      body: "Two brothers. Twenty-five years. A house that has shaped the hair of Lebanon's most considered women — from the private rooms of Verdun to the stages of the Arab world's most celebrated occasions.",
      primaryCtaLabel: "Reserve your chair",
      primaryCtaHref: "/book",
      secondaryNote: "Colour correction and certain major appointments begin with a consultation. The time spent upfront is returned in the result.",
    },
    philosophy: {
      eyebrow: "The house · Est. 1998",
      title: "Two brothers. One standard.",
      paragraphs: [
        "Yehia and Zakaria opened their first salon in Verdun in 1998, at a time when Beirut was reclaiming its place as the region's most style-conscious city. Their reputation built itself through the work — not through advertising.",
        "Over twenty-five years, the salon became the address behind some of the Arab world's most photographed hairstyles. The clients are discerning. The techniques are innovative. The result, always, is hair that holds its line well beyond the appointment.",
        "The standard is the same at every address: nothing hurried, nothing overstated. Elegance that carries through the day — from the salon chair into whatever occasion the evening demands.",
      ],
    },
    services: {
      eyebrow: "The menu",
      title: "Services shaped with time in mind.",
      intro: "The menu moves between polished essentials and longer sitting appointments — from a gentleman's shave to bridal ceremony hair. Durations and prices shown with clarity, so the rhythm of the visit is understood before you arrive.",
      consultationLabel: "Consultation required",
    },
    salons: {
      eyebrow: "The addresses",
      title: "Three salons. One manner of service.",
      intro: "Verdun remains the original address. Achrafieh and Kaslik followed as the clientele spread. Each salon keeps the same welcome, the same finish, and the same discretion. Choose the address that best suits the day.",
      appointmentLine: "By appointment · Monday to Saturday · 09:00–20:00",
    },
    howItWorks: {
      eyebrow: "Reservations",
      title: "A booking, in three measured steps.",
      steps: [
        {
          title: "Choose your salon",
          body: "Begin with the address that suits the day — Verdun, Achrafieh, or Kaslik.",
        },
        {
          title: "Select service and stylist",
          body: "Browse the house menu, then continue with the stylist whose practice suits the appointment.",
        },
        {
          title: "Confirm your time",
          body: "Complete the reservation with your details and receive a reference kept ready for any follow-up or change.",
        },
      ],
    },
    faq: {
      eyebrow: "Questions",
      title: "What clients usually ask before reserving.",
      items: [
        {
          question: "How far in advance may I reserve",
          answer: "Appointments open 21 days ahead — a window suited to clients who plan around work, travel, and occasion dressing.",
        },
        {
          question: "May I cancel if plans shift",
          answer: "Yes. Reservations may be cancelled up to four hours before the appointment time. The reference code issued at booking handles the change.",
        },
        {
          question: "Do colour services always require consultation",
          answer: "Colour correction is the exception — it is flagged for a brief consultation before the appointment is treated as final. All other colour services proceed directly.",
        },
        {
          question: "Will I receive confirmation",
          answer: "Yes. A booking reference is issued immediately. Email and WhatsApp confirmation follow, with everything needed for lookup or cancellation.",
        },
        {
          question: "Is walk-in possible",
          answer: "Walk-ins are welcomed when the schedule allows. A reservation keeps the hour, the stylist, and the service in order before you arrive — and is always the wiser approach.",
        },
      ],
    },
    footerNote:
      "A Lebanese house of hair since 1998. Three addresses across Beirut and Jounieh. One standard of service.",
  },
  theme: {
    tokensFile: "/design/colors_and_type.css",
    colorTokens: {
      background: "--bg",
      foreground: "--fg",
      border: "--border",
      accent: "--accent",
      card: "--card",
    },
    fontTokens: {
      display: "--font-display",
      body: "--font-body",
      mono: "--font-mono",
    },
    radiusTokens: {
      base: "--radius-none",
      cta: "--radius-pill",
    },
  },
} satisfies ClientConfig;

export type ClientFaqItem = ClientConfig["copy"]["faq"]["items"][number];
export type ClientHowItWorksStep = ClientConfig["copy"]["howItWorks"]["steps"][number];
