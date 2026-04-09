import { ThemeToggle } from "@/components/layout/theme-toggle";

export default function PublicLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface-base">
      <header className="border-b border-border-subtle bg-surface-base/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <span className="font-display text-2xl text-brand-primary">LAKHub</span>
          <ThemeToggle />
        </div>
      </header>
      {children}
    </div>
  );
}
