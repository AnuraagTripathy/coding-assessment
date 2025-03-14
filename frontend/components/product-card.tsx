import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Database, FileText } from "lucide-react"
import type { Product } from "@/types"

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-xl">{product.name}</CardTitle>
          <Badge>{product.dataCategory}</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
          <Database className="h-4 w-4" />
          <span>{product.recordCount.toLocaleString()} records</span>
        </div>

        <div>
          <h4 className="text-sm font-medium mb-2">Fields:</h4>
          <div className="flex flex-wrap gap-2">
            {product.fields.slice(0, 3).map((field, index) => (
              <Badge key={index} variant="outline" className="font-normal">
                {field}
              </Badge>
            ))}
            {product.fields.length > 3 && (
              <Badge variant="outline" className="font-normal">
                +{product.fields.length - 3} more
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Link href={`/dashboard/${product.id}`} className="w-full">
          <Button variant="outline" className="w-full flex items-center gap-2">
            <FileText className="h-4 w-4" />
            View Details
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}

