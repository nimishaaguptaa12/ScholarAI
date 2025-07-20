import type { SVGProps } from "react";

export function AppLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M15.5 6.5a1.5 1.5 0 0 0-3 0V11a1.5 1.5 0 0 0 1.5 1.5h.75" />
      <path d="M12.5 9.5h-1a1.5 1.5 0 0 0-1.5 1.5V16a1.5 1.5 0 0 0 1.5 1.5h1" />
      <path d="M8.5 6.5a1.5 1.5 0 0 1 3 0V11a1.5 1.5 0 0 1-1.5 1.5h-.75" />
      <path d="M5 12a7 7 0 1 0 14 0 7 7 0 0 0-14 0z" />
      <path d="M12 21a9 9 0 0 0 0-18" />
    </svg>
  );
}
