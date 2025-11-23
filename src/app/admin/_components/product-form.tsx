"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import type {
  AboutPageContent,
  HomepageSection,
  SocialLink,
  Settings,
  PDPSettings,
  ProductType,
  ShippingSettings,
  FooterSettings,
  FAQItem,
  Promotion,
} from "@/lib/types";

const SETTINGS_KEY = "appSettings";

const initialStoreDetails = { name: "FluteStore", logo: null as string | null };
const initialSocialLinks: SocialLink[] = [
  { id: 1, platform: "facebook", href: "https://facebook.com" },
  { id: 2, platform: "instagram", href: "https://instagram.com" },
  { id: 3, platform: "twitter", href: "https://twitter.com" },
];
const initialHomepageSections: HomepageSection[] = [
  {
    id: "hero-default",
    type: "hero",
    title: "G Natural Base Bansuri",
    visible: true,
    data: {
      productIds: ["flute-g-natural-base"],
      promotions: [] as Promotion[],
    },
  },
  {
    id: "featured-default",
    type: "featuredProducts",
    title: "Featured Flutes",
    visible: true,
    data: {
      productIds: [
        "flute-c-natural-medium",
        "flute-g-natural-base",
        "flute-a-natural-base",
        "flute-e-natural-base",
      ],
    },
  },
  {
    id: "categories-default",
    type: "categories",
    title: "Shop by Category",
    visible: true,
    data: {
      cards: [
        {
          id: "cat-card-1",
          title: "Beginner",
          href: "/products?type=Beginner",
          imageId: "flute-5",
        },
        {
          id: "cat-card-2",
          title: "Intermediate",
          href: "/products?type=Intermediate",
          imageId: "flute-7",
        },
        {
          id: "cat-card-3",
          title: "Professional",
          href: "/products?type=Professional",
          imageId: "category-concert",
        },
        {
          id: "cat-card-4",
          title: "Bass Flutes",
          href: "/products?scale=G",
          imageId: "category-bass",
        },
      ],
    },
  },
  {
    id: "new-arrivals-default",
    type: "newArrivals",
    title: "New Arrivals",
    visible: true,
    data: {
      productIds: [
        "flute-d-natural-medium-new",
        "flute-c-sharp-medium",
        "flute-f-natural-medium",
        "flute-a-natural-medium",
      ],
    },
  },
  {
    id: "accessories-default",
    type: "accessories",
    title: "Accessories",
    visible: true,
    data: {
      productIds: [
        "accessory-case-1",
        "accessory-bag-1",
        "accessory-cleaning-1",
      ],
    },
  },
  {
    id: "testimonials-1721067575306",
    type: "testimonials",
    title: "What Our Customers Say",
    visible: true,
    data: {
      testimonials: [
        {
          id: 1,
          name: "Priya S.",
          location: "Mumbai, India",
          comment:
            "The C Natural Medium flute I bought is simply divine. The tone is rich and the craftsmanship is impeccable. It has become an extension of my musical soul.",
          imageUrl:
            "https://images.unsplash.com/photo-1604537466549-0e8b15e25841?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw1fHxpbmRpYW4lMjB3b21hbnxlbnwwfHx8fDE3MjEwNjY1OTR8MA&ixlib=rb-4.0.3&q=80&w=1080",
          imageHint: "indian woman",
        },
        {
          id: 2,
          name: "Rohan J.",
          location: "Bangalore, India",
          comment:
            "As a professional musician, I'm very particular about my instruments. The bass flute from FluteStore exceeded all my expectations. The resonance is deep and moving.",
          imageUrl:
            "https://images.unsplash.com/photo-1613233349141-516135676a20?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw0fHxpbmRpYW4lMjBtYW58ZW58MHx8fHwxNzIxMDY2NjE3fDA&ixlib=rb-4.0.3&q=80&w=1080",
          imageHint: "indian man",
        },
      ],
    },
  },
];
const initialAboutContent: AboutPageContent = {
  title: "About FluteStore",
  aboutText:
    "Welcome to our store! We are passionate about providing the highest quality instruments to musicians around the world. Our journey began in...",
  aboutImageId: "flute-8",
  teamMembers: [
    {
      id: 1,
      name: "Shekhar Sharma",
      role: "Founder & Master Artisan",
      imageId: "user-2",
      bio: "With over 40 years of experience, Shekhar is the heart and soul of our workshop.",
    },
    {
      id: 2,
      name: "Priya Mehta",
      role: "Customer Relations",
      imageId: "user-1",
      bio: "Priya ensures every musician finds their perfect flute and receives the best possible service.",
    },
    {
      id: 3,
      name: "Rohan Joshi",
      role: "Lead Craftsman",
      imageId: "user-4",
      bio: "Rohan combines traditional techniques with modern precision to craft our signature flutes.",
    },
  ],
  contactInfo: [
    {
      id: 1,
      type: "email",
      title: "Email Support",
      description: "For any inquiries",
      value: "support@flutestore.com",
      href: "mailto:support@flutestore.com",
    },
    {
      id: 2,
      type: "phone",
      title: "Phone Support",
      description: "Mon-Fri, 9am-5pm IST",
      value: "+91 98765 43210",
      href: "tel:+919876543210",
    },
    {
      id: 3,
      type: "address",
      title: "Our Workshop",
      description: "Visit us by appointment",
      value: "123 Flute Lane, Music City, India",
    },
  ],
};
const initialFaq: FAQItem[] = [
  {
    id: 1,
    question: "Which flute is best for beginners?",
    answer:
      "For beginners, we recommend a C Natural Medium flute. It's the standard size, easy to handle, and perfect for learning the basics of fingering and breath control.",
  },
  {
    id: 2,
    question: "What is the difference between a bass and medium flute?",
    answer:
      "A bass flute (Bansuri) is longer, has a deeper, more mellow tone, and requires more breath. A medium flute is smaller, has a higher pitch, and is generally easier for beginners to play.",
  },
  {
    id: 3,
    question: "How do I care for my bamboo flute?",
    answer:
      "Keep your flute away from extreme temperatures and direct sunlight. Oil it occasionally (once a month) with mustard oil to prevent cracks. Always wipe it clean after playing.",
  },
];
const initialPDPSettings: PDPSettings = {
  productTypes: [
    { id: "flute", name: "Flute" },
    { id: "accessory", name: "Accessory" },
  ],
  customizations: [
    {
      id: "string-colors",
      label: "Manage String Colors",
      type: "multiple-color-select",
      count: 3,
      colors: [
        { id: "black", value: "black", label: "Black" },
        { id: "maroon", value: "maroon", label: "Maroon" },
        { id: "red_yellow", value: "red_yellow", label: "Red & Yellow" },
      ],
    },
    {
      id: "case",
      label: "Get it with a case?",
      type: "radio",
      options: [
        { value: "without-case", label: "Without Case" },
        { value: "with-case", label: "With Hard Case", price_change: 500 },
      ],
      default_value: "without-case",
      productTypes: ["flute"],
    },
    {
      id: "style",
      label: "Need a left handed flute? (South Indian Style)",
      type: "checkbox",
      default_value: false,
      productTypes: ["flute"],
    },
    {
      id: "engraving",
      label: "Want your name engraved on the flute?",
      type: "text",
      default_value: "",
      productTypes: ["flute"],
    },
    {
      id: "note",
      label: "Add a note for us",
      type: "textarea",
      default_value: "",
      productTypes: ["flute", "accessory"],
    },
  ],
};
const initialShippingSettings: ShippingSettings = {
  defaultRate: 150,
  freeShippingThreshold: 2000,
};
const initialFooterSettings: FooterSettings = {
  description:
    "Crafting and curating the world's finest flutes since 1982. Join our community and find your perfect sound.",
  columns: [
    {
      id: "shop",
      title: "Shop",
      links: [
        { href: "/products", label: "All Flutes" },
        { href: "/products?type=Beginner", label: "Beginner" },
        { href: "/products?type=Intermediate", label: "Intermediate" },
        { href: "/products?type=Professional", label: "Professional" },
      ],
    },
    {
      id: "support",
      title: "Support",
      links: [
        { href: "/about#contact", label: "Contact Us" },
        { href: "/faq", label: "FAQ" },
        { href: "#", label: "Shipping & Returns" },
        { href: "/account/orders", label: "Track Order" },
      ],
    },
    {
      id: "company",
      title: "Company",
      links: [
        { href: "/about", label: "About Us" },
        { href: "#", label: "Our Story" },
        { href: "#", label: "Blog" },
        { href: "#", label: "Careers" },
      ],
    },
  ],
};

const initialSettings: Settings = {
  storeDetails: initialStoreDetails,
  socialLinks: initialSocialLinks,
  homepageSections: initialHomepageSections,
  aboutContent: initialAboutContent,
  faq: initialFaq,
  pdpSettings: initialPDPSettings,
  shippingSettings: initialShippingSettings,
  footerSettings: initialFooterSettings,
};

interface SettingsContextType extends Settings {
  saveSettings: (newSettings: Partial<Settings>) => Promise<void>;
  isLoading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
);

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}

async function getSettings(supabase: any): Promise<Settings> {
  const { data, error } = await supabase
    .from("store_settings")
    .select("value")
    .eq("key", SETTINGS_KEY)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 means no rows found
    console.error(`Error fetching settings:`, error);
    return initialSettings; // Fallback
  }

  if (!data || !data.value) {
    // If no settings exist, create them with the initial settings
    const { error: insertError } = await supabase
      .from("store_settings")
      .insert({ key: SETTINGS_KEY, value: initialSettings });

    if (insertError) {
      console.error("Failed to insert initial settings:", insertError);
      return initialSettings;
    }
    return initialSettings;
  }

  // Merge fetched settings with initial settings to ensure all keys are present
  const fetchedSettings = data.value;
  const mergedSettings: Settings = {
    storeDetails: {
      ...initialSettings.storeDetails,
      ...fetchedSettings.storeDetails,
    },
    socialLinks:
      fetchedSettings.socialLinks && fetchedSettings.socialLinks.length > 0
        ? fetchedSettings.socialLinks
        : initialSettings.socialLinks,
    homepageSections:
      fetchedSettings.homepageSections &&
      fetchedSettings.homepageSections.length > 0
        ? fetchedSettings.homepageSections
        : initialSettings.homepageSections,
    aboutContent: {
      ...initialSettings.aboutContent,
      ...fetchedSettings.aboutContent,
    },
    faq:
      fetchedSettings.faq && fetchedSettings.faq.length > 0
        ? fetchedSettings.faq
        : initialSettings.faq,
    pdpSettings: {
      ...initialSettings.pdpSettings,
      ...fetchedSettings.pdpSettings,
    },
    shippingSettings: {
      ...initialSettings.shippingSettings,
      ...fetchedSettings.shippingSettings,
    },
    footerSettings: {
      ...initialSettings.footerSettings,
      ...fetchedSettings.footerSettings,
    },
  };

  return mergedSettings;
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const supabase = createClient();
  const [settings, setSettingsState] = useState<Settings>(initialSettings);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAllSettings = useCallback(async () => {
    setIsLoading(true);
    const settingsData = await getSettings(supabase);
    setSettingsState(settingsData);
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchAllSettings();
  }, [fetchAllSettings]);

  const saveSettings = async (newSettings: Partial<Settings>) => {
    const updatedSettings = { ...settings, ...newSettings };

    try {
      const { error } = await supabase
        .from("store_settings")
        .upsert(
          { key: SETTINGS_KEY, value: updatedSettings },
          { onConflict: "key" }
        );

      if (error) throw error;

      // This is the crucial part: update the provider's state after a successful save.
      setSettingsState(updatedSettings);
    } catch (error: any) {
      console.error("Failed to save settings:", error);
      throw new Error(error.message);
    }
  };

  const value = {
    ...settings,
    isLoading,
    saveSettings,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}
