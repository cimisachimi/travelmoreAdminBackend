import React from 'react';
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Trash2, Plus } from "lucide-react";

export default function IncludesRepeater({ data, setData, errors }) {
    const handleIncludeChange = (type, index, value) => {
        // Deep clone to avoid direct mutation issues
        const newData = JSON.parse(JSON.stringify(data));
        newData[type][index] = value;
        setData('includes', newData);
    };

    const addItem = (type) => {
        const newData = JSON.parse(JSON.stringify(data));
        // Ensure array exists
        if (!newData[type]) newData[type] = [];
        newData[type].push('');
        setData('includes', newData);
    };

    const removeItem = (type, index) => {
        const newData = JSON.parse(JSON.stringify(data));
        newData[type] = newData[type].filter((_, i) => i !== index);
        setData('includes', newData);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* INCLUDED SECTION */}
            <div className="space-y-3">
                <h4 className="font-medium text-lg text-green-600">What's Included</h4>
                <div className="space-y-2">
                    {(data.included || []).map((item, index) => (
                        <div key={`inc-${index}`} className="flex items-center gap-2">
                            <Input
                                value={item}
                                onChange={(e) => handleIncludeChange('included', index, e.target.value)}
                                placeholder="e.g., Hotel Pickup"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeItem('included', index)}
                                className="text-red-500 hover:text-red-700"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => addItem('included')}>
                    <Plus className="h-4 w-4 mr-1" /> Add Included Item
                </Button>
            </div>

            {/* EXCLUDED SECTION */}
            <div className="space-y-3">
                <h4 className="font-medium text-lg text-red-600">What's Excluded</h4>
                <div className="space-y-2">
                    {(data.excluded || []).map((item, index) => (
                        <div key={`exc-${index}`} className="flex items-center gap-2">
                            <Input
                                value={item}
                                onChange={(e) => handleIncludeChange('excluded', index, e.target.value)}
                                placeholder="e.g., Personal Expenses"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeItem('excluded', index)}
                                className="text-red-500 hover:text-red-700"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => addItem('excluded')}>
                    <Plus className="h-4 w-4 mr-1" /> Add Excluded Item
                </Button>
            </div>
        </div>
    );
}
