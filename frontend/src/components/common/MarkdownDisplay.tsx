import { memo, useMemo, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { SecureImage } from "@/components/common/SecureImage";
import { getUploadsUrl } from "@/lib/config";
import {
  FileIcon,
  FileTextIcon,
  Image as ImageIcon,
  DownloadIcon,
  type LucideIcon,
} from "lucide-react";

interface MarkdownDisplayProps {
  value: string;
  className?: string;
}

function resolveUrl(src: string): string {
  if (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("data:")) {
    return src;
  }
  const uploadsUrl = getUploadsUrl();
  if (src.startsWith("/uploads/")) {
    return src;
  }
  if (src.startsWith("/")) {
    return `${uploadsUrl}${src}`;
  }
  return `${uploadsUrl}/${src}`;
}

const FILE_EXT_ICON: Record<string, LucideIcon> = {
  pdf: FileTextIcon,
  doc: FileTextIcon,
  docx: FileTextIcon,
  xls: FileIcon,
  xlsx: FileIcon,
  csv: FileIcon,
  txt: FileIcon,
  jpg: ImageIcon,
  jpeg: ImageIcon,
  png: ImageIcon,
  gif: ImageIcon,
  webp: ImageIcon,
};

function getFileExt(href: string): string {
  const clean = href.split("?")[0].split("#")[0];
  const dot = clean.lastIndexOf(".");
  return dot >= 0 ? clean.slice(dot + 1).toLowerCase() : "";
}

function isFileLink(href: string): boolean {
  if (!href) return false;
  if (href.startsWith("/uploads/")) return true;
  // Patient file download URLs: /patients/{id}/files/{fileId}
  if (/\/patients\/\d+\/files\/\d+/.test(href)) return true;
  // Clinic note attachment download URLs: /clinic-notes/{id}/attachments/{fileId}
  if (/\/clinic-notes\/\d+\/attachments\/\d+/.test(href)) return true;
  const ext = getFileExt(href);
  return ext in FILE_EXT_ICON;
}

function extractText(children: ReactNode): string {
  if (typeof children === "string") return children;
  if (Array.isArray(children)) return children.map(extractText).join("");
  return "";
}

/**
 * Render an uploaded-file link as a visual chip (icon + filename + open button).
 * Uses <span> — not <div> — to stay valid inside <p> and avoid hydration errors.
 */
function FileLinkChip({ href, fileName }: { href: string; fileName: string }) {
  const ext = getFileExt(href);
  const Icon = FILE_EXT_ICON[ext] ?? FileIcon;
  const resolved = resolveUrl(href);
  return (
    <a
      href={resolved}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-card px-3 py-1.5 my-1 text-xs font-medium text-foreground transition-all hover:border-primary/30 hover:shadow-soft no-underline"
    >
      <Icon className="size-4 shrink-0 text-primary/70" />
      <span className="max-w-[200px] truncate">{fileName}</span>
      <DownloadIcon className="size-3 shrink-0 text-muted-foreground" />
    </a>
  );
}

export const MarkdownDisplay = memo(function MarkdownDisplay({
  value,
  className,
}: MarkdownDisplayProps) {
  const components = useMemo(
    () => ({
      p: ({ children }: { children?: React.ReactNode }) => (
        <p className="my-1.5 leading-relaxed first:mt-0 last:mb-0">{children}</p>
      ),
      li: ({ children }: { children?: React.ReactNode }) => (
        <li className="leading-relaxed">{children}</li>
      ),
      hr: () => <hr className="my-3 border-border/60" />,
      strong: ({ children }: { children?: React.ReactNode }) => (
        <strong className="font-semibold text-foreground">{children}</strong>
      ),
      em: ({ children }: { children?: React.ReactNode }) => (
        <em className="italic">{children}</em>
      ),
      img: ({ src, alt }: { src?: string; alt?: string; title?: string }) => {
        if (!src) return null;
        const resolved = resolveUrl(src);
        return (
          <SecureImage
            src={resolved}
            alt={alt ?? ""}
            className="max-w-full rounded-lg border border-border/40 my-2"
          />
        );
      },
      a: ({
        href,
        children,
      }: {
        href?: string;
        children?: React.ReactNode;
      }) => {
        if (href && isFileLink(href)) {
          return <FileLinkChip href={href} fileName={extractText(children) || "file"} />;
        }
        return (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-2 hover:text-primary/80"
          >
            {children}
          </a>
        );
      },
      table: ({ children }: { children?: React.ReactNode }) => (
        <div className="overflow-x-auto my-2 rounded-md border border-border/40">
          <table className="min-w-full text-sm border-collapse">{children}</table>
        </div>
      ),
      thead: ({ children }: { children?: React.ReactNode }) => (
        <thead className="bg-muted/50 font-semibold">{children}</thead>
      ),
      th: ({ children }: { children?: React.ReactNode }) => (
        <th className="border border-border/40 px-3 py-1.5 text-left">{children}</th>
      ),
      td: ({ children }: { children?: React.ReactNode }) => (
        <td className="border border-border/40 px-3 py-1.5">{children}</td>
      ),
      ul: ({ children }: { children?: React.ReactNode }) => (
        <ul className="list-disc ps-5 my-1 space-y-0.5">{children}</ul>
      ),
      ol: ({ children }: { children?: React.ReactNode }) => (
        <ol className="list-decimal ps-5 my-1 space-y-0.5">{children}</ol>
      ),
      h1: ({ children }: { children?: React.ReactNode }) => (
        <h1 className="text-lg font-bold my-2">{children}</h1>
      ),
      h2: ({ children }: { children?: React.ReactNode }) => (
        <h2 className="text-base font-bold my-2">{children}</h2>
      ),
      h3: ({ children }: { children?: React.ReactNode }) => (
        <h3 className="text-sm font-semibold my-1.5">{children}</h3>
      ),
      blockquote: ({ children }: { children?: React.ReactNode }) => (
        <blockquote className="border-s-2 border-primary/30 ps-3 italic text-muted-foreground my-2">
          {children}
        </blockquote>
      ),
      code: ({ children }: { children?: React.ReactNode }) => (
        <code className="bg-muted/50 rounded px-1 py-0.5 text-xs font-mono">{children}</code>
      ),
      pre: ({ children }: { children?: React.ReactNode }) => (
        <pre className="bg-muted/50 rounded-lg p-3 overflow-x-auto my-2 text-xs font-mono">
          {children}
        </pre>
      ),
    }),
    [],
  );

  if (!value || !value.trim()) {
    return <span className="text-sm">—</span>;
  }

  return (
    <div className={`max-w-full text-sm break-words text-muted-foreground ${className ?? ""}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {value}
      </ReactMarkdown>
    </div>
  );
});
