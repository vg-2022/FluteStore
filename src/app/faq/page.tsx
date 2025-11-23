
'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AnimateOnScroll } from "@/components/animate-on-scroll";
import { useSettings } from "../admin/settings/_components/settings-provider";
import { Skeleton } from "@/components/ui/skeleton";
import { SettingsProvider } from "../admin/settings/_components/settings-provider";

function FaqPageContent() {
    const { faq, isLoading } = useSettings();

    if (isLoading) {
        return (
            <div className="w-full max-w-3xl mx-auto space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
        )
    }

    return (
        <>
            <div className="text-center mb-12">
                <AnimateOnScroll>
                    <h1 className="text-4xl md:text-5xl font-bold">Frequently Asked Questions</h1>
                    <p className="mt-2 text-lg text-muted-foreground max-w-2xl mx-auto">
                        Find answers to common questions about our flutes and services.
                    </p>
                </AnimateOnScroll>
            </div>
            
            <AnimateOnScroll delay={200} className="w-full max-w-3xl mx-auto">
                <Accordion type="single" collapsible className="w-full">
                    {faq.map((item, index) => (
                        <AccordionItem value={`item-${index}`} key={item.id}>
                            <AccordionTrigger className="text-left font-semibold text-lg">{item.question}</AccordionTrigger>
                            <AccordionContent className="text-muted-foreground whitespace-pre-wrap">
                                {item.answer}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
                {faq.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                        No frequently asked questions have been added yet.
                    </div>
                )}
            </AnimateOnScroll>
        </>
    );
}

export default function FAQPage() {
    return (
        <SettingsProvider>
            <div className="container mx-auto px-4 md:px-6 py-12 md:py-16">
                <FaqPageContent />
            </div>
        </SettingsProvider>
    );
}
