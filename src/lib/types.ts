export interface Product {
  productId: string;
  productName: string;
  description?: string | null;
  price: number;
  mrp?: number | null;
  imageUrls: string[];
  audioUrl?: string | null;
  avgRating: number;
  reviewCount: number;
  stockStatus: "in-stock" | "out-of-stock" | "archived";
  stockQuantity: number;
  productType: string;
  specifications?: { [key: string]: string | number | boolean | null };
  categories?: string[] | null;
  tags?: string[] | null;
  createdAt: string;
}

export type OrderStatus =
  | "Placed"
  | "Processing"
  | "Shipped"
  | "Delivered"
  | "Cancelled"
  | "Cancellation Pending"
  | "Refunded";

export interface OrderStatusHistoryItem {
  status: OrderStatus;
  date: string;
  comment?: string;
}

export interface Order {
  order_id: string;
  user_id: string;
  order_date: string;
  order_status: OrderStatus;
  total: number;
  cart_items: {
    product: Product;
    quantity: number;
    customizations?: Record<string, any>;
    productId: string;
  }[];
  shipping_details?: {
    name: string;
    address: string;
    city: string;
    pincode: string;
    phone: string;
  };
  payment_reference_id?: string;
  order_summary?: {
    subtotal: number;
    shipping: number;
    coupon_discount: number;
    coupon_code?: string | null;
    total_discount: number;
    grand_total: number;
    payment_method?: string | null;
  };
  adminComments?: string;
  status_history: OrderStatusHistoryItem[] | string;
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  user_name: string;
  rating_value: number;
  review_title: string;
  review_desc: string;
  review_date: string;
  status: "pending" | "approved" | "rejected";
}

export interface UserAddress {
  id: number; // Unique ID for the address object within the JSON array
  name: string;
  address_line_1: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  phone_number: string;
  alternate_phone_number?: string | null;
  is_default: boolean;
}

export interface Promotion {
  id: number;
  name: string;
  info: string;
  imageUrl: string;
  imageHint: string;
}

export interface Testimonial {
  id: number;
  name: string;
  location: string;
  comment: string;
  imageUrl: string;
  imageHint: string;
}

export interface HomepageCollectionCard {
  id: string;
  title: string;
  description: string;
  href: string;
  imageId: string;
}

export interface HomepageCategoryCard {
  id: string;
  title: string;
  href: string;
  imageId: string;
}

export type SectionType =
  | "hero"
  | "specialOffers"
  | "featuredProducts"
  | "collections"
  | "categories"
  | "newArrivals"
  | "accessories"
  | "testimonials";

type HeroSectionData = { productIds: string[]; promotions: Promotion[] };
type ProductCarouselData = { productIds: string[] };
type CollectionsData = { cards: HomepageCollectionCard[] };
type CategoriesData = { cards: HomepageCategoryCard[] };
type TestimonialsData = { testimonials: Testimonial[] };
type SpecialOffersData = { promotions: Promotion[] };

export type HomepageSection =
  | {
      id: string;
      type: "hero";
      title: string;
      visible: boolean;
      data: HeroSectionData;
    }
  | {
      id: string;
      type: "featuredProducts";
      title: string;
      visible: boolean;
      data: ProductCarouselData;
    }
  | {
      id: string;
      type: "newArrivals";
      title: string;
      visible: boolean;
      data: ProductCarouselData;
    }
  | {
      id: string;
      type: "accessories";
      title: string;
      visible: boolean;
      data: ProductCarouselData;
    }
  | {
      id: string;
      type: "collections";
      title: string;
      visible: boolean;
      data: CollectionsData;
    }
  | {
      id: string;
      type: "categories";
      title: string;
      visible: boolean;
      data: CategoriesData;
    }
  | {
      id: string;
      type: "testimonials";
      title: string;
      visible: boolean;
      data: TestimonialsData;
    }
  | {
      id: string;
      type: "specialOffers";
      title: string;
      visible: boolean;
      data: SpecialOffersData;
    };

export interface TeamMember {
  id: number;
  name: string;
  role: string;
  imageId: string;
  bio: string;
}

export interface ContactInfo {
  id: number;
  type: string;
  title: string;
  description: string;
  value: string;
  href?: string;
  iconUrl?: string;
}

export interface AboutPageContent {
  title: string;
  aboutText: string;
  aboutImageId: string;
  teamMembers: TeamMember[];
  contactInfo: ContactInfo[];
}

export interface FAQItem {
  id: number;
  question: string;
  answer: string;
}

export interface SocialLink {
  id: number;
  platform: string;
  href: string;
  iconUrl?: string;
}

export interface StringColor {
  id: string;
  value: string;
  label: string;
}

export interface PDPCustomizationOption {
  value: string;
  label: string;
  price_change?: number;
}

export interface PDPCustomization {
  id: string;
  label: string;
  type:
    | "radio"
    | "select"
    | "text"
    | "textarea"
    | "checkbox"
    | "multiple-color-select";
  options?: PDPCustomizationOption[];
  colors?: StringColor[]; // Add colors array for multiple-color-select
  default_value?: string | boolean;
  count?: number;
  productTypes?: string[];
}

export interface PDPSettings {
  productTypes: ProductType[];
  customizations: PDPCustomization[];
}

export interface ShippingSettings {
  defaultRate: number;
  freeShippingThreshold: number;
}

export interface FooterLink {
  href: string;
  label: string;
}

export interface FooterColumn {
  id: string;
  title: string;
  links: FooterLink[];
}

export interface FooterSettings {
  description: string;
  columns: FooterColumn[];
}

export interface Settings {
  storeDetails: { name: string; logo: string | null };
  socialLinks: SocialLink[];
  homepageSections: HomepageSection[];
  aboutContent: AboutPageContent;
  faq: FAQItem[];
  pdpSettings: PDPSettings;
  shippingSettings: ShippingSettings;
  footerSettings: FooterSettings;
}

export interface ProductType {
  id: string;
  name: string;
}

export interface Notification {
  id: number;
  user_id: string;
  order_id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface Coupon {
  coupon_id: number;
  coupon_code: string;
  discount_type: "percentage" | "fixed_amount";
  discount_value: number;
  min_order_amount: number;
  max_uses_per_user: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
  is_hidden: boolean;
}
