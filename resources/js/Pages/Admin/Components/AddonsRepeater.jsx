import React from "react";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Card } from "@/Components/ui/card";
import { Plus, Trash2, DollarSign, Tag } from "lucide-react";
import InputError from "@/Components/InputError";

export default function AddonsRepeater({ items = [], setData, errors, parentField = 'addons' }) {

    const handleChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setData(parentField, newItems);
    };

    const addItem = () => {
        setData(parentField, [...items, { name: '', price: '' }]);
    };

    const removeItem = (index) => {
        const newItems = items.filter((_, i) => i !== index);
        setData(parentField, newItems);
    };

    return (
        <div className="space-y-4">
            {items.length === 0 && (
                <div className="text-sm text-gray-500 italic p-4 border border-dashed rounded-lg bg-gray-50 text-center">
                    No add-ons configured. Click below to add one.
                </div>
            )}

            {items.map((item, index) => (
                <Card key={index} className="p-4 bg-muted/20 border-l-4 border-l-blue-500 relative">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                        <div className="md:col-span-6">
                            <Label className="flex items-center gap-2 mb-1 text-xs uppercase text-gray-500 font-bold">
                                <Tag size={12} /> Add-on Name
                            </Label>
                            <Input
                                placeholder="e.g., Photography Service"
                                value={item.name || ''}
                                onChange={(e) => handleChange(index, 'name', e.target.value)}
                            />
                            <InputError message={errors?.[`${parentField}.${index}.name`]} />
                        </div>
                        <div className="md:col-span-5">
                            <Label className="flex items-center gap-2 mb-1 text-xs uppercase text-gray-500 font-bold">
                                <DollarSign size={12} /> Price (IDR)
                            </Label>
                            <Input
                                type="number"
                                placeholder="0"
                                value={item.price || ''}
                                onChange={(e) => handleChange(index, 'price', e.target.value)}
                            />
                             <InputError message={errors?.[`${parentField}.${index}.price`]} />
                        </div>
                        <div className="md:col-span-1 flex justify-end">
                            <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                onClick={() => removeItem(index)}
                                className="h-10 w-10"
                            >
                                <Trash2 size={16} />
                            </Button>
                        </div>
                    </div>
                </Card>
            ))}

            <Button type="button" variant="outline" onClick={addItem} className="w-full border-dashed border-2 py-6 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all">
                <Plus size={16} className="mr-2" /> Add New Add-on
            </Button>
        </div>
    );
}
