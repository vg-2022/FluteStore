
'use client';

import React, { useState, useEffect } from 'react';
import { useSettings } from '../_components/settings-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AnimateOnScroll } from '@/components/animate-on-scroll';
import type { FooterSettings, FooterColumn, FooterLink } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

function FooterSettingsSkeleton() {
    return (
        <Card>
            <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
            <CardContent className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-48 w-full" />
            </CardContent>
            <CardFooter><Skeleton className="h-10 w-24" /></CardFooter>
        </Card>
    );
}

export default function FooterSettingsPage() {
    const { footerSettings, saveSettings, isLoading } = useSettings();
    const { toast } = useToast();
    const [localSettings, setLocalSettings] = useState<FooterSettings>(footerSettings);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!isLoading) {
            setLocalSettings(footerSettings);
        }
    }, [isLoading, footerSettings]);

    const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setLocalSettings(prev => ({ ...prev, description: e.target.value }));
    };
    
    const handleColumnChange = (colIndex: number, field: 'title', value: string) => {
        const updatedColumns = [...localSettings.columns];
        updatedColumns[colIndex] = { ...updatedColumns[colIndex], [field]: value };
        setLocalSettings(prev => ({ ...prev, columns: updatedColumns }));
    };

    const handleLinkChange = (colIndex: number, linkIndex: number, field: keyof FooterLink, value: string) => {
        const updatedColumns = [...localSettings.columns];
        const updatedLinks = [...updatedColumns[colIndex].links];
        updatedLinks[linkIndex] = { ...updatedLinks[linkIndex], [field]: value };
        updatedColumns[colIndex].links = updatedLinks;
        setLocalSettings(prev => ({ ...prev, columns: updatedColumns }));
    };

    const handleAddLink = (colIndex: number) => {
        const updatedColumns = [...localSettings.columns];
        updatedColumns[colIndex].links.push({ href: '#', label: 'New Link' });
        setLocalSettings(prev => ({ ...prev, columns: updatedColumns }));
    };
    
    const handleRemoveLink = (colIndex: number, linkIndex: number) => {
        const updatedColumns = [...localSettings.columns];
        updatedColumns[colIndex].links = updatedColumns[colIndex].links.filter((_, i) => i !== linkIndex);
        setLocalSettings(prev => ({ ...prev, columns: updatedColumns }));
    };
    
    const handleSaveChanges = async () => {
        setIsSaving(true);
        try {
            await saveSettings({ footerSettings: localSettings });
            toast({ title: 'Footer settings saved!' });
        } catch (e) {
            toast({ variant: 'destructive', title: 'Error saving settings', description: (e as Error).message });
        } finally {
            setIsSaving(false);
        }
    };
    
    if (isLoading) {
        return <FooterSettingsSkeleton />;
    }

    return (
        <AnimateOnScroll>
            <Card>
                <CardHeader>
                    <CardTitle>Footer Settings</CardTitle>
                    <CardDescription>Manage the content of your website's footer.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="footer-desc">Footer Description</Label>
                        <Textarea
                            id="footer-desc"
                            value={localSettings.description}
                            onChange={handleDescriptionChange}
                            placeholder="A short description about your store for the footer..."
                        />
                    </div>
                    
                    <div className="space-y-4">
                        <Label>Footer Link Columns</Label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {localSettings.columns.map((column, colIndex) => (
                                <Card key={column.id}>
                                    <CardHeader>
                                        <Label>Column Title</Label>
                                        <Input value={column.title} onChange={(e) => handleColumnChange(colIndex, 'title', e.target.value)} />
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        <Label className="text-xs text-muted-foreground">Links</Label>
                                        {column.links.map((link, linkIndex) => (
                                            <div key={linkIndex} className="flex items-center gap-2">
                                                <Input value={link.label} onChange={(e) => handleLinkChange(colIndex, linkIndex, 'label', e.target.value)} placeholder="Link Label" />
                                                <Input value={link.href} onChange={(e) => handleLinkChange(colIndex, linkIndex, 'href', e.target.value)} placeholder="/url" />
                                                <Button variant="ghost" size="icon" className="shrink-0 text-destructive" onClick={() => handleRemoveLink(colIndex, linkIndex)}><Trash2 className="h-4 w-4" /></Button>
                                            </div>
                                        ))}
                                        <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => handleAddLink(colIndex)}><Plus className="h-4 w-4 mr-2"/>Add Link</Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={handleSaveChanges} disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Save Footer Settings'}
                    </Button>
                </CardFooter>
            </Card>
        </AnimateOnScroll>
    );
}
