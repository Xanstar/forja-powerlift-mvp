import Image from "next/image";
import { cn } from "@/lib/utils";

export function ForjaLogo({
  className,
  decorative = false,
  onDark = false,
}: {
  className?: string;
  decorative?: boolean;
  onDark?: boolean;
}) {
  return (
    <span
      className={cn("inline-flex shrink-0", className)}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : "Forja"}
    >
      {!onDark && (
        <Image
          src="/brand/forja-lockup-350.png"
          width={350}
          height={140}
          alt=""
          className="theme-logo-positive block h-auto w-full"
          loading="eager"
          unoptimized
        />
      )}
      <Image
        src="/brand/forja-lockup-negative-350.png"
        width={350}
        height={140}
        alt=""
        className={cn("block h-auto w-full", !onDark && "theme-logo-negative")}
        loading="eager"
        unoptimized
      />
    </span>
  );
}
