

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSettings } from '../_components/settings-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, GripVertical, Palette } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AnimateOnScroll } from '@/components/animate-on-scroll';
import type { StringColor, PDPCustomization, PDPCustomizationOption, PDPSettings, ProductType } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { getProducts } from '@/lib/products';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

function PDPSettingsSkeleton() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Loading...</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="h-24 w-full bg-muted animate-pulse rounded-md" />
                <div className="h-48 w-full bg-muted animate-pulse rounded-md" />
            </CardContent>
        </Card>
    );
}

export default function PDPSettingsPage() {
    const { pdpSettings, saveSettings, isLoading } = useSettings();
    const { toast } = useToast();
    const [localSettings, setLocalSettings] = useState<PDPSettings>(pdpSettings);
    const [isSaving, setIsSaving] = useState(false);
    const [draggedCustomization, setDraggedCustomization] = useState<string | null>(null);
    const [availableProductTypes, setAvailableProductTypes] = useState<ProductType[]>([]);

    useEffect(() => {
        const fetchProductTypes = async () => {
            const products = await getProducts();
            const uniqueTypes = [...new Map(products.map(p => [p.productType, {id: p.productType, name: p.productType}])).values()];
            setAvailableProductTypes(uniqueTypes);
        }
        fetchProductTypes();
    }, []);

    useEffect(() => {
        if (!isLoading) {
            setLocalSettings(pdpSettings);
        }
    }, [isLoading, pdpSettings]);
    
    const handleSettingChange = <K extends keyof PDPSettings>(key: K, value: PDPSettings[K]) => {
        setLocalSettings(prev => ({...prev, [key]: value }));
    };

    const handleCustomizationChange = (index: number, field: keyof PDPCustomization, value: any) => {
        const updatedCustomizations = [...localSettings.customizations];
        updatedCustomizations[index] = { ...updatedCustomizations[index], [field]: value };
        handleSettingChange('customizations', updatedCustomizations);
    };
    
    const handleAddCustomization = () => {
        const newCustomization: PDPCustomization = { id: `cust-${Date.now()}`, label: 'New Customization', type: 'text', default_value: '', productTypes: [] };
        handleSettingChange('customizations', [...localSettings.customizations, newCustomization]);
    };

    const handleRemoveCustomization = (index: number) => {
        handleSettingChange('customizations', localSettings.customizations.filter((_, i) => i !== index));
    };
    
    const handleOptionChange = (custIndex: number, optIndex: number, field: keyof PDPCustomizationOption, value: string | number) => {
        const updatedCustomizations = [...localSettings.customizations];
        const options = [...(updatedCustomizations[custIndex].options || [])];
        options[optIndex] = { ...options[optIndex], [field]: value };
        handleCustomizationChange(custIndex, 'options', options);
    };

    const handleAddOption = (custIndex: number) => {
        const options = [...(localSettings.customizations[custIndex].options || []), { value: '', label: '', price_change: 0 }];
        handleCustomizationChange(custIndex, 'options', options);
    };

    const handleRemoveOption = (custIndex: number, optIndex: number) => {
        const options = (localSettings.customizations[custIndex].options || []).filter((_, i) => i !== optIndex);
        handleCustomizationChange(custIndex, 'options', options);
    };
    
    const handleProductTypeChange = (custIndex: number, type: string, checked: boolean | string) => {
        const currentTypes = localSettings.customizations[custIndex].productTypes || [];
        const newTypes = checked
          ? [...currentTypes, type]
          : currentTypes.filter((t) => t !== type);
        handleCustomizationChange(custIndex, 'productTypes', newTypes);
    };

    const handleColorChange = (custIndex: number, colorIndex: number, field: keyof StringColor, value: string) => {
        const colors = [...(localSettings.customizations[custIndex].colors || [])];
        colors[colorIndex] = { ...colors[colorIndex], [field]: value };
        handleCustomizationChange(custIndex, 'colors', colors);
    };
    
    const handleAddColor = (custIndex: number) => {
        const colors = [...(localSettings.customizations[custIndex].colors || []), { id: `new-${Date.now()}`, value: '', label: '' }];
        handleCustomizationChange(custIndex, 'colors', colors);
    };

    const handleRemoveColor = (custIndex: number, colorIndex: number) => {
        const colors = (localSettings.customizations[custIndex].colors || []).filter((_, i) => i !== colorIndex);
        handleCustomizationChange(custIndex, 'colors', colors);
    };


    const handleSaveChanges = async () => {
        setIsSaving(true);
        try {
            await saveSettings({ pdpSettings: localSettings });
            toast({ title: "Product page settings saved!" });
        } catch (e) {
            toast({ variant: 'destructive', title: "Error saving settings", description: (e as Error).message });
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, customizationId: string) => {
        setDraggedCustomization(customizationId);
    };
    
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, targetId: string) => {
        e.preventDefault();
        if (draggedCustomization === null || draggedCustomization === targetId) return;

        const newCustomizations = Array.from(localSettings.customizations);
        const draggedIndex = newCustomizations.findIndex(c => c.id === draggedCustomization);
        const targetIndex = newCustomizations.findIndex(c => c.id === targetId);

        if (draggedIndex === -1 || targetIndex === -1) return;

        const [removed] = newCustomizations.splice(draggedIndex, 1);
        newCustomizations.splice(targetIndex, 0, removed);
        
        handleSettingChange('customizations', newCustomizations);
    };

    const handleDragEnd = () => {
        setDraggedCustomization(null);
    };


    if (isLoading) {
        return <PDPSettingsSkeleton />;
    }

    return (
        <AnimateOnScroll>
            <Card>
                <CardHeader>
                    <CardTitle>Product Page Settings</CardTitle>
                    <CardDescription>Manage options available on the product detail page, like string colors and other customizations.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                     <Card>
                         <CardHeader>
                            <CardTitle className="text-lg">Product Customizations</CardTitle>
                            <CardDescription>Add, remove, and edit the customization fields available for products. Drag to reorder.</CardDescription>
                        </CardHeader>
                         <CardContent className="space-y-4">
                            {localSettings.customizations.map((cust, custIndex) => (
                                <div
                                    key={cust.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, cust.id)}
                                    onDragOver={(e) => handleDragOver(e, cust.id)}
                                    onDragEnd={handleDragEnd}
                                    className={cn("cursor-grab", draggedCustomization === cust.id && "opacity-50")}
                                >
                                    <Card className="bg-muted/30">
                                        <CardContent className="p-4 space-y-4">
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-2 flex-grow pr-4">
                                                    <GripVertical className="h-5 w-5 text-muted-foreground shrink-0" />
                                                    <div className="grid grid-cols-2 gap-4 flex-grow">
                                                        <div className="space-y-2"><Label>Label</Label><Input value={cust.label} onChange={e => handleCustomizationChange(custIndex, 'label', e.target.value)} /></div>
                                                        <div className="space-y-2"><Label>Type</Label>
                                                            <Select value={cust.type} onValueChange={(v: PDPCustomization['type']) => handleCustomizationChange(custIndex, 'type', v)}>
                                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="multiple-color-select">Multiple Color Selector</SelectItem>
                                                                    <SelectItem value="radio">Radio Buttons</SelectItem>
                                                                    <SelectItem value="select">Dropdown</SelectItem>
                                                                    <SelectItem value="checkbox">Checkbox</SelectItem>
                                                                    <SelectItem value="text">Text Input</SelectItem>
                                                                    <SelectItem value="textarea">Text Area</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>
                                                </div>
                                                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleRemoveCustomization(custIndex)}><Trash2 className="h-4 w-4"/></Button>
                                            </div>
                                            
                                            {(cust.type === 'radio' || cust.type === 'select') && (
                                                <div className="pl-6 border-l-2 ml-3 space-y-2">
                                                    <Label className="text-sm">Options</Label>
                                                    {(cust.options || []).map((opt, optIndex) => (
                                                        <div key={optIndex} className="flex items-end gap-2">
                                                            <div className="grid gap-1 flex-grow"><Label className="text-xs">Label</Label><Input value={opt.label} onChange={e => handleOptionChange(custIndex, optIndex, 'label', e.target.value)} /></div>
                                                            <div className="grid gap-1 flex-grow"><Label className="text-xs">Value</Label><Input value={opt.value} onChange={e => handleOptionChange(custIndex, optIndex, 'value', e.target.value)} /></div>
                                                            <div className="grid gap-1 w-28"><Label className="text-xs">Price Change</Label><Input type="number" value={opt.price_change || 0} onChange={e => handleOptionChange(custIndex, optIndex, 'price_change', Number(e.target.value))} /></div>
                                                            <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => handleRemoveOption(custIndex, optIndex)}><Trash2 className="h-3 w-3"/></Button>
                                                        </div>
                                                    ))}
                                                    <Button variant="outline" size="sm" onClick={() => handleAddOption(custIndex)}><Plus className="mr-2 h-3 w-3"/>Add Option</Button>
                                                </div>
                                            )}

                                            {cust.type === 'checkbox' && (
                                                <div className="flex items-center gap-2 pl-9">
                                                    <Label className="text-sm">Default State (checked?):</Label>
                                                    <Checkbox checked={!!cust.default_value} onCheckedChange={checked => handleCustomizationChange(custIndex, 'default_value', checked)} />
                                                </div>
                                            )}
                                            {(cust.type === 'text' || cust.type === 'textarea') && (
                                                <div className="space-y-2 pl-9">
                                                    <Label className="text-sm">Default Value / Placeholder</Label>
                                                    <Input value={(cust.default_value as string) || ''} onChange={e => handleCustomizationChange(custIndex, 'default_value', e.target.value)} />
                                                </div>
                                            )}
                                            {cust.type === 'multiple-color-select' && (
                                                <div className="space-y-4 pl-6 border-l-2 ml-3">
                                                    <div className="space-y-2 pl-3">
                                                        <Label className="text-sm">Number of Selectors</Label>
                                                        <Input type="number" value={cust.count || 1} onChange={e => handleCustomizationChange(custIndex, 'count', Number(e.target.value))} min={1} />
                                                    </div>
                                                    <Accordion type="single" collapsible className="w-full">
                                                        <AccordionItem value="colors">
                                                            <AccordionTrigger className="text-sm font-medium pl-3">Manage Colors for this Selector</AccordionTrigger>
                                                            <AccordionContent className="pl-3">
                                                                <div className="space-y-4 border rounded-md p-4">
                                                                    {(cust.colors || []).map((color, colorIndex) => (
                                                                        <div key={color.id} className="flex items-end gap-2">
                                                                            <div className="grid gap-1.5 flex-grow"><Label>Label</Label><Input value={color.label} onChange={(e) => handleColorChange(custIndex, colorIndex, 'label', e.target.value)} placeholder="e.g. Cherry Red"/></div>
                                                                            <div className="grid gap-1.5 flex-grow"><Label>Value</Label><Input value={color.value} onChange={(e) => handleColorChange(custIndex, colorIndex, 'value', e.target.value)} placeholder="e.g. cherry_red"/></div>
                                                                            <Button type="button" variant="ghost" size="icon" className="shrink-0 text-destructive" onClick={() => handleRemoveColor(custIndex, colorIndex)}><Trash2 className="h-4 w-4" /></Button>
                                                                        </div>
                                                                    ))}
                                                                    <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => handleAddColor(custIndex)}><Plus className="mr-2 h-4 w-4" /> Add Color</Button>
                                                                </div>
                                                            </AccordionContent>
                                                        </AccordionItem>
                                                    </Accordion>
                                                </div>
                                            )}
                                             <div className="space-y-2 pl-9 pt-2 border-t mt-4">
                                                <Label className="text-sm">Apply to Product Types</Label>
                                                <div className="flex flex-wrap gap-x-4 gap-y-2">
                                                    {availableProductTypes.map(type => (
                                                        <div key={type.id} className="flex items-center gap-2">
                                                            <Checkbox 
                                                                id={`${cust.id}-${type.id}`} 
                                                                checked={(cust.productTypes || []).includes(type.id)} 
                                                                onCheckedChange={(checked) => handleProductTypeChange(custIndex, type.id, checked)} 
                                                            />
                                                            <Label htmlFor={`${cust.id}-${type.id}`} className="font-normal capitalize">{type.name}</Label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            ))}
                            <Button variant="outline" onClick={handleAddCustomization}><Plus className="mr-2 h-4 w-4"/>Add Customization Field</Button>
                         </CardContent>
                    </Card>
                </CardContent>
                <CardFooter>
                    <Button onClick={handleSaveChanges} disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Save All PDP Settings'}
                    </Button>
                </CardFooter>
            </Card>
        </AnimateOnScroll>
    );
}
