import { PremiumCard } from "@/components/ui/PremiumCard";
import { Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface SamplingInfoStepProps {
    onBack: () => void;
    onNext: (data: SamplingFormData) => void;
}

interface SamplingFormData {
    sampled_by: string;
    sampler_name: string;
    sampling_date: string;
    sampling_time: string;
    location_name: string;
    // NEW: Coordinates
    latitude: string;
    longitude: string;
    // NEW: Weather
    weather_condition: "Clear" | "Cloudy" | "Rainy" | "Windy" | "Other";
    weather_notes: string;
    // NEW: Field Measurements
    field_ph: string;
    field_temperature: string;
    field_do: string;
    // NEW: Photos
    photos: File[];
}

const WEATHER_OPTIONS = [
    { value: "Clear", label: "Clear / Sunny", icon: "wb_sunny" },
    { value: "Cloudy", label: "Cloudy", icon: "cloud" },
    { value: "Rainy", label: "Rainy", icon: "rainy" },
    { value: "Windy", label: "Windy", icon: "air" },
    { value: "Other", label: "Other", icon: "help" },
] as const;

export function SamplingInfoStep({ onBack, onNext }: SamplingInfoStepProps) {
    const [formData, setFormData] = useState<SamplingFormData>({
        sampled_by: "Internal Sampler",
        sampler_name: "",
        sampling_date: new Date().toISOString().split("T")[0],
        sampling_time: "09:00",
        location_name: "",
        latitude: "",
        longitude: "",
        weather_condition: "Clear",
        weather_notes: "",
        field_ph: "",
        field_temperature: "",
        field_do: "",
        photos: []
    });

    const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const newPhotos = Array.from(files);
        const newPreviews = newPhotos.map(file => URL.createObjectURL(file));

        setFormData(prev => ({
            ...prev,
            photos: [...prev.photos, ...newPhotos]
        }));
        setPhotoPreviews(prev => [...prev, ...newPreviews]);
    };

    const removePhoto = (index: number) => {
        setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
        setFormData(prev => ({
            ...prev,
            photos: prev.photos.filter((_, i) => i !== index)
        }));
    };

    const getCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setFormData(prev => ({
                        ...prev,
                        latitude: position.coords.latitude.toFixed(6),
                        longitude: position.coords.longitude.toFixed(6)
                    }));
                },
                (error) => {
                    alert("Unable to get location: " + error.message);
                }
            );
        } else {
            alert("Geolocation is not supported by this browser.");
        }
    };

    return (
        <PremiumCard
            title="Step 2: Sampling Information"
            subtitle="Details about sample collection, location, and field conditions"
            className="animate-in fade-in slide-in-from-right-4 duration-500"
        >
            {/* Section 1: Basic Info */}
            <div className="mb-6">
                <h4 className="text-sm font-semibold text-text-main dark:text-white mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-primary">person</span>
                    Sampler Information
                </h4>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                        <Label htmlFor="sampled_by">Sampled By</Label>
                        <select
                            id="sampled_by"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            value={formData.sampled_by}
                            onChange={(e) => setFormData({ ...formData, sampled_by: e.target.value })}
                        >
                            <option value="Internal Sampler">Internal Sampler (Lab Staff)</option>
                            <option value="Customer">Customer (Client)</option>
                            <option value="Third Party">Third Party</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="sampler_name">Sampler Name</Label>
                        <Input
                            id="sampler_name"
                            placeholder="e.g. John Doe"
                            value={formData.sampler_name}
                            onChange={(e) => setFormData({ ...formData, sampler_name: e.target.value })}
                        />
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
                </div>
            </div>

            {/* Section 2: Date, Time & Coordinates */}
            <div className="mb-6 pt-4 border-t border-border-light dark:border-border-dark">
                <h4 className="text-sm font-semibold text-text-main dark:text-white mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-primary">location_on</span>
                    Date, Time & Location
                </h4>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
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

                    <div className="space-y-2">
                        <Label htmlFor="latitude">Latitude</Label>
                        <Input
                            id="latitude"
                            type="text"
                            placeholder="-6.200000"
                            value={formData.latitude}
                            onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="longitude">Longitude</Label>
                        <div className="flex gap-2">
                            <Input
                                id="longitude"
                                type="text"
                                placeholder="106.816666"
                                value={formData.longitude}
                                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                            />
                            <button
                                type="button"
                                onClick={getCurrentLocation}
                                className="flex items-center justify-center h-10 w-10 rounded-md border border-input bg-background hover:bg-slate-100 dark:hover:bg-slate-800"
                                title="Get current location"
                            >
                                <span className="material-symbols-outlined text-[18px] text-primary">my_location</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Section 3: Weather Conditions */}
            <div className="mb-6 pt-4 border-t border-border-light dark:border-border-dark">
                <h4 className="text-sm font-semibold text-text-main dark:text-white mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-primary">cloud</span>
                    Weather Conditions
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
                    {WEATHER_OPTIONS.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => setFormData({ ...formData, weather_condition: option.value })}
                            className={cn(
                                "flex flex-col items-center justify-center p-3 rounded-lg border transition-all",
                                formData.weather_condition === option.value
                                    ? "border-primary bg-primary/10 text-primary"
                                    : "border-border-light dark:border-border-dark hover:border-primary/50"
                            )}
                        >
                            <span className="material-symbols-outlined text-[24px]">{option.icon}</span>
                            <span className="text-xs mt-1">{option.label}</span>
                        </button>
                    ))}
                </div>
                <Input
                    placeholder="Additional weather notes..."
                    value={formData.weather_notes}
                    onChange={(e) => setFormData({ ...formData, weather_notes: e.target.value })}
                />
            </div>

            {/* Section 4: Field Measurements */}
            <div className="mb-6 pt-4 border-t border-border-light dark:border-border-dark">
                <h4 className="text-sm font-semibold text-text-main dark:text-white mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-primary">science</span>
                    Field Measurements (Optional)
                </h4>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                        <Label htmlFor="field_ph" className="flex items-center gap-2">
                            pH
                            <span className="text-xs text-text-secondary">(0-14)</span>
                        </Label>
                        <Input
                            id="field_ph"
                            type="number"
                            step="0.1"
                            min="0"
                            max="14"
                            placeholder="e.g. 7.2"
                            value={formData.field_ph}
                            onChange={(e) => setFormData({ ...formData, field_ph: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="field_temperature" className="flex items-center gap-2">
                            Temperature
                            <span className="text-xs text-text-secondary">(°C)</span>
                        </Label>
                        <Input
                            id="field_temperature"
                            type="number"
                            step="0.1"
                            placeholder="e.g. 28.5"
                            value={formData.field_temperature}
                            onChange={(e) => setFormData({ ...formData, field_temperature: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="field_do" className="flex items-center gap-2">
                            Dissolved Oxygen (DO)
                            <span className="text-xs text-text-secondary">(mg/L)</span>
                        </Label>
                        <Input
                            id="field_do"
                            type="number"
                            step="0.1"
                            placeholder="e.g. 6.5"
                            value={formData.field_do}
                            onChange={(e) => setFormData({ ...formData, field_do: e.target.value })}
                        />
                    </div>
                </div>
            </div>

            {/* Section 5: Photo Upload */}
            <div className="mb-6 pt-4 border-t border-border-light dark:border-border-dark">
                <h4 className="text-sm font-semibold text-text-main dark:text-white mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-primary">photo_camera</span>
                    Sample Photos (Optional)
                </h4>
                <div className="flex flex-wrap gap-3">
                    {photoPreviews.map((preview, index) => (
                        <div key={index} className="relative w-24 h-24 rounded-lg overflow-hidden border border-border-light dark:border-border-dark">
                            <img src={preview} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                            <button
                                type="button"
                                onClick={() => removePhoto(index)}
                                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-danger text-white flex items-center justify-center"
                            >
                                <span className="material-symbols-outlined text-[12px]">close</span>
                            </button>
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-24 h-24 rounded-lg border-2 border-dashed border-border-light dark:border-border-dark flex flex-col items-center justify-center text-text-secondary hover:border-primary hover:text-primary transition-colors"
                    >
                        <span className="material-symbols-outlined text-[24px]">add_photo_alternate</span>
                        <span className="text-xs mt-1">Add Photo</span>
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handlePhotoUpload}
                    />
                </div>
            </div>

            {/* Navigation */}
            <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-border-light dark:border-border-dark">
                <button
                    onClick={onBack}
                    className="rounded-lg border border-border-light bg-transparent px-4 py-2 text-sm font-medium text-text-secondary hover:bg-slate-50 dark:border-border-dark dark:hover:bg-slate-800"
                >
                    Back
                </button>
                <button
                    onClick={() => onNext(formData)}
                    className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white shadow-lg shadow-primary/30 hover:bg-primary-hover"
                >
                    Next Step &rarr;
                </button>
            </div>
        </PremiumCard>
    );
}
