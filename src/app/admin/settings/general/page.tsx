'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import React, { useState, useEffect } from "react";
import { Upload, Image as ImageIcon, Trash2, Plus, Link as LinkIcon } from "lucide-react";
import { AnimateOnScroll } from "@/components/animate-on-scroll";
import { cn } from "@/lib/utils";
import Image from "next/image";
import type { SocialLink } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useSettings } from "../_components/settings-provider";

function GeneralSettingsSkeleton() {
    return (
         <div className="space-y-8">
            <Card><CardHeader><Skeleton className="h-8 w-1/4" /></CardHeader><CardContent><Skeleton className="h-48 w-full" /></CardContent></Card>
            <Card><CardHeader><Skeleton className="h-8 w-1/4" /></CardHeader><CardContent><Skeleton className="h-48 w-full" /></CardContent></Card>
         </div>
    )
}

export default function GeneralSettingsPage() {
    const { toast } = useToast();
    const { saveSettings, isLoading, storeDetails, socialLinks } = useSettings();
    
    const [isDragging, setIsDragging] = useState(false);
    const [localStoreName, setLocalStoreName] = useState('');
    const [localLogo, setLocalLogo] = useState<string | null>(null);
    const [localSocialLinks, setLocalSocialLinks] = useState<SocialLink[]>([]);
    
    useEffect(() => {
        if (!isLoading) {
            setLocalStoreName(storeDetails.name);
            setLocalLogo(storeDetails.logo);
            setLocalSocialLinks(socialLinks);
        }
    }, [isLoading, storeDetails, socialLinks]);


    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setLocalLogo(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                 setLocalLogo(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveStoreDetails = async () => {
        try {
            await saveSettings({ storeDetails: { name: localStoreName, logo: localLogo } });
            toast({ title: 'Store details updated!'});
        } catch(e) {
            toast({ variant: 'destructive', title: 'Error saving store details', description: (e as Error).message });
        }
    };
    
    const handleSocialLinkChange = (index: number, field: keyof SocialLink, value: string) => {
        const updatedLinks = [...localSocialLinks];
        updatedLinks[index] = { ...updatedLinks[index], [field]: value };
        setLocalSocialLinks(updatedLinks);
    };

    const handleAddSocialLink = () => {
        const newLink: SocialLink = { id: Date.now(), platform: 'facebook', href: '' };
        setLocalSocialLinks([...localSocialLinks, newLink]);
    };

    const handleRemoveSocialLink = (index: number) => {
        const updatedLinks = localSocialLinks.filter((_, i) => i !== index);
        setLocalSocialLinks(updatedLinks);
    };

    const handleSaveSocialLinks = async () => {
        try {
            await saveSettings({ socialLinks: localSocialLinks });
            toast({ title: "Social links saved!" });
        } catch (e) {
            toast({ variant: 'destructive', title: "Error saving social links", description: (e as Error).message });
        }
    };

    if (isLoading) {
        return <GeneralSettingsSkeleton />;
    }

    return (
        <>
            <AnimateOnScroll>
                <Card>
                    <CardHeader>
                        <CardTitle>Store Details</CardTitle>
                        <CardDescription>Manage your store name and logo.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-2">
                            <Label htmlFor="store-name">Store Name</Label>
                            <Input id="store-name" value={localStoreName} onChange={e => setLocalStoreName(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Store Logo</Label>
                            <div 
                                className={cn("flex flex-col items-center justify-center rounded-md border-2 border-dashed p-8 text-center cursor-pointer", isDragging && "border-primary")}
                                onDrop={handleDrop}
                                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                onDragLeave={() => setIsDragging(false)}
                            >
                                <input id="logo-upload" type="file" accept="image/*" onChange={handleLogoChange} className="sr-only" />
                                <label htmlFor="logo-upload" className="cursor-pointer">
                                    {localLogo ? (
                                        <Image src={localLogo} alt="Logo preview" width={128} height={128} className="rounded-md object-contain" />
                                    ) : (
                                        <div className="flex flex-col items-center">
                                            <ImageIcon className="h-12 w-12 text-muted-foreground mb-2" />
                                            <p className="text-sm text-muted-foreground">Drag &amp; drop logo here, or click to browse</p>
                                        </div>
                                    )}
                                </label>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={handleSaveStoreDetails}>Save Store Details</Button>
                    </CardFooter>
                </Card>
            </AnimateOnScroll>

            <AnimateOnScroll delay={100}>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><LinkIcon className="h-5 w-5"/> Social Media Links</CardTitle>
                        <CardDescription>Manage the social media links displayed in the footer.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {localSocialLinks.map((link, index) => (
                            <Card key={link.id}>
                                <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center">
                                    <div className="grid gap-2 flex-grow w-full md:w-auto">
                                        <Label>Platform</Label>
                                        <Select 
                                            value={link.platform} 
                                            onValueChange={(value: SocialLink['platform']) => handleSocialLinkChange(index, 'platform', value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select platform" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="facebook">Facebook</SelectItem>
                                                <SelectItem value="twitter">Twitter / X</SelectItem>
                                                <SelectItem value="instagram">Instagram</SelectItem>
                                                <SelectItem value="youtube">YouTube</SelectItem>
                                                <SelectItem value="linkedin">LinkedIn</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2 flex-grow w-full md:w-auto">
                                        <Label>URL</Label>
                                        <Input 
                                            value={link.href} 
                                            onChange={(e) => handleSocialLinkChange(index, 'href', e.target.value)} 
                                            placeholder="https://..."
                                        />
                                    </div>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="text-destructive self-end"
                                        onClick={() => handleRemoveSocialLink(index)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                        <Button variant="outline" onClick={handleAddSocialLink}>
                            <Plus className="mr-2 h-4 w-4" /> Add Social Link
                        </Button>
                    </CardContent>
                     <CardFooter>
                        <Button onClick={handleSaveSocialLinks}>Save Social Links</Button>
                    </CardFooter>
                </Card>
            </AnimateOnScroll>
        </>
    )
}
