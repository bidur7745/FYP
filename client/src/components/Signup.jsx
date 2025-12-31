import  { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { registerUser, verifyRegistrationOtp } from '../services/api'

    const [verificationCode, setVerificationCode] = useState('')
    const [status, setStatus] = useState({ type: '', message: '' })
    const [loading, setLoading] = useState(false)
    const { content } = useLanguage()
    const copy = content.auth?.signup || {}

    const handleInputChange = (event) => {
        const { name, value } = event.target
        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    const handleSubmitForm = async (event) => {
        event.preventDefault()
        setStatus({ type: '', message: '' })
        if (formData.password !== formData.confirmPassword) {
            setStatus({ type: 'error', message: 'Passwords do not match' })
            return
        }
        setLoading(true)
        try {
            await registerUser({
                name: formData.fullName,
                email: formData.email,
                password: formData.password,
            })
            setStatus({ type: 'success', message: 'Account created. Check your email for OTP.' })
            setStep('verify')
        } catch (error) {
            setStatus({ type: 'error', message: error.message })
        } finally {
            setLoading(false)
        }
    }

    const handleVerificationSubmit = async (event) => {
        event.preventDefault()
        setStatus({ type: '', message: '' })
        setLoading(true)
        try {
            await verifyRegistrationOtp({ email: formData.email, otp: verificationCode })
            setStatus({ type: 'success', message: 'Email verified. Please login.' })
            setStep('login')
        } catch (error) {
            setStatus({ type: 'error', message: error.message })
        } finally {
            setLoading(false)
        }
    }

    const renderSignupForm = () => (
        <form onSubmit={handleSubmitForm} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {copy.fullNameLabel || 'Full Name'}
                </label>
                <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="Krishi Mitra"
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition"
                    required
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {copy.emailLabel || 'Gmail'}
                </label>
                <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="farmer@example.com"
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition"
                    required
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {copy.passwordLabel || 'Password'}
                </label>
                <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition"
                    required
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {copy.confirmPasswordLabel || 'Confirm Password'}
                </label>
                <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition"
                    required
                />
            </div>
            <div className="space-y-3 pt-2">
                <button
                    type="submit"
                    className="w-full py-3 bg-linear-to-r from-emerald-500 to-green-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-xl transition"
                    disabled={loading}
                >
                    {loading ? 'Creating…' : copy.continueButton || 'Continue to Verification'}
                </button>
                <p className="text-center text-sm text-gray-500">
                    {copy.alreadyAccount || 'Already have an account?'}{' '}
                    <Link to="/login" className="text-emerald-600 font-semibold hover:underline">
                        {copy.loginLink || 'Login'}
                    </Link>
                </p>
            </div>
        </form>
    )

    const renderVerificationForm = () => (
        <form onSubmit={handleVerificationSubmit} className="space-y-4">
            <p className="text-gray-600 text-sm">
                {copy.verifyIntroPrefix || 'We sent a 6-digit verification code to'}{' '}
                <strong>{formData.email || 'your email'}</strong>.{' '}
                {copy.verifyIntroSuffix || 'Enter it below to activate your KrishiMitra account.'}
            </p>
            <div className="flex items-center justify-between gap-2">
                <input
                    type="text"
                    name="verificationCode"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(event) => setVerificationCode(event.target.value)}
                    placeholder="123456"
                    className="w-full px-4 py-3 text-center text-lg tracking-[0.5em] font-semibold rounded-2xl border border-emerald-200 focus:ring-4 focus:ring-emerald-100 outline-none uppercase"
                    required
                />
            </div>
            <button
                type="submit"
                className="w-full py-3 bg-linear-to-r from-emerald-500 to-green-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-xl transition"
                disabled={loading}
            >
                {loading ? 'Verifying…' : copy.verifyButton || 'Verify & Go to Login'}
            </button>
            <button
                type="button"
                onClick={() => setStep('form')}
                className="w-full py-2 text-sm text-emerald-700 font-semibold hover:text-emerald-500 transition"
            >
                {copy.editDetails || 'Edit account details'}
            </button>
        </form>
    )

    const renderNextStepCard = () => (
        <div className="space-y-4 text-center">
                <div className="bg-emerald-50 text-emerald-700 rounded-2xl p-4">
                    {copy.successMessage ||
                        'Signed up successfully. Complete your first login to enter the farmer dashboard.'}
                </div>
            <Link
                to="/login"
                className="inline-flex items-center justify-center px-6 py-3 bg-emerald-600 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition"
            >
                {copy.successCta || 'Proceed to Login'}
            </Link>
        </div>
    )

    return (
        <section className="max-w-md w-full mx-auto bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-emerald-50 p-8">
            <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-[0.5em] text-emerald-400">
                    {copy.tagline || 'Join KrishiMitra'}
                </p>
                <h2 className="text-3xl font-semibold text-emerald-900 mt-2">
                    {copy.title || 'Signup'}
                </h2>
                <p className="text-gray-600 text-sm">
                    {copy.subtitle || 'Create an account to receive localized advisory, alerts, and market insights.'}
                </p>
                {status.message && (
                    <div
                        className={`mt-4 rounded-lg px-3 py-2 text-sm ${
                            status.type === 'error'
                                ? 'bg-red-50 text-red-700 border border-red-100'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        }`}
                    >
                        {status.message}
                    </div>
                )}
            </div>
            {step === 'form' && renderSignupForm()}
            {step === 'verify' && renderVerificationForm()}
            {step === 'login' && renderNextStepCard()}
        </section>
    )


export default Signup
