// e.g., resources/js/Pages/Admin/HolidayPackage/PriceTiersRepeater.jsx
import React from 'react';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import InputError from '@/Components/InputError';
import { Trash2, Plus } from 'lucide-react';

export const PriceTiersRepeater = ({ items = [], setData, errors }) => {

  // Use 'items' from props, default to empty array if null/undefined
  const tiers = items || [];

  const handleTierChange = (index, field, value) => {
    // Ensure numeric values
    const numericValue = value === '' ? '' : parseInt(value, 10);
    setData(`price_tiers.${index}.${field}`, numericValue);
  };

  const addTier = () => {
    setData('price_tiers', [
      ...tiers,
      { min_pax: '', max_pax: '', price: '' }
    ]);
  };

  const removeTier = (index) => {
    setData('price_tiers', tiers.filter((_, i) => i !== index));
  };

  // Sort tiers by min_pax for a consistent display
  const sortedTiers = [...tiers].map((tier, originalIndex) => ({
    ...tier,
    originalIndex // Keep track of original index for setData
  })).sort((a, b) => (a.min_pax || 0) - (b.min_pax || 0));


  return (
    <div className="space-y-4">
      {sortedTiers.map((item) => {
        const index = item.originalIndex; // Use original index for 'setData'
        return (
          <Card key={index} className="p-4 bg-muted/50 dark:bg-muted/30">
            <CardContent className="p-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor={`tier_${index}_min_pax`}>Min Pax <span className="text-red-500">*</span></Label>
                  <Input
                    id={`tier_${index}_min_pax`}
                    type="number"
                    value={item.min_pax ?? ''}
                    onChange={e => handleTierChange(index, 'min_pax', e.target.value)}
                    min="1"
                    required
                    className={errors?.[`price_tiers.${index}.min_pax`] ? 'border-red-500' : ''}
                  />
                  <InputError message={errors?.[`price_tiers.${index}.min_pax`]} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor={`tier_${index}_max_pax`}>Max Pax (Leave empty for "and above")</Label>
                  <Input
                    id={`tier_${index}_max_pax`}
                    type="number"
                    value={item.max_pax ?? ''}
                    onChange={e => handleTierChange(index, 'max_pax', e.target.value)}
                    min={item.min_pax || 1}
                    placeholder="e.g., 10"
                    className={errors?.[`price_tiers.${index}.max_pax`] ? 'border-red-500' : ''}
                  />
                  <InputError message={errors?.[`price_tiers.${index}.max_pax`]} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor={`tier_${index}_price`}>Price per Pax (IDR) <span className="text-red-500">*</span></Label>
                  <Input
                    id={`tier_${index}_price`}
                    type="number"
                    value={item.price ?? ''}
                    onChange={e => handleTierChange(index, 'price', e.target.value)}
                    min="0"
                    required
                    className={errors?.[`price_tiers.${index}.price`] ? 'border-red-500' : ''}
                  />
                  <InputError message={errors?.[`price_tiers.${index}.price`]} className="mt-1" />
                </div>
              </div>
              <div className="mt-4 text-right">
                <Button type="button" variant="destructive" size="sm" onClick={() => removeTier(index)}>
                  <Trash2 className="h-4 w-4 mr-1" /> Remove
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
      <Button type="button" variant="outline" onClick={addTier}>
        <Plus className="h-4 w-4 mr-1" /> Add Price Tier
      </Button>
      <InputError message={errors?.price_tiers} className="mt-1" />
    </div>
  );
};