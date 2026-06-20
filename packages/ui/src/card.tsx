import { type JSX, type ReactNode } from "react";

export function Card({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}): JSX.Element {
  return (
    <div className={className}>
      {children}
    </div>
  );
}