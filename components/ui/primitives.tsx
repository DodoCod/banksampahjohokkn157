import { cn } from "@/lib/utils";
import { Loader2, PackageSearch } from "lucide-react";
import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  LabelHTMLAttributes,
  SelectHTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "bg-surface border border-line rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.04)]",
        className
      )}
      {...props}
    />
  );
}

export function CardStat({
  label,
  value,
  accent = "primary",
}: {
  label: string;
  value: string;
  accent?: "primary" | "amber" | "danger";
}) {
  const dot = { primary: "bg-primary", amber: "bg-amber-600", danger: "bg-danger" }[accent];
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-xs text-ink-soft mb-2">
        <span className={cn("w-1.5 h-1.5 rounded-full", dot)} />
        {label}
      </div>
      <div className="font-display text-2xl font-semibold tracking-tight">{value}</div>
    </Card>
  );
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
  loading?: boolean;
}) {
  const variants = {
    primary: "bg-primary text-white hover:bg-primary-hover disabled:opacity-60",
    secondary: "bg-surface border border-line text-ink hover:bg-primary-soft",
    ghost: "text-ink-soft hover:bg-primary-soft",
    danger: "bg-danger text-white hover:bg-danger-hover disabled:opacity-60",
  };
  const sizes = { sm: "px-2.5 py-1.5 text-xs", md: "px-4 py-2 text-sm" };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 size={14} className="animate-spin-slow" />}
      {children}
    </button>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-ink-soft/50",
        className
      )}
      {...props}
    />
  );
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("block text-xs font-medium text-ink-soft mb-1", className)} {...props} />;
}

export function Badge({
  children,
  tone = "primary",
}: {
  children: React.ReactNode;
  tone?: "primary" | "amber" | "danger";
}) {
  const tones = {
    primary: "bg-primary-soft text-primary-ink",
    amber: "bg-amber-100 text-amber-600",
    danger: "bg-danger-soft text-danger",
  };
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", tones[tone])}>
      {children}
    </span>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="text-sm text-ink-soft mt-1">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <Card className="p-10 flex flex-col items-center text-center">
      <div className="w-12 h-12 rounded-full bg-bg flex items-center justify-center mb-3">
        <PackageSearch size={20} className="text-ink-soft" strokeWidth={1.75} />
      </div>
      <p className="font-display text-base font-medium">{title}</p>
      {description && <p className="text-sm text-ink-soft mt-1">{description}</p>}
    </Card>
  );
}

export function Table({ className, ...props }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-surface">
      <table className={cn("w-full text-sm", className)} {...props} />
    </div>
  );
}

export function Th({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "text-left font-medium text-ink-soft text-xs uppercase tracking-wide px-4 py-2.5 border-b border-line",
        className
      )}
      {...props}
    />
  );
}

export function Td({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("px-4 py-2.5 border-b border-line/70", className)} {...props} />;
}
