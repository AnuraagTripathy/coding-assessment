"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

// API URL for backend
const API_URL = "http://localhost:8000"

// Updated auth functions
const login = async (username: string, password: string) => {
  const formData = new URLSearchParams()
  formData.append("username", username)
  formData.append("password", password)

  const response = await fetch(`${API_URL}/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formData,
  })

  if (!response.ok) {
    throw new Error("Login failed")
  }

  const data = await response.json()
  return data
}

const register = async (username: string, email: string, fullName: string, password: string) => {
  console.log('Registration payload:', {
    username,
    email,
    full_name: fullName,
    password,
  });

  const response = await fetch(`${API_URL}/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username,
      email,
      full_name: fullName,
      password,
    }),
  })
  console.log('Registration response:', response)

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.detail || "Registration failed")
  }

  const data = await response.json()
  return data
}

const getCurrentUser = async (token: string) => {
  const response = await fetch(`${API_URL}/users/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error("Failed to get user data")
  }

  return response.json()
}

// Session management
const setSession = (token: string, userData: any) => {
  localStorage.setItem("token", token)
  localStorage.setItem("user", JSON.stringify(userData))
}

const getSession = () => {
  if (typeof window === "undefined") return { token: null, user: null }
  
  const token = localStorage.getItem("token")
  const userStr = localStorage.getItem("user")
  const user = userStr ? JSON.parse(userStr) : null
  
  return { token, user }
}

const clearSession = () => {
  localStorage.removeItem("token")
  localStorage.removeItem("user")
}

export default function LoginPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [isLogin, setIsLogin] = useState(true)
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [fullName, setFullName] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Check if already logged in
  useEffect(() => {
    setMounted(true)
    const { token } = getSession()
    if (token) {
      router.push("/dashboard")
    }
  }, [router])

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const authData = await login(username, password)
      
      // Get user data
      const userData = await getCurrentUser(authData.access_token)
      
      // Store in session
      setSession(authData.access_token, userData)
      router.push("/dashboard")
    } catch (err) {
      setError("Invalid username or password. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      // Register the user
      await register(username, email, fullName, password)
      
      // Auto-login after registration
      const authData = await login(username, password)
      const userData = await getCurrentUser(authData.access_token)
      
      setSession(authData.access_token, userData)
      router.push("/dashboard")
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Show nothing until client-side hydration is complete
  if (!mounted) {
    return null
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">B2B Data Catalog</CardTitle>
          <CardDescription className="text-center">
            {isLogin ? "Enter your credentials to access the data catalog" : "Create a new account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLogin ? (
            <form
              onSubmit={handleLoginSubmit}
              className="space-y-4"
              autoComplete="on"
            >
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  placeholder="your_username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Button
                    variant="link"
                    className="px-0 font-normal h-auto"
                    type="button"
                    onClick={(e) => e.preventDefault()}
                  >
                    Forgot password?
                  </Button>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button className="w-full mt-4" type="submit" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          ) : (
            <form
              onSubmit={handleRegisterSubmit}
              className="space-y-4"
              autoComplete="on"
            >
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="register-username">Username</Label>
                <Input
                  id="register-username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  placeholder="your_username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-email">Email</Label>
                <Input
                  id="register-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-fullname">Full Name</Label>
                <Input
                  id="register-fullname"
                  name="fullname"
                  type="text"
                  autoComplete="name"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-password">Password</Label>
                <Input
                  id="register-password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button className="w-full mt-4" type="submit" disabled={isLoading}>
                {isLoading ? "Creating account..." : "Create account"}
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter>
          <Button
            variant="link"
            className="w-full"
            onClick={() => {
              setIsLogin(!isLogin)
              setError("")
            }}
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}