import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface SecureImageProps {
  src: string;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
}

export function SecureImage({ src, alt, className, fallback }: SecureImageProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadImage = async () => {
      setIsLoading(true);
      setHasError(false);

      try {
        const response = await fetch(src, { credentials: "include" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const blob = await response.blob();
        if (cancelled) return;

        if (objectUrlRef.current) {
          URL.revokeObjectURL(objectUrlRef.current);
        }
        const url = URL.createObjectURL(blob);
        objectUrlRef.current = url;
        setBlobUrl(url);
        setIsLoading(false);
      } catch {
        if (!cancelled) {
          setHasError(true);
          setIsLoading(false);
        }
      }
    };

    void loadImage();

    return () => {
      cancelled = true;
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [src]);

  if (isLoading) {
    return (
      <div className={cn("animate-pulse bg-muted/50", className)} />
    );
  }

  if (hasError || !blobUrl) {
    if (fallback) return <>{fallback}</>;
    return (
      <div className={cn("flex items-center justify-center bg-muted/30", className)}>
        <span className="text-xs text-muted-foreground">!</span>
      </div>
    );
  }

  return (
    <img
      src={blobUrl}
      alt={alt}
      className={className}
      loading="lazy"
    />
  );
}
