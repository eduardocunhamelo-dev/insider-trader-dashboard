import React from "react";

/**
 * Plan badge helper — maps category number to pill badge component.
 * category 1 = PRO (blue)
 * category 2 = FAST (green)
 * category 3 = TRIAL (amber)
 * category 4 = FUTURE / Futuros (purple)
 * category 0 / other = default (gray)
 */

export interface PlanBadgeConfig {
  label: string;
  dotColor: string;
  className: string;
}

export function getPlanBadgeConfig(category?: number | null): PlanBadgeConfig {
  switch (category) {
    case 1:
      return { label: "PRO", dotColor: "#4B9FFF", className: "badge-plan badge-plan-pro" };
    case 2:
      return { label: "FAST", dotColor: "#16C784", className: "badge-plan badge-plan-fast" };
    case 3:
      return { label: "TRIAL", dotColor: "#F0B90B", className: "badge-plan badge-plan-trial" };
    case 4:
      return { label: "FUTUROS", dotColor: "#A855F7", className: "badge-plan badge-plan-future" };
    default:
      return { label: "—", dotColor: "#8A929E", className: "badge-plan badge-plan-default" };
  }
}

interface PlanBadgeProps {
  category?: number | null;
  className?: string;
}

export function PlanBadge({ category, className = "" }: PlanBadgeProps) {
  const config = getPlanBadgeConfig(category);
  if (category === undefined || category === null || category === 0) return null;
  return (
    <span className={`${config.className} ${className}`}>
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: config.dotColor,
          display: "inline-block",
          flexShrink: 0,
        }}
      />
      {config.label}
    </span>
  );
}
