import { cn } from "@/lib/utils";

type AvatarProps = {
  name: string;
  src?: string;
  className?: string;
};

export function Avatar({ name, src, className }: AvatarProps) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn(
          "size-9 rounded-full object-cover",
          className,
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary",
        className,
      )}
    >
      {initials}
    </div>
  );
}
