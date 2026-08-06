import { Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { config } from "@/lib/config";

const Logo = ({ className }: { className?: string }) => {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground ring-1 ring-primary/15 shadow-soft">
        <Eye className="size-5" />
      </div>
      <span className="text-xl font-bold tracking-tight">{config.appName}</span>
    </div>
  );
};

export default Logo;
