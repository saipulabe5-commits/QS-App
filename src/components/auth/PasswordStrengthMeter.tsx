import React from 'react';

export const PasswordStrengthMeter: React.FC<{ password: string }> = ({ password }) => {
  const evaluateStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 10) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[a-z]/.test(pass)) score += 1;
    if (/\d/.test(pass)) score += 1;
    if (/[@$!%*?&_\-.,]/.test(pass)) score += 1;
    return score;
  };

  const score = evaluateStrength(password);
  
  let strengthLabel = 'Sangat Lemah';
  let barColors = ['bg-slate-200 dark:bg-slate-700', 'bg-slate-200 dark:bg-slate-700', 'bg-slate-200 dark:bg-slate-700', 'bg-slate-200 dark:bg-slate-700'];
  
  if (password.length === 0) {
    strengthLabel = 'Belum diisi';
  } else if (score <= 2) {
    strengthLabel = 'Lemah';
    barColors = ['bg-rose-500', 'bg-slate-200 dark:bg-slate-700', 'bg-slate-200 dark:bg-slate-700', 'bg-slate-200 dark:bg-slate-700'];
  } else if (score === 3 || score === 4) {
    strengthLabel = 'Sedang';
    barColors = ['bg-amber-400', 'bg-amber-400', 'bg-slate-200 dark:bg-slate-700', 'bg-slate-200 dark:bg-slate-700'];
  } else if (score === 5) {
    strengthLabel = 'Kuat';
    barColors = ['bg-emerald-500', 'bg-emerald-500', 'bg-emerald-500', 'bg-emerald-500'];
  }

  return (
    <div className="mt-2 flex flex-col gap-1.5">
      <div className="flex gap-1 h-1.5 w-full">
        <div className={`flex-1 rounded-full ${barColors[0]} transition-colors duration-300`} />
        <div className={`flex-1 rounded-full ${barColors[1]} transition-colors duration-300`} />
        <div className={`flex-1 rounded-full ${barColors[2]} transition-colors duration-300`} />
        <div className={`flex-1 rounded-full ${barColors[3]} transition-colors duration-300`} />
      </div>
      <p className="text-[10px] text-right text-slate-500 dark:text-slate-400">
        Kekuatan: <span className="font-semibold">{strengthLabel}</span>
      </p>
    </div>
  );
};
