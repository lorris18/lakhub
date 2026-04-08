import { PublicHeader } from "@/components/public/public-header";

export default function PublicLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface-base">
      <PublicHeader />
      {children}
    </div>
  );
}

