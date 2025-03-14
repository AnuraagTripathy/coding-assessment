"use client"

import type React from "react"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, X } from "lucide-react"

interface SearchFiltersProps {
  onSearch: (term: string) => void
  onCategoryFilter: (category: string | null) => void
  categories: string[]
  selectedCategory: string | null
}

export function SearchFilters({ onSearch, onCategoryFilter, categories, selectedCategory }: SearchFiltersProps) {
  const [searchInput, setSearchInput] = useState("")

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value)
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(searchInput)
  }

  const handleClearSearch = () => {
    setSearchInput("")
    onSearch("")
  }

  const handleCategoryChange = (value: string) => {
    onCategoryFilter(value === "all" ? null : value)
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border">
      <div className="flex flex-col md:flex-row gap-4">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Input
            placeholder="Search by name or category..."
            value={searchInput}
            onChange={handleSearchChange}
            className="pr-10"
          />
          {searchInput && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-8 top-0 h-full"
              onClick={handleClearSearch}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Clear search</span>
            </Button>
          )}
          <Button type="submit" variant="ghost" size="icon" className="absolute right-0 top-0 h-full">
            <Search className="h-4 w-4" />
            <span className="sr-only">Search</span>
          </Button>
        </form>

        <div className="w-full md:w-64">
          <Select value={selectedCategory || "all"} onValueChange={handleCategoryChange}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}

