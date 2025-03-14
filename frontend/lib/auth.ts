import type { User } from "../types"

interface Session {
  token: string
  user: User
}

// In a real app, you might use a more secure storage method
// or a library like next-auth

export function setSession(token: string, user: User): void {
  if (typeof window !== "undefined") {
    const session = { token, user }
    localStorage.setItem("session", JSON.stringify(session))
  }
}

export function getSession(): Session | null {
  if (typeof window !== "undefined") {
    const sessionStr = localStorage.getItem("session")
    if (sessionStr) {
      try {
        return JSON.parse(sessionStr)
      } catch (e) {
        return null
      }
    }
  }
  return null
}

export function clearSession(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("session")
  }
}

