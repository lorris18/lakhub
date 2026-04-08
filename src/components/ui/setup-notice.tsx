import { AlertTriangle } from "lucide-react";

import { Surface } from "@/components/ui/surface";

type Props = {
  title?: string;
  description: string;
};

export function SetupNotice({
  title = "Configuration requise",
  description
}: Props) {
  return (
    <Surface className="border-brand-accent/20 bg-brand-accent-soft/50">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-brand-accent px-2 py-2 text-white">
          <AlertTriangle className="h-4 w-4" />
        </div>
        <div className="space-y-1">
          <h3 className="font-semibold text-brand-primary">{title}</h3>
          <p className="text-sm text-text-secondary">{description}</p>
        </div>
      </div>
    </Surface>
  );
}
