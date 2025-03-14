import type { Product, User } from "../types"
import { getSession } from "./auth"

// Mock data for development
const mockProducts: Product[] = [
  {
    id: 1,
    name: "Company Database",
    dataCategory: "Firmographic",
    recordCount: 5250,
    fields: ["Company name", "Company address", "Website", "Industry", "Employee count", "Revenue"],
    description: "Comprehensive database of company information including basic details and key metrics.",
  },
  {
    id: 2,
    name: "Contact Information",
    dataCategory: "Contact",
    recordCount: 12500,
    fields: ["Full name", "Email", "Phone number", "Job title", "Department"],
    description: "Database of business contacts with complete professional information.",
  },
  {
    id: 3,
    name: "Financial Metrics",
    dataCategory: "Financial",
    recordCount: 3800,
    fields: ["Annual revenue", "Profit margin", "Growth rate", "Funding rounds", "Investors"],
    description: "Detailed financial information for public and private companies.",
  },
  {
    id: 4,
    name: "Technology Stack",
    dataCategory: "Technographic",
    recordCount: 4200,
    fields: ["Technologies used", "Software vendors", "IT spending", "Cloud services"],
    description: "Information about the technologies and software companies are using.",
  },
  {
    id: 5,
    name: "Industry Trends",
    dataCategory: "Market Intelligence",
    recordCount: 1800,
    fields: ["Market size", "Growth projections", "Competitive landscape", "Market share"],
    description: "Market research data organized by industry vertical.",
  },
  {
    id: 6,
    name: "Social Media Presence",
    dataCategory: "Digital",
    recordCount: 7500,
    fields: ["Social profiles", "Follower count", "Engagement metrics", "Content strategy"],
    description: "Analysis of company social media presence and digital footprint.",
  },
]

// Mock users for development
const mockUsers: User[] = [
  {
    id: 1,
    email: "demo@example.com",
    name: "Demo User",
  },
]

// Simulated API delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// API functions that will be replaced with real API calls later

export async function login(email: string, password: string): Promise<{ token: string; user: User }> {
  await delay(800)

  // This is just for demo purposes - in a real app, this would be a server-side check
  if (email === "demo@example.com" && password === "password") {
    return {
      token: "mock-jwt-token",
      user: mockUsers[0],
    }
  }

  throw new Error("Invalid credentials")
}

export async function getProducts(): Promise<Product[]> {
  await delay(1000)

  const session = getSession()
  if (!session) {
    throw new Error("Not authenticated")
  }

  return mockProducts
}

export async function getProductById(id: number): Promise<Product> {
  await delay(800)

  const session = getSession()
  if (!session) {
    throw new Error("Not authenticated")
  }

  const product = mockProducts.find((p) => p.id === id)
  if (!product) {
    throw new Error("Product not found")
  }

  return product
}

