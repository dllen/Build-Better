import { avatarFor } from "@/lib/avatar";

export function Avatar({ email, size = 28 }: { email: string | null; size?: number }) {
  const { bg, initials } = avatarFor(email);
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" role="img" aria-label={email ?? "avatar"}>
      <rect width="32" height="32" rx="8" fill={bg} />
      <text
        x="16"
        y="16"
        textAnchor="middle"
        dominantBaseline="central"
        fill="#ffffff"
        fontSize="16"
        fontWeight="600"
        fontFamily="system-ui, sans-serif"
      >
        {initials}
      </text>
    </svg>
  );
}
