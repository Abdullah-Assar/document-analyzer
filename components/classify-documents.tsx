"use client"

import { useState, useEffect } from "react"
import { FolderTree, FileText, ChevronRight, ChevronDown, Plus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getDocuments, getCategories, classifyDocuments, createCategory } from "@/lib/document-service"
import type { Document, Category } from "@/lib/types"

export default function ClassifyDocuments() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [classifying, setClassifying] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<string[]>([])
  const [newCategoryDialog, setNewCategoryDialog] = useState(false)
  const [newCategory, setNewCategory] = useState({
    name: "",
    parentId: "",
    description: "",
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [docs, cats] = await Promise.all([getDocuments(), getCategories()])
      setDocuments(docs)
      setCategories(cats)

      // Expand all root categories by default
      setExpandedCategories(cats.map((cat) => cat.id))
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleClassify = async () => {
    setClassifying(true)
    try {
      await classifyDocuments(documents, categories)
      // Reload data to get updated classifications
      await loadData()
    } catch (error) {
      console.error("Error classifying documents:", error)
    } finally {
      setClassifying(false)
    }
  }

  const handleCreateCategory = async () => {
    try {
      await createCategory(newCategory.name, newCategory.parentId || undefined, newCategory.description || undefined)

      // Reset form and close dialog
      setNewCategory({
        name: "",
        parentId: "",
        description: "",
      })
      setNewCategoryDialog(false)

      // Reload categories
      const cats = await getCategories()
      setCategories(cats)
    } catch (error) {
      console.error("Error creating category:", error)
    }
  }

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId],
    )
  }

  // Flatten categories for select dropdown
  const flattenCategories = (categories: Category[], level = 0): { id: string; name: string; level: number }[] => {
    let result: { id: string; name: string; level: number }[] = []

    categories.forEach((category) => {
      result.push({
        id: category.id,
        name: category.name,
        level,
      })

      if (category.children && category.children.length > 0) {
        result = [...result, ...flattenCategories(category.children, level + 1)]
      }
    })

    return result
  }

  const renderCategory = (category: Category, level = 0) => {
    const isExpanded = expandedCategories.includes(category.id)

    return (
      <div key={category.id} className="mt-1">
        <div
          className="flex items-center cursor-pointer hover:bg-gray-50 p-1 rounded"
          onClick={() => toggleCategory(category.id)}
        >
          <div style={{ marginRight: `${level * 16}px` }} className="flex items-center">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-500" />
            )}
            <FolderTree className="h-4 w-4 text-gray-500 ml-1" />
            <span className="font-medium">{category.name}</span>
            {category.documents && <span className="text-xs text-gray-500 ml-2">({category.documents.length})</span>}
          </div>
        </div>

        {isExpanded && (
          <div>
            {category.children && category.children.map((child) => renderCategory(child, level + 1))}

            {category.documents && category.documents.length > 0 && (
              <div className="ml-8 mt-1 space-y-1">
                {category.documents.map((doc) => (
                  <div key={doc.id} className="flex items-center p-1 text-sm">
                    <FileText className="h-3 w-3 text-gray-500 mr-1" />
                    <span className="truncate">{doc.title || doc.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // Add this function to the ClassifyDocuments component
  const seedCategories = async () => {
    try {
      const response = await fetch("/api/seed-categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to seed categories")
      }

      // Reload categories
      const cats = await getCategories()
      setCategories(cats)
    } catch (error) {
      console.error("Error seeding categories:", error)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>تصنيف المستندات</span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={seedCategories} disabled={loading}>
              <Plus className="h-4 w-4 mr-2" />
              تهيئة التصنيفات
            </Button>
            <Button variant="outline" onClick={() => setNewCategoryDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              تصنيف جديد
            </Button>
            <Button onClick={handleClassify} disabled={classifying || loading}>
              تصنيف المستندات
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">جاري تحميل البيانات...</div>
        ) : (
          <div className="border rounded-md p-4">
            <h3 className="font-medium mb-4">شجرة التصنيف</h3>
            <div className="space-y-1">{categories.map((category) => renderCategory(category))}</div>
          </div>
        )}
      </CardContent>

      <Dialog open={newCategoryDialog} onOpenChange={setNewCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة تصنيف جديد</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">اسم التصنيف</Label>
              <Input
                id="name"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="parent">التصنيف الأب</Label>
              <Select
                value={newCategory.parentId}
                onValueChange={(value) => setNewCategory({ ...newCategory, parentId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر التصنيف الأب (اختياري)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">بدون تصنيف أب</SelectItem>
                  {flattenCategories(categories).map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.level > 0 ? "\u00A0".repeat(cat.level * 2) + "└─ " : ""}
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">الوصف</Label>
              <Textarea
                id="description"
                value={newCategory.description}
                onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewCategoryDialog(false)}>
              إلغاء
            </Button>
            <Button onClick={handleCreateCategory} disabled={!newCategory.name}>
              إضافة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
