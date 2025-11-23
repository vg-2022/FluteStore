import type { SVGProps } from "react";

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <title>FluteStore Logo</title>
      <path d="M20.5 4.5a2 2 0 0 0-2-2h-13a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2Z" />
      <path d="M4.5 4.5v-2" />
      <path d="M19.5 4.5v-2" />
      <path d="M8 12h8" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="8" cy="16" r=".5" fill="currentColor" />
      <circle cx="12" cy="8" r=".5" fill="currentColor" />
      <circle cx="16" cy="16" r=".5" fill="currentColor" />
    </svg>
  );
}
