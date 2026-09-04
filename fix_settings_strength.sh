sed -i '/{showNewPass ? <EyeOff className="w-4 h-4" \/> : <Eye className="w-4 h-4" \/>}/!b;n;n;a \
              <PasswordStrengthMeter password={newPassword} />' src/components/settings/SettingsView.tsx
