import { Editor } from "@/components/ui/editor";

interface MarkdownDisplayProps {
  value: string;
  className?: string;
}

export function MarkdownDisplay({ value, className }: MarkdownDisplayProps) {
  if (!value || !value.trim()) {
    return <span className="text-sm">—</span>;
  }

  return (
    <div className={className}>
      <Editor
        value={value}
        format="markdown"
        enableImages={true}
        disabled={true}
        showToolbar={false}
        editorClassName="min-h-0 border-0 shadow-none p-0 bg-transparent focus-visible:ring-0 focus-visible:border-0"
        onChange={() => {}}
      />
    </div>
  );
}
