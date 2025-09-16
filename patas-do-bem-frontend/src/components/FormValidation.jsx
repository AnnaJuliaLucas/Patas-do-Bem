import { useState, useEffect } from 'react'
import { CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'

// Validation rules
const validationRules = {
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Email deve ter formato válido'
  },
  phone: {
    pattern: /^\(\d{2}\)\s\d{4,5}-\d{4}$/,
    message: 'Telefone deve ter formato (11) 99999-9999'
  },
  cpf: {
    pattern: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
    message: 'CPF deve ter formato 000.000.000-00'
  },
  currency: {
    pattern: /^\d+(\.\d{2})?$/,
    message: 'Valor deve ter formato 00.00'
  },
  required: {
    pattern: /.+/,
    message: 'Campo obrigatório'
  }
}

// Mask functions
const masks = {
  phone: (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4,5})(\d{4})/, '$1-$2')
      .substring(0, 15)
  },
  cpf: (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .substring(0, 14)
  },
  currency: (value) => {
    let numericValue = value.replace(/\D/g, '')
    if (numericValue.length === 0) return ''
    
    // Add decimal point
    if (numericValue.length <= 2) {
      numericValue = '0.' + numericValue.padStart(2, '0')
    } else {
      const integerPart = numericValue.slice(0, -2)
      const decimalPart = numericValue.slice(-2)
      numericValue = integerPart + '.' + decimalPart
    }
    
    return numericValue
  }
}

// CPF validation
const validateCPF = (cpf) => {
  cpf = cpf.replace(/\D/g, '')
  
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
    return false
  }
  
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf[i]) * (10 - i)
  }
  let checkDigit = 11 - (sum % 11)
  if (checkDigit >= 10) checkDigit = 0
  if (parseInt(cpf[9]) !== checkDigit) return false
  
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf[i]) * (11 - i)
  }
  checkDigit = 11 - (sum % 11)
  if (checkDigit >= 10) checkDigit = 0
  
  return parseInt(cpf[10]) === checkDigit
}

export function ValidatedInput({
  id,
  label,
  type = 'text',
  value,
  onChange,
  onValidation,
  required = false,
  mask = null,
  validation = [],
  placeholder = '',
  className = '',
  ...props
}) {
  const [isValid, setIsValid] = useState(true)
  const [errors, setErrors] = useState([])
  const [touched, setTouched] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Apply mask if specified
  const handleInputChange = (e) => {
    let inputValue = e.target.value
    
    if (mask && masks[mask]) {
      inputValue = masks[mask](inputValue)
    }
    
    onChange({ ...e, target: { ...e.target, value: inputValue } })
  }

  // Validate input
  const validateInput = (inputValue) => {
    const validationErrors = []
    
    // Required validation
    if (required && (!inputValue || inputValue.trim() === '')) {
      validationErrors.push('Campo obrigatório')
    }
    
    // Skip other validations if empty and not required
    if (!inputValue || inputValue.trim() === '') {
      if (!required) {
        setErrors([])
        setIsValid(true)
        onValidation?.(true, [])
        return
      }
    } else {
      // Apply validation rules
      validation.forEach(rule => {
        if (validationRules[rule] && !validationRules[rule].pattern.test(inputValue)) {
          validationErrors.push(validationRules[rule].message)
        }
      })
      
      // Special CPF validation
      if (mask === 'cpf' && inputValue.length === 14) {
        if (!validateCPF(inputValue)) {
          validationErrors.push('CPF inválido')
        }
      }
    }
    
    const valid = validationErrors.length === 0
    setErrors(validationErrors)
    setIsValid(valid)
    onValidation?.(valid, validationErrors)
  }

  // Validate on value change (real-time)
  useEffect(() => {
    if (touched) {
      validateInput(value)
    }
  }, [value, touched])

  const handleBlur = () => {
    setTouched(true)
    validateInput(value)
  }

  const inputType = type === 'password' && showPassword ? 'text' : type

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="flex items-center space-x-1">
        <span>{label}</span>
        {required && <span className="text-red-500">*</span>}
      </Label>
      
      <div className="relative">
        <Input
          id={id}
          type={inputType}
          value={value}
          onChange={handleInputChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={`
            ${className}
            ${touched && !isValid ? 'border-red-500 focus:border-red-500' : ''}
            ${touched && isValid && value ? 'border-green-500 focus:border-green-500' : ''}
            ${type === 'password' ? 'pr-10' : ''}
          `}
          {...props}
        />
        
        {/* Password toggle */}
        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
        
        {/* Validation icon */}
        {touched && value && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {isValid ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-500" />
            )}
          </div>
        )}
      </div>
      
      {/* Error messages */}
      {touched && errors.length > 0 && (
        <div className="space-y-1">
          {errors.map((error, index) => (
            <Alert key={index} className="border-red-200 bg-red-50 py-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800 text-sm">
                {error}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}
      
      {/* Success message */}
      {touched && isValid && value && (
        <div className="text-sm text-green-600 flex items-center space-x-1">
          <CheckCircle className="h-3 w-3" />
          <span>Válido</span>
        </div>
      )}
    </div>
  )
}

// Form validation hook
export function useFormValidation(initialState = {}) {
  const [values, setValues] = useState(initialState)
  const [validations, setValidations] = useState({})
  const [isFormValid, setIsFormValid] = useState(false)

  const setValue = (name, value) => {
    setValues(prev => ({ ...prev, [name]: value }))
  }

  const setValidation = (name, isValid, errors) => {
    setValidations(prev => ({
      ...prev,
      [name]: { isValid, errors }
    }))
  }

  useEffect(() => {
    const allFieldsValid = Object.values(validations).every(validation => validation.isValid)
    const hasValidations = Object.keys(validations).length > 0
    setIsFormValid(hasValidations && allFieldsValid)
  }, [validations])

  const reset = () => {
    setValues(initialState)
    setValidations({})
    setIsFormValid(false)
  }

  return {
    values,
    validations,
    isFormValid,
    setValue,
    setValidation,
    reset
  }
}