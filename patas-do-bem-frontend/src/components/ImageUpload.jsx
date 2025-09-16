import { useState, useRef } from 'react'
import { Upload, X, Image, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

export function ImageUpload({ onImageUploaded, currentImage = null, maxSizeMB = 5 }) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(currentImage)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  const validateFile = (file) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    const maxSize = maxSizeMB * 1024 * 1024

    if (!allowedTypes.includes(file.type)) {
      return 'Apenas imagens JPG, PNG ou WEBP são permitidas'
    }

    if (file.size > maxSize) {
      return `Arquivo muito grande. Máximo ${maxSizeMB}MB permitido`
    }

    return null
  }

  const handleFileSelect = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setError('')
    
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setUploading(true)

    try {
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => setPreview(e.target.result)
      reader.readAsDataURL(file)

      // Upload file
      const formData = new FormData()
      formData.append('image', file)

      const response = await fetch('/api/upload/raffle-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: formData
      })

      const result = await response.json()

      if (response.ok) {
        onImageUploaded(result.image_url, result.thumbnail_url)
      } else {
        setError(result.error || 'Erro ao fazer upload da imagem')
        setPreview(currentImage)
      }
    } catch (error) {
      setError('Erro ao conectar com o servidor')
      setPreview(currentImage)
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveImage = () => {
    setPreview(null)
    setError('')
    onImageUploaded(null, null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      // Simulate file input change
      const event = { target: { files: [file] } }
      handleFileSelect(event)
    }
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <Card>
        <CardContent className="p-6">
          {preview ? (
            <div className="relative">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-48 object-cover rounded-lg"
              />
              <div className="absolute top-2 right-2 flex space-x-2">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleRemoveImage}
                  disabled={uploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {uploading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                  <div className="text-white text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                    <p>Fazendo upload...</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-orange-400 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <div className="space-y-2">
                <p className="text-lg font-medium text-gray-900">
                  Clique ou arraste uma imagem
                </p>
                <p className="text-sm text-gray-500">
                  JPG, PNG ou WEBP até {maxSizeMB}MB
                </p>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Success Message */}
      {preview && !uploading && !error && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Imagem carregada com sucesso!
          </AlertDescription>
        </Alert>
      )}

      {/* Upload Guidelines */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>• Recomendamos imagens em alta resolução (mínimo 800x600px)</p>
        <p>• Formatos aceitos: JPG, PNG, WEBP</p>
        <p>• Tamanho máximo: {maxSizeMB}MB</p>
        <p>• A imagem será automaticamente otimizada e redimensionada</p>
      </div>
    </div>
  )
}