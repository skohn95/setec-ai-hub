import { PasswordResetForm, AuthHeader } from '@/components/auth'

export default function RecuperarPasswordPage() {
  return (
    <div className="space-y-8">
      <AuthHeader title="Recuperar contraseña" />
      <PasswordResetForm />
    </div>
  )
}
