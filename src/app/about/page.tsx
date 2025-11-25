"use client";

import { Mail, Phone, MessageCircle, MapPin, Link2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimateOnScroll } from "@/components/animate-on-scroll";
import Image from "next/image";
import { findImageById } from "@/lib/placeholder-images";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import {
  SettingsProvider,
  useSettings,
} from "../admin/settings/_components/settings-provider";

const contactIcons: { [key: string]: React.ElementType } = {
  email: Mail,
  phone: Phone,
  whatsapp: MessageCircle,
  address: MapPin,
};

function AboutPageSkeleton() {
  return (
    <div className="container mx-auto px-4 md:px-6 py-12 md:py-16 space-y-16">
      <div className="text-center">
        <Skeleton className="h-12 w-2/3 mx-auto" />
        <Skeleton className="h-6 w-1/2 mx-auto mt-4" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mt-12">
        <Skeleton className="aspect-video w-full rounded-lg" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      </div>
    </div>
  );
}

function AboutPageContent() {
  const { aboutContent, isLoading } = useSettings();

  if (isLoading) {
    return <AboutPageSkeleton />;
  }

  const { title, aboutText, aboutImageId, teamMembers, contactInfo } =
    aboutContent;
  const aboutImage = findImageById(aboutImageId);

  return (
    <div className="container mx-auto px-4 md:px-6 py-12 md:py-16 space-y-16">
      <AnimateOnScroll>
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{title}</h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Our story is one of passion, precision, and the pursuit of the
            perfect melody.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mt-12">
          <div>
            {aboutImage && (
              <div className="relative aspect-video rounded-lg overflow-hidden mb-6">
                <Image
                  src={aboutImage.imageUrl}
                  alt="FluteStore workshop"
                  data-ai-hint={aboutImage.imageHint}
                  fill
                  className="object-cover"
                />
              </div>
            )}
          </div>
          <div className="space-y-4 text-muted-foreground">
            {aboutText.split("\n").map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </div>
      </AnimateOnScroll>

      <Separator />

      <div>
        <AnimateOnScroll>
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Team</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-12">
              The artisans and experts dedicated to bringing you the finest
              instruments.
            </p>
          </div>
        </AnimateOnScroll>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {teamMembers.map((member, i) => {
            const teamImage = findImageById(member.imageId);
            return (
              <AnimateOnScroll key={member.id} delay={i * 100}>
                <Card className="text-center">
                  <CardContent className="pt-6">
                    {teamImage && (
                      <Avatar className="w-32 h-32 mx-auto mb-4 border-4 border-primary/10">
                        <AvatarImage
                          src={teamImage.imageUrl}
                          alt={member.name}
                          data-ai-hint={teamImage.imageHint}
                        />
                        <AvatarFallback>
                          {member.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <h3 className="text-xl font-bold">{member.name}</h3>
                    <p className="text-primary font-medium">{member.role}</p>
                    <p className="text-muted-foreground mt-2 text-sm">
                      {member.bio}
                    </p>
                  </CardContent>
                </Card>
              </AnimateOnScroll>
            );
          })}
        </div>
      </div>

      <Separator />

      <div id="contact">
        <AnimateOnScroll>
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Get in Touch
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-12">
              We're here to help with any questions. Reach out and let us know
              how we can assist you.
            </p>
          </div>
        </AnimateOnScroll>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {contactInfo.map((contact, i) => {
            const Icon = contactIcons[contact.type.toLowerCase()] || Link2;
            return (
              <AnimateOnScroll
                key={contact.id}
                delay={i * 100}
                className="flex"
              >
                <Card className="w-full">
                  <CardContent className="pt-6 flex flex-col items-center text-center">
                    <div className="flex-shrink-0 bg-primary/10 text-primary p-4 rounded-full mb-4">
                      {contact.iconUrl ? (
                        <div className="relative h-8 w-8">
                          <Image
                            src={contact.iconUrl}
                            alt={`${contact.title} icon`}
                            fill
                            className="object-contain"
                          />
                        </div>
                      ) : (
                        <Icon className="h-8 w-8" />
                      )}
                    </div>
                    <h3 className="font-semibold text-lg">{contact.title}</h3>
                    <p className="text-muted-foreground text-sm">
                      {contact.description}
                    </p>
                    <a
                      href={contact.href}
                      className="text-primary hover:underline mt-2"
                    >
                      {contact.value}
                    </a>
                  </CardContent>
                </Card>
              </AnimateOnScroll>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function AboutPage() {
  return (
    <SettingsProvider>
      <AboutPageContent />
    </SettingsProvider>
  );
}
