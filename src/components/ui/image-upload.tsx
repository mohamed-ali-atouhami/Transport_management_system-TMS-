"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { validateImageFile } from "@/lib/image-validation";
import { toast } from "sonner";

interface ImageUploadProps {
  value?: string | null; // Current image URL
  onChange: (url: string | null) => void; // Callback when image changes
  folder?: string; // Cloudinary folder (e.g., "transport-management/users")
  label?: string;
  disabled?: boolean;
}

export default function ImageUpload({
  value,
  onChange,
  folder = "transport-management",
  label = "Image",
  disabled = false,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast.error(validation.error || "Invalid file");
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to Cloudinary
    await uploadToCloudinary(file);
  };

  const uploadToCloudinary = async (file: File) => {
    setUploading(true);
    try {
      // Step 1: Get signed upload signature from our API
      const folderPath = folder.includes("/") ? folder : `${folder}/uploads`;
      const signatureResponse = await fetch(
        `/api/upload/signature?folder=${encodeURIComponent(folderPath)}`
      );

      if (!signatureResponse.ok) {
        throw new Error("Failed to get upload signature");
      }

      const { signature, api_key, timestamp, folder: uploadFolder } = await signatureResponse.json();

      // Step 2: Upload to Cloudinary using signed upload
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "transport_management_uploads");
      formData.append("signature", signature);
      formData.append("api_key", api_key); // Required for signed uploads
      formData.append("timestamp", timestamp.toString());
      formData.append("folder", uploadFolder);

      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      if (!cloudName) {
        throw new Error("Cloudinary cloud name not configured");
      }

      const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json();
        throw new Error(error.error?.message || "Upload failed");
      }

      const result = await uploadResponse.json();
      
      // Return secure URL (HTTPS)
      const imageUrl = result.secure_url;
      setPreview(imageUrl);
      onChange(imageUrl);
      
      toast.success("Image uploaded successfully");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload image");
      setPreview(value || null); // Revert to previous image
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      
      <div className="flex items-center gap-4">
        {/* Preview */}
        {preview ? (
          <div className="relative">
            <img
              src={preview}
              alt="Preview"
              className="h-24 w-24 rounded-md object-cover border border-input"
            />
            {!disabled && (
              <button
                type="button"
                onClick={handleRemove}
                className="absolute -top-2 -right-2 rounded-full bg-destructive text-destructive-foreground p-1 hover:bg-destructive/90"
                aria-label="Remove image"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        ) : (
          <div className="h-24 w-24 rounded-md border border-dashed border-input flex items-center justify-center bg-muted">
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
          </div>
        )}

        {/* Upload Button */}
        <div className="flex flex-col gap-2">
          <Input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileSelect}
            disabled={disabled || uploading}
            className="hidden"
            id="image-upload-input"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || uploading}
            className="w-full"
          >
            {uploading ? (
              <>
                <Upload className="h-4 w-4 animate-pulse" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                {preview ? "Change Image" : "Upload Image"}
              </>
            )}
          </Button>
          {preview && !disabled && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              disabled={uploading}
              className="w-full text-destructive hover:text-destructive"
            >
              <X className="h-4 w-4" />
              Remove
            </Button>
          )}
        </div>
      </div>
      
      <p className="text-xs text-muted-foreground">
        Supported formats: JPEG, PNG, WebP. Max size: 10MB
      </p>
    </div>
  );
}

