'use client';

import { useQuery } from '@tanstack/react-query';
import { Search, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

import { productService } from '@/services/product-service';
import { ProductSearchFilters } from '@/types/product';
import { formatPrice } from '@/lib/utils';

interface ProductFiltersProps {
  filters: ProductSearchFilters;
  onFilterChange: (newFilters: ProductSearchFilters) => void;
  idPrefix?: string; // NOVA PROP
}

export function ProductFilters({ filters, onFilterChange, idPrefix = 'filter' }: ProductFiltersProps) {
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: productService.getCategories,
  });

  const { register, watch, setValue, reset } = useForm<ProductSearchFilters>({
    defaultValues: filters 
  });

  useEffect(() => {
    reset(filters);
  }, [filters, reset]);

  useEffect(() => {
    const subscription = watch((value) => {
      const timeoutId = setTimeout(() => {
         onFilterChange(value as ProductSearchFilters);
      }, 500);
      return () => clearTimeout(timeoutId);
    });
    return () => subscription.unsubscribe();
  }, [watch, onFilterChange]);

  const handleClearFilters = () => {
    const emptyFilters = {
      search_term: '',
      min_price: 0,
      max_price: 2000,
      category_id: undefined,
      only_promotions: false,
    };
    reset(emptyFilters);
    onFilterChange(emptyFilters);
  };

  const currentValues = watch();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Filtros</h3>
        <Button variant="ghost" size="sm" onClick={handleClearFilters} className="text-xs h-8 text-muted-foreground hover:text-red-500">
          Limpar <X className="ml-1 h-3 w-3" />
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar peça..."
          className="pl-8"
          {...register('search_term')}
          // Input do react-hook-form não precisa de ID manual para label aqui, pois tem placeholder
        />
      </div>

      <Accordion type="multiple" defaultValue={['categories', 'price', 'status']} className="w-full">
        
        <AccordionItem value="categories">
          <AccordionTrigger>Categorias</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id={`${idPrefix}-cat-all`} // ID ÚNICO
                  checked={!currentValues.category_id}
                  onCheckedChange={() => setValue('category_id', undefined)}
                />
                <Label htmlFor={`${idPrefix}-cat-all`} className="cursor-pointer">Todas</Label>
              </div>
              {categories?.map((cat) => (
                <div key={cat.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`${idPrefix}-cat-${cat.id}`} // ID ÚNICO
                    checked={Number(currentValues.category_id) === cat.id}
                    onCheckedChange={() => setValue('category_id', cat.id)}
                  />
                  <Label htmlFor={`${idPrefix}-cat-${cat.id}`} className="cursor-pointer">{cat.name}</Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="price">
          <AccordionTrigger>Faixa de Preço</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-2">
              <Slider
                value={[currentValues.min_price || 0, currentValues.max_price || 2000]}
                min={0}
                max={2000}
                step={10}
                onValueChange={(vals) => {
                  setValue('min_price', vals[0]);
                  setValue('max_price', vals[1]);
                }}
              />
              <div className="flex items-center justify-between text-sm">
                <span className="border px-2 py-1 rounded bg-slate-50">{formatPrice(currentValues.min_price || 0)}</span>
                <span className="text-muted-foreground">-</span>
                <span className="border px-2 py-1 rounded bg-slate-50">{formatPrice(currentValues.max_price || 2000)}</span>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="status">
          <AccordionTrigger>Status</AccordionTrigger>
          <AccordionContent>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id={`${idPrefix}-promotions`} // ID ÚNICO
                checked={currentValues.only_promotions}
                onCheckedChange={(checked) => setValue('only_promotions', checked as boolean)}
              />
              <Label htmlFor={`${idPrefix}-promotions`} className="cursor-pointer font-medium text-red-600">
                Apenas Promoções
              </Label>
            </div>
          </AccordionContent>
        </AccordionItem>

      </Accordion>
    </div>
  );
}