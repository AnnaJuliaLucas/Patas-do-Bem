import { useState } from 'react'
import { Mail, Phone, MapPin, MessageCircle, Instagram, Facebook, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'

export function Contato() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      if (!formData.name || !formData.email || !formData.message) {
        setMessage('Por favor, preencha nome, email e mensagem')
        return
      }

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (response.ok) {
        setMessage('Mensagem enviada com sucesso! Entraremos em contato em breve.')
        setFormData({
          name: '',
          email: '',
          phone: '',
          subject: '',
          message: ''
        })
      } else {
        setMessage(result.error || 'Erro ao enviar mensagem')
      }
    } catch (error) {
      setMessage('Erro ao conectar com o servidor')
    } finally {
      setLoading(false)
    }
  }

  const contactInfo = [
    {
      icon: Mail,
      title: 'Email',
      value: 'contato@patasdobem.org.br',
      link: 'mailto:contato@patasdobem.org.br'
    },
    {
      icon: Phone,
      title: 'Telefone',
      value: '(32) 99999-9999',
      link: 'tel:+5532999999999'
    },
    {
      icon: MapPin,
      title: 'Localização',
      value: 'Santos Dumont, MG',
      link: null
    },
    {
      icon: MessageCircle,
      title: 'WhatsApp',
      value: 'Fale conosco',
      link: 'https://wa.me/5532999999999'
    }
  ]

  const socialLinks = [
    {
      icon: Instagram,
      name: 'Instagram',
      url: 'https://instagram.com/patasdobem',
      color: 'text-pink-600'
    },
    {
      icon: Facebook,
      name: 'Facebook',
      url: 'https://facebook.com/patasdobem',
      color: 'text-blue-600'
    },
    {
      icon: MessageCircle,
      name: 'WhatsApp',
      url: 'https://wa.me/5532999999999',
      color: 'text-green-600'
    }
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
          Entre em Contato
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Tem dúvidas, sugestões ou quer saber como ajudar? 
          Estamos aqui para conversar com você!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Formulário de Contato */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Envie uma Mensagem</CardTitle>
              <CardDescription>
                Preencha o formulário abaixo e responderemos o mais breve possível
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact-name">Nome Completo *</Label>
                    <Input
                      id="contact-name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Seu nome completo"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contact-email">Email *</Label>
                    <Input
                      id="contact-email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="seu@email.com"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact-phone">Telefone</Label>
                    <Input
                      id="contact-phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="(32) 99999-9999"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contact-subject">Assunto</Label>
                    <Input
                      id="contact-subject"
                      value={formData.subject}
                      onChange={(e) => setFormData({...formData, subject: e.target.value})}
                      placeholder="Assunto da mensagem"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact-message">Mensagem *</Label>
                  <Textarea
                    id="contact-message"
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    placeholder="Escreva sua mensagem aqui..."
                    rows={5}
                    required
                  />
                </div>

                {message && (
                  <Alert className={message.includes('sucesso') ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                    <AlertDescription className={message.includes('sucesso') ? 'text-green-800' : 'text-red-800'}>
                      {message}
                    </AlertDescription>
                  </Alert>
                )}

                <Button 
                  type="submit" 
                  className="w-full bg-orange-600 hover:bg-orange-700"
                  disabled={loading}
                >
                  {loading ? 'Enviando...' : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Enviar Mensagem
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Informações de Contato */}
        <div className="space-y-6">
          {/* Contatos Diretos */}
          <Card>
            <CardHeader>
              <CardTitle>Fale Conosco</CardTitle>
              <CardDescription>
                Entre em contato através dos nossos canais oficiais
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {contactInfo.map((contact, index) => {
                const Icon = contact.icon
                return (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="bg-orange-100 p-2 rounded-lg">
                      <Icon className="h-5 w-5 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{contact.title}</div>
                      {contact.link ? (
                        <a 
                          href={contact.link}
                          className="text-orange-600 hover:text-orange-700 transition-colors"
                          target={contact.link.startsWith('http') ? '_blank' : undefined}
                          rel={contact.link.startsWith('http') ? 'noopener noreferrer' : undefined}
                        >
                          {contact.value}
                        </a>
                      ) : (
                        <div className="text-gray-600">{contact.value}</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Redes Sociais */}
          <Card>
            <CardHeader>
              <CardTitle>Redes Sociais</CardTitle>
              <CardDescription>
                Siga-nos para acompanhar nosso trabalho
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3">
                {socialLinks.map((social, index) => {
                  const Icon = social.icon
                  return (
                    <Button
                      key={index}
                      variant="outline"
                      asChild
                      className="justify-start h-auto p-4"
                    >
                      <a 
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-3"
                      >
                        <Icon className={`h-5 w-5 ${social.color}`} />
                        <div className="text-left">
                          <div className="font-medium">{social.name}</div>
                          <div className="text-sm text-gray-500">@patasdobem</div>
                        </div>
                      </a>
                    </Button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Horário de Atendimento */}
          <Card>
            <CardHeader>
              <CardTitle>Horário de Atendimento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span>Segunda a Sexta:</span>
                <span className="font-medium">8h às 17h</span>
              </div>
              <div className="flex justify-between">
                <span>Sábados:</span>
                <span className="font-medium">8h às 12h</span>
              </div>
              <div className="flex justify-between">
                <span>Domingos:</span>
                <span className="font-medium">Emergências</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

