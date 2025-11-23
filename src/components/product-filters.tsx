
'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useState, useEffect, useMemo } from "react";
import { Button } from "./ui/button";
import { formatPrice } from "@/lib/utils";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimateOnScroll } from "./animate-on-scroll";
import type { Product, ProductType } from "@/lib/types";
import { useSettings } from "@/app/admin/settings/_components/settings-provider";

interface ProductFiltersProps {
  onFiltersApplied: (productCount: number) => void;
  allProducts: Product[];
}

export function ProductFilters({ onFiltersApplied, allProducts }: ProductFiltersProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { pdpSettings } = useSettings();

    const allProductTypes = useMemo(() => pdpSettings.productTypes || [], [pdpSettings.productTypes]);
    const allScales = useMemo(() => [...new Set(allProducts.flatMap(p => p.specifications?.Scale).filter(Boolean) as string[])].sort(), [allProducts]);
    const allCategories = useMemo(() => ['Beginner', 'Intermediate', 'Professional'], []);
    const allMaterials = useMemo(() => [...new Set(allProducts.flatMap(p => p.specifications?.Material).filter(Boolean) as string[])].sort(), [allProducts]);

    const getInitialState = (param: string) => {
        const values = searchParams.getAll(param);
        if (values.length > 0) return values;
        return [];
    };

    const [priceRange, setPriceRange] = useState(() => [
        Number(searchParams.get('minPrice')) || 0,
        Number(searchParams.get('maxPrice')) || 10000
    ]);
    const [selectedProductTypes, setSelectedProductTypes] = useState<string[]>(() => getInitialState('productType'));
    const [selectedScales, setSelectedScales] = useState<string[]>(() => getInitialState('scale'));
    const [selectedCategories, setSelectedCategories] = useState<string[]>(() => getInitialState('type'));
    const [selectedMaterials, setSelectedMaterials] = useState<string[]>(() => getInitialState('material'));
    const [selectedRating, setSelectedRating] = useState<number>(() => Number(searchParams.get('rating')) || 0);

    const handleCheckedChange = (checked: boolean | string, value: string, list: string[], setter: React.Dispatch<React.SetStateAction<string[]>>) => {
        if (checked) {
            setter([...list, value]);
        } else {
            setter(list.filter(item => item !== value));
        }
    };
    
    const applyFilters = () => {
        const params = new URLSearchParams(searchParams.toString());
        
        const updateParam = (name: string, values: string[]) => {
            params.delete(name);
            if (values.length > 0) {
                values.forEach(val => params.append(name, val));
            }
        };

        updateParam('productType', selectedProductTypes);
        updateParam('scale', selectedScales);
        updateParam('type', selectedCategories);
        updateParam('material', selectedMaterials);

        params.set('minPrice', String(priceRange[0]));
        params.set('maxPrice', String(priceRange[1]));

        if (selectedRating > 0) {
            params.set('rating', String(selectedRating));
        } else {
            params.delete('rating');
        }
        
        const newUrl = `${pathname}?${params.toString()}`;
        router.push(newUrl, { scroll: false });

        let filteredProducts = [...allProducts];
        if (selectedProductTypes.length > 0) {
            filteredProducts = filteredProducts.filter(p => selectedProductTypes.includes(p.productType));
        }
        if (selectedScales.length > 0) {
          filteredProducts = filteredProducts.filter(p => p.specifications?.Scale && selectedScales.includes(p.specifications.Scale as string));
        }
        if (selectedCategories.length > 0) {
          filteredProducts = filteredProducts.filter(p => p.specifications?.Type && selectedCategories.includes(p.specifications.Type as string));
        }
        if (selectedMaterials.length > 0) {
          filteredProducts = filteredProducts.filter(p => p.specifications?.Material && selectedMaterials.includes(p.specifications.Material as string));
        }
        filteredProducts = filteredProducts.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);
        if (selectedRating > 0) {
          filteredProducts = filteredProducts.filter(p => p.avgRating >= selectedRating);
        }

        onFiltersApplied(filteredProducts.length);
    };

    useEffect(() => {
        setSelectedProductTypes(getInitialState('productType'));
        setSelectedScales(getInitialState('scale'));
        setSelectedCategories(getInitialState('type'));
        setSelectedMaterials(getInitialState('material'));
        setPriceRange([Number(searchParams.get('minPrice')) || 0, Number(searchParams.get('maxPrice')) || 10000]);
        setSelectedRating(Number(searchParams.get('rating')) || 0);
    }, [searchParams]);

  return (
    <AnimateOnScroll>
        <Card className="sticky top-20">
        <CardHeader>
            <CardTitle>Filter & Sort</CardTitle>
        </CardHeader>
        <CardContent>
            <Accordion type="multiple" defaultValue={['productType', 'category', 'scale', 'price', 'material']} className="w-full">
            <AccordionItem value="productType">
                <AccordionTrigger className="font-semibold">Product Type</AccordionTrigger>
                <AccordionContent>
                <div className="grid gap-2">
                    {allProductTypes.map(type => (
                    <div key={type.id} className="flex items-center space-x-2">
                        <Checkbox
                            id={`productType-${type.id}`}
                            checked={selectedProductTypes.includes(type.id)}
                            onCheckedChange={(checked) => handleCheckedChange(checked, type.id, selectedProductTypes, setSelectedProductTypes)}
                        />
                        <Label htmlFor={`productType-${type.id}`} className="font-normal capitalize">{type.name}</Label>
                    </div>
                    ))}
                </div>
                </AccordionContent>
            </AccordionItem>
            <AccordionItem value="category">
                <AccordionTrigger className="font-semibold">Category</AccordionTrigger>
                <AccordionContent>
                <div className="grid gap-2">
                    {allCategories.map(cat => (
                    <div key={cat} className="flex items-center space-x-2">
                        <Checkbox
                            id={`category-${cat}`}
                            checked={selectedCategories.includes(cat)}
                            onCheckedChange={(checked) => handleCheckedChange(checked, cat, selectedCategories, setSelectedCategories)}
                        />
                        <Label htmlFor={`category-${cat}`} className="font-normal">{cat}</Label>
                    </div>
                    ))}
                </div>
                </AccordionContent>
            </AccordionItem>
             <AccordionItem value="scale">
                <AccordionTrigger className="font-semibold">Scale</AccordionTrigger>
                <AccordionContent>
                <div className="grid gap-2">
                    {allScales.map(scale => (
                    <div key={scale} className="flex items-center space-x-2">
                        <Checkbox 
                            id={`scale-${scale}`}
                            checked={selectedScales.includes(scale as string)}
                            onCheckedChange={(checked) => handleCheckedChange(checked, scale as string, selectedScales, setSelectedScales)}
                        />
                        <Label htmlFor={`scale-${scale}`} className="font-normal">{scale}</Label>
                    </div>
                    ))}
                </div>
                </AccordionContent>
            </AccordionItem>
            <AccordionItem value="price">
                <AccordionTrigger className="font-semibold">Price Range</AccordionTrigger>
                <AccordionContent>
                <div className="p-2">
                    <Slider
                    value={priceRange}
                    max={10000}
                    step={500}
                    onValueChange={setPriceRange}
                    />
                    <div className="flex justify-between text-sm text-muted-foreground mt-2">
                    <span>{formatPrice(priceRange[0])}</span>
                    <span>{formatPrice(priceRange[1])}</span>
                    </div>
                </div>
                </AccordionContent>
            </AccordionItem>
            <AccordionItem value="material">
                <AccordionTrigger className="font-semibold">Material</AccordionTrigger>
                <AccordionContent>
                <div className="grid gap-2">
                    {allMaterials.map(mat => (
                    <div key={mat} className="flex items-center space-x-2">
                        <Checkbox 
                        id={`mat-${mat}`}
                        checked={selectedMaterials.includes(mat as string)}
                        onCheckedChange={(checked) => handleCheckedChange(checked, mat as string, selectedMaterials, setSelectedMaterials)}
                        />
                        <Label htmlFor={`mat-${mat}`} className="font-normal">{mat}</Label>
                    </div>
                    ))}
                </div>
                </AccordionContent>
            </AccordionItem>
            <AccordionItem value="rating">
                <AccordionTrigger className="font-semibold">Rating</AccordionTrigger>
                <AccordionContent>
                <div className="grid gap-2">
                    {[4, 3, 2, 1].map(rating => (
                    <div key={rating} className="flex items-center space-x-2">
                        <Checkbox
                            id={`rating-${rating}`}
                            checked={selectedRating === rating}
                            onCheckedChange={(checked) => setSelectedRating(checked ? rating : 0)}
                        />
                        <Label htmlFor={`rating-${rating}`} className="font-normal">{rating} stars & up</Label>
                    </div>
                    ))}
                </div>
                </AccordionContent>
            </AccordionItem>
            </Accordion>
            <Button className="w-full mt-6" onClick={applyFilters}>Apply Filters</Button>
        </CardContent>
        </Card>
    </AnimateOnScroll>
  );
}
