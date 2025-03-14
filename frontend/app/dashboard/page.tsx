"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Toaster, toast } from "sonner"
import { SearchFilters } from "@/components/search-filters"
import { UserIcon } from "lucide-react"

// API URL
const API_URL = "http://localhost:8000"

// Types
interface Product {
  id: number
  name: string
  dataCategory: string
  recordCount: number
  fields: string[]
  description: string
}

interface User {
  username: string
  email?: string
  full_name?: string
  disabled?: boolean
}

// Auth functions
const setSession = (token: string, userData: any) => {
  localStorage.setItem("token", token)
  localStorage.setItem("user", JSON.stringify(userData))
}

const getSession = () => {
  if (typeof window === "undefined") return null
  
  const token = localStorage.getItem("token")
  const userStr = localStorage.getItem("user")
  
  if (!token) return null
  
  const user = userStr ? JSON.parse(userStr) : null
  
  return { token, user }
}

const clearSession = () => {
  localStorage.removeItem("token")
  localStorage.removeItem("user")
}

const logout = () => {
  clearSession()
  window.location.href = "/login"
}

// API functions
const authFetch = async (endpoint: string, options: RequestInit = {}) => {
  const session = getSession()
  
  if (!session || !session.token) {
    throw new Error("No authentication token found")
  }
  
  const headers = {
    ...options.headers,
    Authorization: `Bearer ${session.token}`
  }
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers
  })
  
  if (!response.ok) {
    // Handle token expiration
    if (response.status === 401) {
      // Clear session and redirect to login
      clearSession()
      window.location.href = "/login"
      throw new Error("Session expired. Please login again.")
    }
    
    const error = await response.json().catch(() => ({ detail: "Unknown error" }))
    throw new Error(error.detail || "API request failed")
  }
  
  return response.json()
}

// Product API functions
const getProducts = async () => {
  return authFetch("/products")
}

const getUserProducts = async () => {
  return authFetch("/my-products")
}

// Get a single product by ID
const getProductById = async (productId: number) => {
  return authFetch(`/products/${productId}`)
}

const assignProduct = async (productId: number) => {
  return authFetch("/assign-product", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      product_id: productId
    })
  })
}

const unassignProduct = async (productId: number) => {
  return authFetch(`/unassign-product/${productId}`, {
    method: "DELETE"
  })
}

// Dashboard Header Component
function DashboardHeader() {
  return (
    <header className="sticky top-0 z-10 bg-white border-b">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/dashboard" className="font-bold text-xl">
          B2B Data Catalog
        </Link>
        
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex items-center gap-2"
          >
            <UserIcon className="h-4 w-4" />
            <span>Profile</span>
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={logout}
          >
            Log out
          </Button>
        </div>
      </div>
    </header>
  )
}

// Product Detail Dialog Component
function ProductDetailDialog({ 
  product, 
  isOpen, 
  onClose, 
  isLoading, 
  onAssign, 
  onUnassign, 
  isAssigned, 
  isActionLoading
}: { 
  product: Product | null, 
  isOpen: boolean, 
  onClose: () => void, 
  isLoading: boolean, 
  onAssign: (id: number) => void, 
  onUnassign: (id: number) => void, 
  isAssigned: (id: number) => boolean, 
  isActionLoading: boolean
}) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-auto">
        <div className="p-4 border-b">
          <div className="flex justify-between items-start">
            <h2 className="text-xl font-bold">{product?.name}</h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          <p className="text-sm text-gray-600">
            {product?.dataCategory} • {product?.recordCount?.toLocaleString()} records
          </p>
        </div>
        
        <div className="p-4">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : (
            <>
              <p className="mb-4">{product?.description}</p>
              
              <div className="mt-6">
                <h4 className="font-medium mb-2">Fields</h4>
                <ul className="grid grid-cols-2 gap-1">
                  {product?.fields.map((field, index) => (
                    <li key={index} className="text-sm">• {field}</li>
                  ))}
                </ul>
              </div>

              <div className="mt-6 flex justify-end">
                {product && (
                  <Button
                    variant={isAssigned(product.id) ? "outline" : "default"}
                    onClick={() => {
                      if (isAssigned(product.id)) {
                        onUnassign(product.id)
                      } else {
                        onAssign(product.id)
                      }
                      onClose()
                    }}
                    disabled={isActionLoading}
                  >
                    {isAssigned(product.id) ? "Remove from Catalog" : "Add to Catalog"}
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [myProducts, setMyProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    const session = getSession()
    if (!session) {
      router.push("/login")
      return
    }

    const fetchData = async () => {
      setIsLoading(true)
      try {
        const [allProductsData, userProductsData] = await Promise.all([
          getProducts(),
          getUserProducts()
        ])
        
        setProducts(allProductsData)
        setMyProducts(userProductsData)
        setFilteredProducts(activeTab === "all" ? allProductsData : userProductsData)
      } catch (error) {
        console.error("Failed to fetch products:", error)
        toast.error("Failed to load products. Please try again later.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [router])

  // Handle tab switching and filtering
  useEffect(() => {
    const sourceProducts = activeTab === "all" ? products : myProducts
    
    let result = sourceProducts

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(
        (product) => product.name.toLowerCase().includes(term) || product.dataCategory.toLowerCase().includes(term),
      )
    }

    // Filter by category
    if (selectedCategory) {
      result = result.filter((product) => product.dataCategory === selectedCategory)
    }

    setFilteredProducts(result)
  }, [searchTerm, selectedCategory, products, myProducts, activeTab])

  const handleSearch = (term: string) => {
    setSearchTerm(term)
  }

  const handleCategoryFilter = (category: string | null) => {
    setSelectedCategory(category)
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
  }

  const handleViewProduct = async (productId: number) => {
    setIsDetailLoading(true)
    try {
      // Always fetch from the API to ensure we have the latest data
      const product = await getProductById(productId)
      setSelectedProduct(product)
      setIsDialogOpen(true)
    } catch (error) {
      console.error("Failed to fetch product details:", error)
      toast.error("Failed to fetch product details")
      
      // Fallback to cached data if API fails
      const cachedProduct = products.find(p => p.id === productId)
      if (cachedProduct) {
        setSelectedProduct(cachedProduct)
        setIsDialogOpen(true)
        toast.warning("Showing cached data. Some information may be outdated.")
      }
    } finally {
      setIsDetailLoading(false)
    }
  }

  const handleAssignProduct = async (productId: number) => {
    setIsActionLoading(true)
    try {
      await assignProduct(productId)
      
      // Refresh my products
      const updatedUserProducts = await getUserProducts()
      setMyProducts(updatedUserProducts)

      toast.success("Product added to your catalog")
    } catch (error) {
      console.error("Failed to assign product:", error)
      toast.error("Failed to add product. Please try again.")
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleUnassignProduct = async (productId: number) => {
    setIsActionLoading(true)
    try {
      await unassignProduct(productId)
      
      // Refresh my products
      const updatedUserProducts = await getUserProducts()
      setMyProducts(updatedUserProducts)

      toast.success("Product removed from your catalog")
    } catch (error) {
      console.error("Failed to remove product:", error)
      toast.error("Failed to remove product. Please try again.")
    } finally {
      setIsActionLoading(false)
    }
  }

  // Extract unique categories from all products for filter dropdown
  const categories = [...new Set(products.map((product) => product.dataCategory))]

  // Check if a product is in the user's collection
  const isProductAssigned = (productId: number) => {
    return myProducts.some(p => p.id === productId)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <Toaster position="top-right" />

      {/* Product Detail Dialog */}
      <ProductDetailDialog 
        product={selectedProduct}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        isLoading={isDetailLoading}
        onAssign={handleAssignProduct}
        onUnassign={handleUnassignProduct}
        isAssigned={isProductAssigned}
        isActionLoading={isActionLoading}
      />

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Data Catalog</h1>

        {/* Simple tab navigation */}
        <div className="mb-8">
          <div className="flex border-b mb-4">
            <button 
              className={`px-4 py-2 ${activeTab === "all" ? "border-b-2 border-blue-500 font-medium" : ""}`}
              onClick={() => handleTabChange("all")}
            >
              All Products
            </button>
            <button 
              className={`px-4 py-2 ${activeTab === "my" ? "border-b-2 border-blue-500 font-medium" : ""}`}
              onClick={() => handleTabChange("my")}
            >
              My Products
            </button>
          </div>
          
          <div className="mt-4">
            <SearchFilters
              onSearch={handleSearch}
              onCategoryFilter={handleCategoryFilter}
              categories={categories}
              selectedCategory={selectedCategory}
            />
          </div>
          
          <div className="mt-4">
            {isLoading ? (
              <ProductLoadingSkeleton />
            ) : activeTab === "all" ? (
              <ProductGrid 
                products={filteredProducts} 
                emptyMessage="No products found in the catalog."
                onViewDetails={handleViewProduct}
                renderAction={(product) => (
                  <Button
                    variant={isProductAssigned(product.id) ? "outline" : "default"}
                    onClick={() => isProductAssigned(product.id) 
                      ? handleUnassignProduct(product.id) 
                      : handleAssignProduct(product.id)
                    }
                    disabled={isActionLoading}
                    size="sm"
                  >
                    {isProductAssigned(product.id) ? "Remove" : "Add"}
                  </Button>
                )}
              />
            ) : (
              <ProductGrid 
                products={filteredProducts} 
                emptyMessage="You haven't added any products to your catalog yet."
                onViewDetails={handleViewProduct}
                renderAction={(product) => (
                  <Button
                    variant="outline"
                    onClick={() => handleUnassignProduct(product.id)}
                    disabled={isActionLoading}
                    size="sm"
                  >
                    Remove
                  </Button>
                )}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

// Helper components
const ProductLoadingSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="border rounded-lg p-6 bg-white">
        <Skeleton className="h-6 w-3/4 mb-4" />
        <Skeleton className="h-4 w-1/2 mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    ))}
  </div>
)

interface ProductGridProps {
  products: Product[]
  emptyMessage: string
  onViewDetails: (productId: number) => void
  renderAction: (product: Product) => React.ReactNode
}

const ProductGrid = ({ products, emptyMessage, onViewDetails, renderAction }: ProductGridProps) => {
  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    )
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => (
        <div key={product.id} className="border rounded-lg p-6 bg-white">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-lg">{product.name}</h3>
            {renderAction(product)}
          </div>
          <p className="text-sm text-blue-600 mb-2">{product.dataCategory}</p>
          <p className="text-sm text-gray-600 mb-2">
            {product.recordCount.toLocaleString()} records
          </p>
          <p className="text-sm mb-4 line-clamp-2">{product.description}</p>
          
          <Button 
            variant="link" 
            className="px-0 h-auto font-normal text-sm"
            onClick={() => onViewDetails(product.id)}
          >
            View Details
          </Button>
        </div>
      ))}
    </div>
  )
}