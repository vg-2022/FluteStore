
'use client';

import React, { useState, useEffect } from 'react';
import { useSettings } from '../_components/settings-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { AnimateOnScroll } from '@/components/animate-on-scroll';
import type { ShippingSettings } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

function ShippingSettingsSkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
            </CardHeader>
            <CardContent className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </CardContent>
            <CardFooter>
                <Skeleton className="h-10 w-24" />
            </CardFooter>
        </Card>
    );
}


export default function ShippingSettingsPage() {
    const { shippingSettings, saveSettings, isLoading } = useSettings();
    const { toast } = useToast();
    const [localSettings, setLocalSettings] = useState<ShippingSettings>(shippingSettings);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!isLoading) {
            setLocalSettings(shippingSettings);
        }
    }, [isLoading, shippingSettings]);

    const handleSettingChange = (field: keyof ShippingSettings, value: number) => {
        setLocalSettings(prev => ({ ...prev, [field]: value }));
    };

    const handleSaveChanges = async () => {
        setIsSaving(true);
        try {
            await saveSettings({ shippingSettings: localSettings });
            toast({ title: 'Shipping settings saved!' });
        } catch (e) {
            toast({ variant: 'destructive', title: 'Error saving settings', description: (e as Error).message });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <ShippingSettingsSkeleton />;
    }

    return (
        <AnimateOnScroll>
            <Card>
                <CardHeader>
                    <CardTitle>Shipping Settings</CardTitle>
                    <CardDescription>Manage shipping rates and rules for your store.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="defaultRate">Default Shipping Rate (INR)</Label>
                        <Input
                            id="defaultRate"
                            type="number"
                            value={localSettings.defaultRate || 0}
                            onChange={(e) => handleSettingChange('defaultRate', Number(e.target.value))}
                            placeholder="e.g., 150"
                        />
                         <p className="text-sm text-muted-foreground">
                           This is the base rate applied to all orders unless other rules apply.
                        </p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="freeShippingThreshold">Free Shipping Threshold (INR)</Label>
                        <Input
                            id="freeShippingThreshold"
                            type="number"
                            value={localSettings.freeShippingThreshold || 0}
                            onChange={(e) => handleSettingChange('freeShippingThreshold', Number(e.target.value))}
                            placeholder="e.g., 2000"
                        />
                        <p className="text-sm text-muted-foreground">
                            Orders with a subtotal above this amount will have free shipping. Set to 0 to disable.
                        </p>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={handleSaveChanges} disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Save Shipping Settings'}
                    </Button>
                </CardFooter>
            </Card>
        </AnimateOnScroll>
    );
}
