'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { login, signup } from './actions'
import { AlertTriangle } from 'lucide-react'

function LoginForm() {
    const searchParams = useSearchParams()
    const error = searchParams.get('error')
    const [isLogin, setIsLogin] = useState(true)

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background">
            <div className="w-full max-w-md space-y-8 px-4 py-8 shadow-lg rounded-lg border bg-card">
                <div className="text-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/lory-logo-full.png" alt="LORY" className="h-16 w-auto mx-auto mb-4 object-contain" />
                    <h2 className="mt-6 text-3xl font-bold tracking-tight text-foreground">
                        {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        {isLogin ? 'Bienvenido de nuevo' : 'Únete a nosotros hoy'}
                    </p>
                </div>

                {error && (
                    <div className="bg-destructive/15 border border-destructive text-destructive px-4 py-3 rounded-md flex items-center gap-2 text-sm">
                        <AlertTriangle className="h-4 w-4" />
                        <p>{error}</p>
                    </div>
                )}

                <form className="mt-8 space-y-6">
                    <div className="-space-y-px rounded-md shadow-sm">
                        <div>
                            <label htmlFor="email-address" className="sr-only">
                                Email
                            </label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="relative block w-full rounded-t-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                                placeholder="Correo electrónico"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">
                                Contraseña
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className={`relative block w-full border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3 ${isLogin ? 'rounded-b-md' : ''
                                    }`}
                                placeholder="Contraseña"
                            />
                        </div>
                        {!isLogin && (
                            <div>
                                <label htmlFor="fullName" className="sr-only">
                                    Nombre Completo
                                </label>
                                <input
                                    id="fullName"
                                    name="fullName"
                                    type="text"
                                    autoComplete="name"
                                    required={!isLogin}
                                    className="relative block w-full rounded-b-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3 mt-[-1px]"
                                    placeholder="Nombre Completo"
                                />
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-4">
                        {isLogin ? (
                            <button
                                formAction={login}
                                className="group relative flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                            >
                                Iniciar Sesión
                            </button>
                        ) : (
                            <button
                                formAction={signup}
                                className="group relative flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                            >
                                Registrarse
                            </button>
                        )}
                    </div>
                </form>

                <div className="text-center">
                    <button
                        type="button"
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
                    >
                        {isLogin
                            ? '¿No tienes una cuenta? Regístrate'
                            : '¿Ya tienes una cuenta? Inicia sesión'}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div>Cargando...</div>}>
            <LoginForm />
        </Suspense>
    )
}
