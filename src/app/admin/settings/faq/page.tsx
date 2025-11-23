
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
import type { FAQItem } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

function FAQSettingsSkeleton() {
    return (
        <Card>
            <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
            <CardContent className="space-y-4">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-10 w-32" />
            </CardContent>
            <CardFooter><Skeleton className="h-10 w-24" /></CardFooter>
        </Card>
    );
}

export default function FAQSettingsPage() {
    const { faq, saveSettings, isLoading } = useSettings();
    const { toast } = useToast();
    const [localFaq, setLocalFaq] = useState<FAQItem[]>(faq);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!isLoading) {
            setLocalFaq(faq);
        }
    }, [isLoading, faq]);
    
    const handleFAQChange = (index: number, field: 'question' | 'answer', value: string) => {
        const updatedFAQ = [...localFaq];
        updatedFAQ[index] = { ...updatedFAQ[index], [field]: value };
        setLocalFaq(updatedFAQ);
    };

    const handleAddFAQ = () => {
        const newFAQ: FAQItem = { id: Date.now(), question: '', answer: '' };
        setLocalFaq(prev => [...prev, newFAQ]);
    };

    const handleRemoveFAQ = (index: number) => {
        setLocalFaq(localFaq.filter((_, i) => i !== index));
    };

    const handleSaveChanges = async () => {
        setIsSaving(true);
        try {
            await saveSettings({ faq: localFaq });
            toast({ title: 'FAQ settings saved!' });
        } catch (e) {
            toast({ variant: 'destructive', title: 'Error saving settings', description: (e as Error).message });
        } finally {
            setIsSaving(false);
        }
    };
    
    if (isLoading) {
        return <FAQSettingsSkeleton />;
    }

    return (
        <AnimateOnScroll>
            <Card>
                <CardHeader>
                    <CardTitle>FAQ Management</CardTitle>
                    <CardDescription>Manage the questions and answers on your FAQ page.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {localFaq.map((item, index) => (
                        <Card key={item.id}>
                            <CardContent className="p-4 space-y-4">
                                <div>
                                    <Label htmlFor={`question-${index}`}>Question</Label>
                                    <Input 
                                        id={`question-${index}`} 
                                        value={item.question} 
                                        onChange={(e) => handleFAQChange(index, 'question', e.target.value)} 
                                    />
                                </div>
                                <div>
                                    <Label htmlFor={`answer-${index}`}>Answer</Label>
                                    <Textarea 
                                        id={`answer-${index}`} 
                                        value={item.answer} 
                                        onChange={(e) => handleFAQChange(index, 'answer', e.target.value)} 
                                    />
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button variant="destructive" size="sm" onClick={() => handleRemoveFAQ(index)}>
                                    <Trash2 className="mr-2 h-4 w-4" /> Remove
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                    <Button variant="outline" onClick={handleAddFAQ}>
                        <Plus className="mr-2 h-4 w-4" /> Add FAQ
                    </Button>
                </CardContent>
                <CardFooter>
                    <Button onClick={handleSaveChanges} disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Save FAQ Section'}
                    </Button>
                </CardFooter>
            </Card>
        </AnimateOnScroll>
    );
}
