sed -i '/import { useApp }/a import { PasswordStrengthMeter } from "./PasswordStrengthMeter";' src/components/auth/AuthModal.tsx
sed -i '/import { useApp }/a import { PasswordStrengthMeter } from "../auth/PasswordStrengthMeter";' src/components/settings/SettingsView.tsx
