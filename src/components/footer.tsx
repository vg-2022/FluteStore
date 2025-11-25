"use client";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/icons/logo";
import {
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  Youtube,
  Link2,
} from "lucide-react";
import { Skeleton } from "./ui/skeleton";
import { useSettings } from "@/app/admin/settings/_components/settings-provider";
import type { FooterColumn, SocialLink } from "@/lib/types";
import Image from "next/image";

const platformIcons: { [key: string]: React.ReactNode } = {
  facebook: <Facebook className="w-5 h-5" />,
  twitter: <Twitter className="w-5 h-5" />,
  instagram: <Instagram className="w-5 h-5" />,
  youtube: <Youtube className="w-5 h-5" />,
  linkedin: <Linkedin className="w-5 h-5" />,
};

function SocialIcon({ link }: { link: SocialLink }) {
  if (!link.href) return null;

  if (link.iconUrl) {
    return (
      <Link
        href={link.href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-muted-foreground hover:text-primary transition-colors"
      >
        <div className="relative w-5 h-5">
          <Image
            src={link.iconUrl}
            alt={`${link.platform} icon`}
            fill
            className="object-contain"
          />
        </div>
      </Link>
    );
  }

  const icon = platformIcons[link.platform.toLowerCase()] || (
    <Link2 className="w-5 h-5" />
  );
  return (
    <Link
      href={link.href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-muted-foreground hover:text-primary transition-colors"
    >
      {icon}
    </Link>
  );
}

function FooterLinkColumn({ column }: { column: FooterColumn }) {
  return (
    <div>
      <h4 className="font-semibold text-foreground mb-4 font-headline">
        {column.title}
      </h4>
      <ul className="space-y-2">
        {column.links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="text-sm hover:text-primary transition-colors"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  const { storeDetails, socialLinks, footerSettings, isLoading } =
    useSettings();

  if (isLoading) {
    return (
      <footer className="bg-muted text-muted-foreground border-t">
        <div className="container py-12 lg:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2 pr-8 space-y-4">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="bg-muted text-muted-foreground border-t">
      <div className="container py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2 pr-8">
            <Link href="/" className="flex items-center gap-2 mb-4">
              {storeDetails.logo ? (
                <Image
                  src={storeDetails.logo}
                  alt={`${storeDetails.name} Logo`}
                  width={32}
                  height={32}
                  className="h-8 w-8 object-contain"
                />
              ) : (
                <Logo className="h-8 w-8 text-primary" />
              )}
              <span className="font-bold font-headline text-xl text-foreground">
                {storeDetails.name}
              </span>
            </Link>
            <p className="text-sm mb-4">{footerSettings.description}</p>
            <form className="flex w-full max-w-sm items-center space-x-2">
              <Input type="email" placeholder="Email for newsletter" />
              <Button type="submit" variant="secondary" className="shrink-0">
                Subscribe
              </Button>
            </form>
          </div>
          {footerSettings.columns.map((col) => (
            <FooterLinkColumn key={col.id} column={col} />
          ))}
        </div>
        <div className="mt-8 pt-8 border-t flex flex-col md:flex-row justify-between items-center text-sm">
          <p>
            &copy; {new Date().getFullYear()} {storeDetails.name}. All rights
            reserved.
          </p>
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            {socialLinks.map((link) => (
              <SocialIcon key={link.id} link={link} />
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
