'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface SpecLimitsFormProps {
  detectedCount: number
  onSubmit: (limits: { lei: number; les: number }) => void
  onCancel: () => void
  isSubmitting?: boolean
}

interface FormErrors {
  lei?: string
  les?: string
}

const FORM_LABELS = {
  title: 'Límites de Especificación',
  summary: (count: number) => `Se detectó 1 variable numérica con ${count} ${count === 1 ? 'valor' : 'valores'}`,
  lei: 'Límite Inferior de Especificación (LEI)',
  les: 'Límite Superior de Especificación (LES)',
  submit: 'Iniciar Análisis',
  cancel: 'Cancelar',
}

const VALIDATION_ERRORS = {
  required: 'Este campo es requerido',
  notNumeric: 'Debe ser un valor numérico',
  leiNotLessThanLes: 'El límite inferior debe ser menor que el límite superior',
}

export default function SpecLimitsForm({
  detectedCount,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: SpecLimitsFormProps) {
  const [lei, setLei] = useState('')
  const [les, setLes] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})

  const validate = (): boolean => {
    const newErrors: FormErrors = {}

    if (!lei.trim()) {
      newErrors.lei = VALIDATION_ERRORS.required
    } else if (isNaN(parseFloat(lei))) {
      newErrors.lei = VALIDATION_ERRORS.notNumeric
    }

    if (!les.trim()) {
      newErrors.les = VALIDATION_ERRORS.required
    } else if (isNaN(parseFloat(les))) {
      newErrors.les = VALIDATION_ERRORS.notNumeric
    }

    if (!newErrors.lei && !newErrors.les) {
      if (parseFloat(lei) >= parseFloat(les)) {
        newErrors.lei = VALIDATION_ERRORS.leiNotLessThanLes
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (validate()) {
      onSubmit({ lei: parseFloat(lei), les: parseFloat(les) })
      // Clear form after successful submission
      setLei('')
      setLes('')
    }
  }

  const handleLeiChange = (value: string) => {
    setLei(value)
    if (errors.lei) {
      setErrors((prev) => ({ ...prev, lei: undefined }))
    }
  }

  const handleLesChange = (value: string) => {
    setLes(value)
    if (errors.les) {
      setErrors((prev) => ({ ...prev, les: undefined }))
    }
  }

  return (
    <div className="bg-card rounded-lg border p-4 shadow-sm max-w-md">
      <h3 className="text-lg font-semibold mb-2 text-foreground">
        {FORM_LABELS.title}
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        {FORM_LABELS.summary(detectedCount)}
      </p>

      <div className="space-y-4">
        {/* LEI Input */}
        <div className="space-y-2">
          <Label htmlFor="lei" className="text-foreground">
            {FORM_LABELS.lei}
          </Label>
          <Input
            id="lei"
            type="text"
            inputMode="decimal"
            value={lei}
            onChange={(e) => handleLeiChange(e.target.value)}
            disabled={isSubmitting}
            className={errors.lei ? 'border-red-500' : ''}
            placeholder="ej. 95"
            aria-invalid={!!errors.lei}
            aria-describedby={errors.lei ? 'lei-error' : undefined}
          />
          {errors.lei && (
            <p id="lei-error" className="text-sm text-red-500">{errors.lei}</p>
          )}
        </div>

        {/* LES Input */}
        <div className="space-y-2">
          <Label htmlFor="les" className="text-foreground">
            {FORM_LABELS.les}
          </Label>
          <Input
            id="les"
            type="text"
            inputMode="decimal"
            value={les}
            onChange={(e) => handleLesChange(e.target.value)}
            disabled={isSubmitting}
            className={errors.les ? 'border-red-500' : ''}
            placeholder="ej. 105"
            aria-invalid={!!errors.les}
            aria-describedby={errors.les ? 'les-error' : undefined}
          />
          {errors.les && (
            <p id="les-error" className="text-sm text-red-500">{errors.les}</p>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 bg-gradient-to-r from-setec-orange to-orange-500 hover:from-setec-orange/90 hover:to-orange-500/90 text-white"
          >
            {FORM_LABELS.submit}
          </Button>
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            {FORM_LABELS.cancel}
          </Button>
        </div>
      </div>
    </div>
  )
}
