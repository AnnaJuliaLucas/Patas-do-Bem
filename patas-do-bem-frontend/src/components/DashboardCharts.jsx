import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, DollarSign, Users } from 'lucide-react'

const COLORS = ['#ea580c', '#f97316', '#fb923c', '#fdba74', '#fed7aa']

export function DashboardCharts({ dashboardData }) {
  if (!dashboardData) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-40 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // Prepare monthly donations data
  const monthlyData = dashboardData.monthly_donations?.map(item => ({
    month: new Date(item.month).toLocaleDateString('pt-BR', { month: 'short' }),
    donations: item.total_amount || 0,
    count: item.donation_count || 0
  })) || []

  // Prepare payment methods data
  const paymentMethodsData = dashboardData.payment_methods?.map(item => ({
    name: item.method === 'pix' ? 'PIX' : 
          item.method === 'boleto' ? 'Boleto' : 
          item.method === 'credit_card' ? 'Cartão' : item.method,
    value: item.count,
    amount: item.total_amount
  })) || []

  // Prepare raffles performance data
  const rafflesData = dashboardData.raffles_performance?.map(raffle => ({
    name: raffle.title.length > 15 ? raffle.title.substring(0, 15) + '...' : raffle.title,
    sold: raffle.sold_numbers,
    total: raffle.total_numbers,
    percentage: Math.round((raffle.sold_numbers / raffle.total_numbers) * 100)
  })) || []

  // Prepare donation trends data
  const donationTrends = dashboardData.donation_trends?.map(item => ({
    date: new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    amount: item.amount,
    cumulative: item.cumulative_amount
  })) || []

  const calculateTrend = (data, field) => {
    if (data.length < 2) return 0
    const recent = data[data.length - 1][field] || 0
    const previous = data[data.length - 2][field] || 0
    return previous === 0 ? 0 : ((recent - previous) / previous) * 100
  }

  const donationTrend = calculateTrend(monthlyData, 'donations')

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Monthly Donations Chart */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <span>Doações Mensais</span>
              </CardTitle>
              <CardDescription>
                Evolução das doações nos últimos meses
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-2">
                {donationTrend > 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
                <Badge className={donationTrend > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                  {donationTrend > 0 ? '+' : ''}{donationTrend.toFixed(1)}%
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `R$ ${value.toFixed(0)}`} />
              <Tooltip 
                formatter={(value, name) => [
                  `R$ ${value.toFixed(2)}`, 
                  name === 'donations' ? 'Total Arrecadado' : name
                ]}
                labelFormatter={(label) => `Mês: ${label}`}
              />
              <Area 
                type="monotone" 
                dataKey="donations" 
                stroke="#ea580c" 
                fill="#ea580c" 
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Payment Methods Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Métodos de Pagamento</CardTitle>
          <CardDescription>
            Distribuição por tipo de pagamento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={paymentMethodsData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {paymentMethodsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value} transações`, 'Quantidade']} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Raffles Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-purple-600" />
            <span>Performance das Rifas</span>
          </CardTitle>
          <CardDescription>
            Percentual de números vendidos por rifa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={rafflesData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'percentage' ? `${value}%` : value,
                  name === 'percentage' ? 'Vendido' : name === 'sold' ? 'Números Vendidos' : 'Total de Números'
                ]}
              />
              <Bar dataKey="percentage" fill="#ea580c" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Donation Trends */}
      {donationTrends.length > 0 && (
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Tendência de Doações (Últimos 30 dias)</CardTitle>
            <CardDescription>
              Valores diários e acumulativo de doações
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={donationTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={(value) => `R$ ${value.toFixed(0)}`} />
                <Tooltip 
                  formatter={(value, name) => [
                    `R$ ${value.toFixed(2)}`, 
                    name === 'amount' ? 'Doação do Dia' : 'Total Acumulado'
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#ea580c" 
                  strokeWidth={2}
                  dot={{ fill: '#ea580c' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="cumulative" 
                  stroke="#fb923c" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: '#fb923c' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats Summary */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Resumo Rápido</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {dashboardData.donations_summary?.total_donors || 0}
              </div>
              <div className="text-sm text-green-700">Total de Doadores</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                R$ {(dashboardData.donations_summary?.average_donation || 0).toFixed(2)}
              </div>
              <div className="text-sm text-blue-700">Doação Média</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {dashboardData.raffles_summary?.active_raffles || 0}
              </div>
              <div className="text-sm text-purple-700">Rifas Ativas</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {dashboardData.donations_summary?.recurring_donors || 0}
              </div>
              <div className="text-sm text-orange-700">Doadores Recorrentes</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}