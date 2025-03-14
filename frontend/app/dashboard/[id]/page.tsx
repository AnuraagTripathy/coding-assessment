"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { getProductById } from "@/lib/api"
import { getSession } from "@/lib/auth"
import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft } from "lucide-react"
import type { Product } from "@/types"

export default function ProductDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [product, setProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const session = getSession()
    if (!session) {
      router.push("/login")
      return
    }

    const fetchProduct = async () => {
      try {
        // Safely parse the id from params
        const id = typeof params?.id === "string" ? Number.parseInt(params.id) : null
        if (!id) {
          throw new Error("Invalid product ID")
        }

        const data = await getProductById(id)
        setProduct(data)
      } catch (error) {
        console.error("Failed to fetch product:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProduct()
  }, [params?.id, router])

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />

      <main className="container mx-auto px-4 py-8">
        <Button variant="ghost" className="mb-6 flex items-center gap-2" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          Back to catalog
        </Button>

        {isLoading ? (
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        ) : product ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{product.name}</CardTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge>{product.dataCategory}</Badge>
                <span className="text-sm text-gray-500">{product.recordCount.toLocaleString()} records</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Fields</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {product.fields.map((field, index) => (
                    <li key={index} className="text-gray-700">
                      {field}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Description</h3>
                <p className="text-gray-700">{product.description || "No description available."}</p>
              </div>

              <div className="pt-4 border-t">
                <Button>Request Access</Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">Product not found.</p>
          </div>
        )}
      </main>
    </div>
  )
}

