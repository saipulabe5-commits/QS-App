sed -i '/{errors.newPassword/i \
              <PasswordStrengthMeter password={newPassword} />' src/components/auth/AuthModal.tsx
