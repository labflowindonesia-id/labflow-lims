import { PremiumCard } from "@/components/ui/PremiumCard";
import { Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { useState } from "react";

interface SamplingInfoStepProps {
    onBack: () => void;
    onNext: (data: any) => void;
}

export function SamplingInfoStep({ onBack, onNext }: SamplingInfoStepProps) {
    const [formData, setFormData] = useState({
        sampled_by: "Internal Sampler",
        sampling_date: new Date().toISOString().split("T")[0],
        sampling_time: "09:00",
        location_name: "",
        weather_conditions: ""
    });

    return (
        <PremiumCard
            title="Step 2: Sampling Information"
            subtitle="Details about sample collection"
            className="animate-in fade-in slide-in-from-right-4 duration-500"
        >
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="sampled_by">Sampled By</Label>
                    <select
                        id="sampled_by"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={formData.sampled_by}
                        onChange={(e) => setFormData({ ...formData, sampled_by: e.target.value })}
                    >
                        <option value="Internal Sampler">Internal Sampler (Lab Staff)</option>
                        <option value="Customer">Customer (Client)</option>
                        <option value="Third Party">Third Party</option>
                    </select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="location_name">Location Name / Point ID</Label>
                    <Input
                        id="location_name"
                        placeholder="e.g. Outlet IPAL - Timut"
                        value={formData.location_name}
                        onChange={(e) => setFormData({ ...formData, location_name: e.target.value })}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="sampling_date">Sampling Date</Label>
                    <Input
                        id="sampling_date"
                        type="date"
                        value={formData.sampling_date}
                        onChange={(e) => setFormData({ ...formData, sampling_date: e.target.value })}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="sampling_time">Sampling Time</Label>
                    <Input
                        id="sampling_time"
                        type="time"
                        value={formData.sampling_time}
                        onChange={(e) => setFormData({ ...formData, sampling_time: e.target.value })}
                    />
                </div>

                <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="weather">Weather / Field Conditions (Optional)</Label>
                    <Input
                        id="weather"
                        placeholder="e.g. Sunny, 32°C, No Rain"
                        value={formData.weather_conditions}
                        onChange={(e) => setFormData({ ...formData, weather_conditions: e.target.value })}
                    />
                </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
                <button
                    onClick={onBack}
                    className="rounded-lg border border-border-light bg-transparent px-4 py-2 text-sm font-medium text-text-secondary hover:bg-slate-50"
                >
                    Back
                </button>
                <button
                    onClick={() => onNext(formData)}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-lg shadow-primary/30 hover:bg-primary-hover"
                >
                    Next Step &rarr;
                </button>
            </div>
        </PremiumCard>
    );
}
