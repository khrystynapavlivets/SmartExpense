import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { authApi, saveTokens } from '../api/auth'

interface FormData {
  email: string
  password: string
  confirm: string
}

export default function RegisterPage() {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const onSubmit = async (data: FormData) => {
    setError('')
    setLoading(true)
    try {
      const tokens = await authApi.register(data.email, data.password)
      saveTokens(tokens)
      navigate('/')
    } catch (e: any) {
      setError(e.response?.data?.detail ?? 'Помилка реєстрації')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 w-full max-w-sm">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">SmartExpense</h1>
        <p className="text-gray-500 text-sm mb-6">Створіть акаунт</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              {...register('email', { required: true })}
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">Введіть email</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Пароль</label>
            <input
              type="password"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              {...register('password', { required: true, minLength: 6 })}
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">Мінімум 6 символів</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Підтвердження</label>
            <input
              type="password"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              {...register('confirm', { validate: (v) => v === watch('password') || 'Паролі не збігаються' })}
            />
            {errors.confirm && <p className="text-red-500 text-xs mt-1">{errors.confirm.message}</p>}
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Реєстрація...' : 'Зареєструватись'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          Вже є акаунт?{' '}
          <Link to="/login" className="text-indigo-600 hover:underline">Увійти</Link>
        </p>
      </div>
    </div>
  )
}
