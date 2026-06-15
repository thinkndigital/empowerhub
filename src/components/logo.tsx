import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <svg
      className={cn("h-8 w-auto", className)}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g clipPath="url(#clip0_303_3)">
        <path
          d="M31.6667 0H8.33333C3.75 0 0 3.75 0 8.33333V31.6667C0 36.25 3.75 40 8.33333 40H31.6667C36.25 40 40 36.25 40 31.6667V8.33333C40 3.75 36.25 0 31.6667 0Z"
          fill="hsl(var(--primary))"
        />
        <path
          d="M11.666 11.666V28.3327H15.6247V21.416H24.3747V28.3327H28.3333V11.666H24.3747V18.5827H15.6247V11.666H11.666Z"
          fill="hsl(var(--primary-foreground))"
        />
      </g>
      <defs>
        <clipPath id="clip0_303_3">
          <rect width="40" height="40" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}
