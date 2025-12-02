'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { ImagePlus, Trash, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { toast } from '@/components/ui/use-toast';

import { cn } from '@/lib/utils';

interface ImageUploadProps {
    value?: string | null;
    onChange: (url: string) => void;
    onRemove: () => void;
    disabled?: boolean;
    bucket?: string;
    folder?: string;
    className?: string;
    objectFit?: "contain" | "cover" | "fill" | "none" | "scale-down";
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
    value,
    onChange,
    onRemove,
    disabled,
    bucket = 'app-images',
    folder = 'uploads',
    className,
    objectFit = 'cover'
}) => {
    const [isUploading, setIsUploading] = useState(false);
    const supabase = createClient();

    const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            const file = e.target.files?.[0];
            if (!file) return;

            setIsUploading(true);

            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `${folder}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            const { data: { publicUrl } } = supabase.storage
                .from(bucket)
                .getPublicUrl(filePath);

            onChange(publicUrl);
            toast({
                title: "Imagen subida",
                description: "La imagen se ha cargado correctamente.",
            });

        } catch (error) {
            console.error('Error uploading image:', error);
            toast({
                title: "Error",
                description: "No se pudo subir la imagen.",
                variant: "destructive"
            });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className={cn("relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-50 transition-colors bg-white overflow-hidden", className)}>
            {value ? (
                <div className="relative w-full h-full">
                    <div className="absolute top-2 right-2 z-10">
                        <Button
                            type="button"
                            onClick={onRemove}
                            variant="destructive"
                            size="icon"
                            disabled={disabled}
                        >
                            <Trash className="h-4 w-4" />
                        </Button>
                    </div>
                    <Image
                        fill
                        style={{ objectFit }}
                        alt="Image"
                        src={value}
                    />
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center pt-5 pb-6 cursor-pointer" onClick={() => document.getElementById('image-upload-input')?.click()}>
                    {isUploading ? (
                        <>
                            <Loader2 className="h-10 w-10 mb-3 text-gray-400 animate-spin" />
                            <p className="mb-2 text-sm text-gray-500">Subiendo...</p>
                        </>
                    ) : (
                        <>
                            <ImagePlus className="h-10 w-10 mb-3 text-gray-400" />
                            <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click para subir</span></p>
                            <p className="text-xs text-gray-500">SVG, PNG, JPG or GIF</p>
                        </>
                    )}
                </div>
            )}
            <input
                id="image-upload-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onUpload}
                disabled={disabled || isUploading}
            />
        </div>
    );
};
