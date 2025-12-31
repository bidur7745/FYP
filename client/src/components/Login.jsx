import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'


const Login = () => {
    const [stage, setStage] = useState('login')
    const [loginData, setLoginData] = useState({ email: '', password: '' })
    const [resetEmail, setResetEmail] = useState('')
    const [resetCode, setResetCode] = useState('')
    const [newPassword, setNewPassword] = useState({ password: '', confirm: '' })
    const [status, setStatus] = useState({ type: '', message: '' })
    const [loading, setLoading] = useState(false)
    const { content } = useLanguage()
    const navigate = useNavigate()
    const copy = content.auth?.login || {}

    const handleLoginSubmit = async (event) => {
        event.preventDefault()
        setStatus({ type: '', message: '' })
        setLoading(true)
        try {
            const response = await loginUser(loginData)
            const { token, data } = response
            localStorage.setItem('authToken', token)
            localStorage.setItem('userRole', data?.role)
            setStatus({ type: 'success', message: 'Login successful' })

            const destination = `/dashboard/${data?.role || 'user'}`
            navigate(destination, { replace: true })
        } catch (error) {
            setStatus({ type: 'error', message: error.message })
        } finally {
            setLoading(false)
        }
    }

    const handleForgotEmailSubmit = async (event) => {
        event.preventDefault()
        setStatus({ type: '', message: '' })
        setLoading(true)
        try {
            await requestPasswordReset({ email: resetEmail })
            setStatus({ type: 'success', message: 'OTP sent to your email if it exists' })
            setStage('forgotCode')
        } catch (error) {
            setStatus({ type: 'error', message: error.message })
        } finally {
            setLoading(false)
        }
    }

    const handleForgotCodeSubmit = async (event) => {
        event.preventDefault()
        setStatus({ type: '', message: '' })
        setLoading(true)
        try {
            await verifyPasswordResetOtp({ email: resetEmail, otp: resetCode })
            setStatus({ type: 'success', message: 'OTP verified, set a new password' })
            setStage('forgotReset')
        } catch (error) {
            setStatus({ type: 'error', message: error.message })
        } finally {
            setLoading(false)
        }
    }

    const handleResetSubmit = async (event) => {
        event.preventDefault()
        setStatus({ type: '', message: '' })
        if (newPassword.password !== newPassword.confirm) {
            setStatus({ type: 'error', message: 'Passwords do not match' })
            return
        }
        setLoading(true)
        try {
            await resetPassword({ email: resetEmail, otp: resetCode, newPassword: newPassword.password })
            setStatus({ type: 'success', message: 'Password reset, please login' })
            setStage('login')
        } catch (error) {
            setStatus({ type: 'error', message: error.message })
        } finally {
            setLoading(false)
        }
    }

    const renderLogin = () => (
        <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {copy.emailLabel || 'Gmail'}
                </label>
                <input
                    type="email"
                    value={loginData.email}
                    onChange={(event) => setLoginData((prev) => ({ ...prev, email: event.target.value }))}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition"
                    placeholder="farmer@example.com"
                    required
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {copy.passwordLabel || 'Password'}
                </label>
                <input
                    type="password"
                    value={loginData.password}
                    onChange={(event) => setLoginData((prev) => ({ ...prev, password: event.target.value }))}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition"
                    placeholder="••••••••"
                    required
                />
            </div>
            <div className="space-y-3">
                <button
                    type="submit"
                    className="w-full py-3 bg-linear-to-r from-emerald-500 to-green-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-xl transition"
                    disabled={loading}
                >
                    {loading ? 'Please wait…' : copy.loginButton || 'Login'}
                </button>
                <button
                    type="button"
                    onClick={() => setStage('forgotEmail')}
                    className="w-full text-sm font-semibold text-emerald-700 hover:text-emerald-500 transition"
                    disabled={loading}
                >
                    {copy.forgotPassword || 'Forgot Password?'}
                </button>
                <p className="text-center text-sm text-gray-500">
                    {copy.newHere || 'New to KrishiMitra?'}{' '}
                    <Link to="/signup" className="text-emerald-600 font-semibold hover:underline">
                        {copy.createAccount || 'Create account'}
                    </Link>
                </p>
            </div>
        </form>
    )

    const renderForgotEmail = () => (
        <form onSubmit={handleForgotEmailSubmit} className="space-y-4">
            <p className="text-sm text-gray-600">
                {copy.forgotEmailIntro ||
                    "Enter the Gmail you registered with. We’ll send a verification code to reset your password."}
            </p>
            <input
                type="email"
                value={resetEmail}
                onChange={(event) => setResetEmail(event.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition"
                placeholder="farmer@example.com"
                required
            />
            <button
                type="submit"
                className="w-full py-3 bg-linear-to-r from-emerald-500 to-green-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-xl transition"
                disabled={loading}
            >
                {loading ? 'Sending…' : copy.sendCode || 'Send Verification Code'}
            </button>
            <button type="button" className="text-sm text-gray-500" onClick={() => setStage('login')}>
                {copy.backToLogin || 'Back to login'}
            </button>
        </form>
    )

    const renderForgotCode = () => (
        <form onSubmit={handleForgotCodeSubmit} className="space-y-4">
            <p className="text-sm text-gray-600">
                {copy.codeIntroPrefix || 'Enter the 6-digit code sent to'}{' '}
                <strong>{resetEmail || 'your Gmail'}</strong>
                {copy.codeIntroSuffix || '.'}
            </p>
            <input
                type="text"
                value={resetCode}
                maxLength={6}
                onChange={(event) => setResetCode(event.target.value)}
                className="w-full px-4 py-3 text-center tracking-[0.5em] text-lg font-semibold rounded-2xl border border-emerald-200 focus:ring-4 focus:ring-emerald-100 outline-none uppercase"
                placeholder="123456"
                required
            />
            <button
                type="submit"
                className="w-full py-3 bg-linear-to-r from-emerald-500 to-green-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-xl transition"
                disabled={loading}
            >
                {loading ? 'Verifying…' : copy.verifyCodeButton || 'Verify Code'}
            </button>
        </form>
    )

    const renderForgotReset = () => (
        <form onSubmit={handleResetSubmit} className="space-y-4">
            <p className="text-sm text-gray-600">
                {copy.resetIntro || 'Create a new password to regain access to your account.'}
            </p>
            <input
                type="password"
                value={newPassword.password}
                onChange={(event) => setNewPassword((prev) => ({ ...prev, password: event.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition"
                placeholder="New password"
                required
            />
            <input
                type="password"
                value={newPassword.confirm}
                onChange={(event) => setNewPassword((prev) => ({ ...prev, confirm: event.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition"
                placeholder="Confirm new password"
                required
            />
            <button
                type="submit"
                className="w-full py-3 bg-linear-to-r from-emerald-500 to-green-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-xl transition"
                disabled={loading}
            >
                {loading ? 'Saving…' : copy.savePasswordButton || 'Save Password & Login'}
            </button>
        </form>
    )

    return (
        <section className="max-w-md w-full mx-auto bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-emerald-50 p-8">
            <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-[0.5em] text-emerald-400">
                    {stage.startsWith('forgot')
                        ? copy.recoveryTagline || 'Account Recovery'
                        : copy.welcomeTagline || 'Welcome Back'}
                </p>
                <h2 className="text-3xl font-semibold text-emerald-900 mt-2">
                    {stage.startsWith('forgot') ? copy.recoveryTitle || 'Reset Access' : copy.title || 'Login'}
                </h2>
                <p className="text-gray-600 text-sm">
                    {stage.startsWith('forgot')
                        ? copy.recoverySubtitle || 'We’ll help you verify ownership and set a fresh password in a few guided steps.'
                        : copy.subtitle || 'Access personalized advisory, alerts, and dashboards tailored for Nepalese farmers.'}
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

            {stage === 'login' && renderLogin()}
            {stage === 'forgotEmail' && renderForgotEmail()}
            {stage === 'forgotCode' && renderForgotCode()}
            {stage === 'forgotReset' && renderForgotReset()}
        </section>
    )
}

export default Login
