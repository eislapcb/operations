// Client-safe password utilities (no server imports)

export function passwordStrength(password: string): {
  score: number;
  label: string;
} {
  const len = password.length;
  if (len < 15) return { score: 0, label: "Too short" };
  if (len < 20) return { score: 1, label: "Fair" };
  if (len < 30) return { score: 2, label: "Good" };
  if (len < 40) return { score: 3, label: "Strong" };
  return { score: 4, label: "Very strong" };
}
