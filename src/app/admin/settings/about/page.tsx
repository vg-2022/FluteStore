
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
import { Plus, Trash2, Contact, Info } from "lucide-react";
import { AnimateOnScroll } from "@/components/animate-on-scroll";
import Image from "next/image";
import { Textarea } from "@/components/ui/textarea";
import type { TeamMember, ContactInfo, AboutPageContent } from "@/lib/types";
import { findImageById } from "@/lib/placeholder-images";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useSettings } from "../_components/settings-provider";

function AboutSettingsSkeleton() {
    return (
        <Card><CardHeader><Skeleton className="h-8 w-1/4" /></CardHeader><CardContent><Skeleton className="h-48 w-full" /></CardContent></Card>
    );
}

export default function AboutSettingsPage() {
    const { toast } = useToast();
    const { saveSettings, isLoading, aboutContent } = useSettings();
    
    const [localAboutContent, setLocalAboutContent] = useState<AboutPageContent>(aboutContent);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!isLoading) {
            setLocalAboutContent(aboutContent);
        }
    }, [isLoading, aboutContent]);
    
    const handleAboutContentChange = (field: keyof AboutPageContent, value: any) => {
        setLocalAboutContent(prev => ({...prev, [field]: value}));
    };

    const handleAboutImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                handleAboutContentChange('aboutImageId', reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleTeamMemberChange = (index: number, field: keyof TeamMember, value: string) => {
        const updatedMembers = [...localAboutContent.teamMembers];
        updatedMembers[index] = { ...updatedMembers[index], [field]: value };
        handleAboutContentChange('teamMembers', updatedMembers);
    };

    const handleTeamMemberImageUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                handleTeamMemberChange(index, 'imageId', reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleAddTeamMember = () => {
        const newMember: TeamMember = { id: Date.now(), name: '', role: '', bio: '', imageId: '' };
        handleAboutContentChange('teamMembers', [...localAboutContent.teamMembers, newMember]);
    };

    const handleRemoveTeamMember = (index: number) => {
        const updatedMembers = localAboutContent.teamMembers.filter((_, i) => i !== index);
        handleAboutContentChange('teamMembers', updatedMembers);
    };

    const handleContactInfoChange = (index: number, field: keyof ContactInfo, value: string) => {
        const updatedContacts = [...localAboutContent.contactInfo];
        const contact = { ...updatedContacts[index], [field]: value };

        if (field === 'value' && !contact.href) { // Auto-populate href if not manually set
            if (contact.type.toLowerCase() === 'email') contact.href = `mailto:${value}`;
            else if (contact.type.toLowerCase() === 'phone') contact.href = `tel:${value}`;
            else if (contact.type.toLowerCase() === 'whatsapp') contact.href = `https://wa.me/${value.replace(/\D/g, '')}`;
        }

        updatedContacts[index] = contact;
        handleAboutContentChange('contactInfo', updatedContacts);
    };

    const handleContactIconUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                handleContactInfoChange(index, 'iconUrl', reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAddContactInfo = () => {
        const newContact: ContactInfo = { id: Date.now(), type: 'email', title: '', description: '', value: '' };
        handleAboutContentChange('contactInfo', [...localAboutContent.contactInfo, newContact]);
    };

    const handleRemoveContactInfo = (index: number) => {
        const updatedContacts = localAboutContent.contactInfo.filter((_, i) => i !== index);
        handleAboutContentChange('contactInfo', updatedContacts);
    };
    
    const handleSaveAboutPage = async () => {
        setIsSaving(true);
        try {
            await saveSettings({ aboutContent: localAboutContent });
            toast({ title: "About page content saved!" });
        } catch (e) {
            toast({ variant: 'destructive', title: "Error saving about page", description: (e as Error).message });
        } finally {
            setIsSaving(false);
        }
    };
    
    if (isLoading) {
        return <AboutSettingsSkeleton />;
    }

    const aboutImage = findImageById(localAboutContent.aboutImageId);

    return (
        <AnimateOnScroll>
            <Card>
                <CardHeader>
                    <CardTitle>About &amp; Contact Page</CardTitle>
                    <CardDescription>Edit the content displayed on your About Us and Contact Us page.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="about-title" className="flex items-center gap-2"><Info className="h-4 w-4"/> About Us Section Title</Label>
                        <Input 
                            id="about-title"
                            value={localAboutContent.title}
                            onChange={e => handleAboutContentChange('title', e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>About Us Main Image</Label>
                         <Input 
                            value={!localAboutContent.aboutImageId.startsWith('blob:') && !localAboutContent.aboutImageId.startsWith('data:') && !localAboutContent.aboutImageId.startsWith('http') ? localAboutContent.aboutImageId : ''}
                            onChange={(e) => handleAboutContentChange('aboutImageId', e.target.value)} 
                            placeholder="Enter image URL or placeholder ID"
                        />
                        <div className="text-xs text-muted-foreground text-center my-1">OR</div>
                        <Input 
                            id="about-img-upload" 
                            type="file" 
                            accept="image/*" 
                            className="text-xs"
                            onChange={handleAboutImageUpload}
                        />
                        {aboutImage && (
                            <Image src={aboutImage.imageUrl} alt="preview" width={120} height={67} className="rounded-md object-cover mt-2" />
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="about-text" className="flex items-center gap-2"><Info className="h-4 w-4"/> About Us Section Text</Label>
                        <Textarea 
                            id="about-text"
                            value={localAboutContent.aboutText}
                            onChange={e => handleAboutContentChange('aboutText', e.target.value)}
                            rows={5}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Team Members</Label>
                        <div className="space-y-4">
                            {localAboutContent.teamMembers.map((member, index) => (
                                <Card key={member.id}>
                                    <CardContent className="p-4 grid grid-cols-2 gap-4">
                                        <div className="space-y-2"><Label>Name</Label><Input value={member.name} onChange={e => handleTeamMemberChange(index, 'name', e.target.value)} /></div>
                                        <div className="space-y-2"><Label>Role</Label><Input value={member.role} onChange={e => handleTeamMemberChange(index, 'role', e.target.value)} /></div>
                                        <div className="col-span-2 space-y-2"><Label>Bio</Label><Textarea value={member.bio} onChange={e => handleTeamMemberChange(index, 'bio', e.target.value)} rows={2} /></div>
                                        <div className="col-span-2 space-y-2">
                                            <Label>Image (URL or Upload)</Label>
                                            <Input 
                                                value={!member.imageId.startsWith('blob:') && !member.imageId.startsWith('data:') && !member.imageId.startsWith('http') ? member.imageId : ''}
                                                onChange={(e) => handleTeamMemberChange(index, 'imageId', e.target.value)} 
                                                placeholder="Enter image URL or placeholder ID"
                                            />
                                            <div className="text-xs text-muted-foreground text-center my-1">OR</div>
                                            <Input 
                                                id={`member-img-upload-${member.id}`} 
                                                type="file" 
                                                accept="image/*" 
                                                className="text-xs"
                                                onChange={(e) => handleTeamMemberImageUpload(index, e)}
                                            />
                                            {(member.imageId.startsWith('blob:') || member.imageId.startsWith('data:') || member.imageId.startsWith('http') || findImageById(member.imageId)) && (
                                                <Image src={findImageById(member.imageId)?.imageUrl || member.imageId} alt="preview" width={80} height={80} className="rounded-md object-cover mt-2" />
                                            )}
                                        </div>
                                    </CardContent>
                                    <CardFooter><Button size="sm" variant="destructive" onClick={() => handleRemoveTeamMember(index)}>Remove Member</Button></CardFooter>
                                </Card>
                            ))}
                            <Button variant="outline" onClick={handleAddTeamMember}><Plus className="mr-2 h-4 w-4" /> Add Team Member</Button>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2"><Contact className="h-4 w-4"/> Contact Information</Label>
                         <div className="space-y-4">
                            {localAboutContent.contactInfo.map((contact, index) => (
                                <Card key={contact.id}>
                                    <CardContent className="p-4 grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Type</Label>
                                            <Input value={contact.type} onChange={(e) => handleContactInfoChange(index, 'type', e.target.value)} placeholder="e.g. Email, Phone"/>
                                        </div>
                                        <div className="space-y-2"><Label>Title</Label><Input value={contact.title} onChange={e => handleContactInfoChange(index, 'title', e.target.value)} /></div>
                                        <div className="space-y-2"><Label>Value / Main Line</Label><Input value={contact.value} onChange={e => handleContactInfoChange(index, 'value', e.target.value)} /></div>
                                        <div className="space-y-2"><Label>Description / Sub-line</Label><Input value={contact.description} onChange={e => handleContactInfoChange(index, 'description', e.target.value)} /></div>
                                        <div className="col-span-2 space-y-2"><Label>Link (href)</Label><Input value={contact.href || ''} onChange={e => handleContactInfoChange(index, 'href', e.target.value)} placeholder="e.g., mailto:..." /></div>
                                        <div className="col-span-2 space-y-2">
                                            <Label>Custom Icon (Optional)</Label>
                                            <Input
                                                id={`contact-icon-upload-${contact.id}`}
                                                type="file"
                                                accept="image/*,.svg"
                                                className="text-xs"
                                                onChange={(e) => handleContactIconUpload(index, e)}
                                            />
                                            {contact.iconUrl && <Image src={contact.iconUrl} alt="Icon Preview" width={32} height={32} className="mt-2" />}
                                        </div>
                                    </CardContent>
                                    <CardFooter><Button size="sm" variant="destructive" onClick={() => handleRemoveContactInfo(index)}>Remove Contact</Button></CardFooter>
                                </Card>
                            ))}
                            <Button variant="outline" onClick={handleAddContactInfo}><Plus className="mr-2 h-4 w-4" /> Add Contact Method</Button>
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={handleSaveAboutPage} disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Save About Page'}
                    </Button>
                </CardFooter>
            </Card>
        </AnimateOnScroll>
    );
}
