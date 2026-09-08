"use client";

const rules = {
  en: {
    length: "At least 8 characters",
    upper: "One uppercase letter",
    lower: "One lowercase letter",
    number: "One number",
    special: "One special character (!@#$...)",
  },
  ar: {
    length: "٨ أحرف على الأقل",
    upper: "حرف كبير واحد",
    lower: "حرف صغير واحد",
    number: "رقم واحد",
    special: "رمز خاص واحد (!@#$...)",
  },
};

export function checkPassword(password: string) {
  return {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
}

export function isPasswordValid(password: string) {
  const checks = checkPassword(password);
  return Object.values(checks).every(Boolean);
}

export default function PasswordStrength({ password, lang = "en" }: { password: string; lang?: "en" | "ar" }) {
  const checks = checkPassword(password);
  const labels = rules[lang];
  const passed = Object.values(checks).filter(Boolean).length;
  const total = 5;

  if (!password) return null;

  const barColor = passed <= 2 ? "bg-red-400" : passed <= 3 ? "bg-amber-400" : passed <= 4 ? "bg-yellow-400" : "bg-emerald-500";

  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${i < passed ? barColor : "bg-gray-200"}`}
          />
        ))}
      </div>
      <ul className="grid grid-cols-2 gap-x-3 gap-y-1">
        {(Object.keys(checks) as Array<keyof typeof checks>).map((key) => (
          <li key={key} className={`text-[11px] flex items-center gap-1.5 transition-colors ${checks[key] ? "text-emerald-600" : "text-ink/35"}`}>
            {checks[key] ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/></svg>
            )}
            {labels[key]}
          </li>
        ))}
      </ul>
    </div>
  );
}
