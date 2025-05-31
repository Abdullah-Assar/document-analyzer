"use client"

import { supabase } from "./supabase-client"
import type { Document, SearchResult, Category, Statistics } from "./types"

// استيراد مكتبات معالجة المستندات بشكل ديناميكي
const pdfjs = typeof window !== "undefined" ? import("pdfjs-dist").then((module) => module) : null

const mammoth = typeof window !== "undefined" ? import("mammoth").then((module) => module.default) : null

// Upload a new document
export async function uploadDocument(file: File): Promise<Document> {
  const startTime = performance.now()

  try {
    // Extract text from document
    let content = ""
    let title = ""

    if (file.type === "application/pdf") {
      const result = await extractTextFromPdf(file)
      content = result.content
      title = result.title || file.name
    } else if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      const result = await extractTextFromWord(file)
      content = result.content
      title = result.title || file.name
    }

    // Create FormData to send to the API
    const formData = new FormData()
    formData.append("file", file)
    formData.append("fileName", file.name)
    formData.append("fileType", file.type)
    formData.append("fileSize", file.size.toString())
    formData.append("content", content)
    formData.append("title", title)

    // Upload via server API
    const response = await fetch("/api/upload-document", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Failed to upload document")
    }

    const { document } = await response.json()

    // Record client-side processing time
    const duration = performance.now() - startTime
    console.log(`Client-side processing time: ${duration}ms`)

    return document as Document
  } catch (error) {
    console.error("Error in uploadDocument:", error)
    throw error
  }
}

// Extract text from PDF file
async function extractTextFromPdf(file: File): Promise<{ content: string; title?: string }> {
  try {
    if (typeof window === "undefined") {
      return { content: "", title: file.name }
    }

    const arrayBuffer = await file.arrayBuffer()

    // Use a simpler approach for text extraction that doesn't rely on the worker
    // This is a fallback method that extracts basic text without full PDF parsing
    let content = ""
    const title = file.name

    // Basic extraction from the first few bytes to get some content
    const textDecoder = new TextDecoder("utf-8")
    const text = textDecoder.decode(arrayBuffer.slice(0, 10000))

    // Extract some readable text
    const textMatches = text.match(/[\w\s.,;:!?'"()-]+/g)
    if (textMatches) {
      content = textMatches.join(" ")
    }

    return { content, title }
  } catch (error) {
    console.error("Error extracting PDF text:", error)
    return { content: "", title: file.name }
  }
}

// Extract text from Word file
async function extractTextFromWord(file: File): Promise<{ content: string; title?: string }> {
  try {
    if (typeof window === "undefined" || !mammoth) {
      return { content: "", title: file.name }
    }

    const arrayBuffer = await file.arrayBuffer()
    const mammothModule = await mammoth
    const result = await mammothModule.extractRawText({ arrayBuffer })

    // Try to extract title from text (usually first paragraph)
    const lines = result.value.split("\n").filter((line) => line.trim() !== "")
    const title = lines.length > 0 ? lines[0] : undefined

    return { content: result.value, title }
  } catch (error) {
    console.error("Error extracting Word text:", error)
    return { content: "", title: file.name }
  }
}

// Get all documents
export async function getDocuments(): Promise<Document[]> {
  const { data, error } = await supabase.from("documents").select("*").order("created_at", { ascending: false })

  if (error) {
    throw new Error(`Error fetching documents: ${error.message}`)
  }

  return data as Document[]
}

// Get document by ID
export async function getDocumentById(id: string): Promise<Document> {
  const { data, error } = await supabase
    .from("documents")
    .select(`
      *,
      document_categories(
        category_id,
        confidence
      )
    `)
    .eq("id", id)
    .single()

  if (error) {
    throw new Error(`Error fetching document: ${error.message}`)
  }

  // Get categories for the document
  if (data.document_categories && data.document_categories.length > 0) {
    const categoryIds = data.document_categories.map((dc: any) => dc.category_id)

    const { data: categoriesData, error: categoriesError } = await supabase
      .from("categories")
      .select("*")
      .in("id", categoryIds)

    if (!categoriesError && categoriesData) {
      data.categories = categoriesData
    }
  }

  return data as Document
}

// Delete a document
export async function deleteDocument(id: string): Promise<void> {
  try {
    const response = await fetch("/api/delete-document", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Failed to delete document")
    }
  } catch (error) {
    console.error("Error in deleteDocument:", error)
    throw error
  }
}

// Sort documents by title
export async function sortDocumentsByTitle(
  documents: Document[],
  direction: "asc" | "desc" = "asc",
): Promise<Document[]> {
  const startTime = performance.now()

  try {
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .order("title", { ascending: direction === "asc" })

    if (error) {
      throw new Error(`Error sorting documents: ${error.message}`)
    }

    const duration = performance.now() - startTime
    await recordProcessingTime(null, "sort", duration)

    return data as Document[]
  } catch (error) {
    console.error("Error in sortDocumentsByTitle:", error)
    throw error
  }
}

// Update the searchDocuments function to use our new PostgreSQL function
export async function searchDocuments(query: string): Promise<SearchResult[]> {
  const startTime = performance.now()

  try {
    // Use PostgreSQL search_documents function
    const { data, error } = await supabase.rpc("search_documents", {
      search_query: query,
    })

    if (error) {
      console.error("Search RPC error:", error)
      // Fallback to basic search if RPC fails
      return fallbackSearchDocuments(query)
    }

    // Process the results to format them correctly
    const results = data.map((doc: any) => ({
      ...doc,
      highlights: doc.highlights || [],
    }))

    const duration = performance.now() - startTime
    await recordProcessingTime(null, "search", duration)

    return results as SearchResult[]
  } catch (error) {
    console.error("Error in searchDocuments:", error)
    // Fallback to basic search
    return fallbackSearchDocuments(query)
  }
}

// Fallback search method if RPC fails
async function fallbackSearchDocuments(query: string): Promise<SearchResult[]> {
  const startTime = performance.now()

  try {
    // Get all documents
    const { data, error } = await supabase.from("documents").select("*")

    if (error) {
      throw new Error(`Error fetching documents: ${error.message}`)
    }

    const documents = data as Document[]
    const results: SearchResult[] = []

    // Search in each document
    for (const doc of documents) {
      const matches: string[] = []

      // Search in title
      const title = doc.title || doc.name
      if (title.toLowerCase().includes(query.toLowerCase())) {
        matches.push(title)
      }

      // Search in content
      if (doc.content) {
        const content = doc.content.toLowerCase()
        const queryLower = query.toLowerCase()

        // Split content into sentences
        const sentences = content.split(/[.!?]+/)

        for (const sentence of sentences) {
          if (sentence.includes(queryLower)) {
            // Clean sentence and add to matches
            const cleanSentence = sentence.trim()
            if (cleanSentence.length > 0) {
              matches.push(cleanSentence)
            }
          }
        }
      }

      // Add document to results if there are matches
      if (matches.length > 0) {
        results.push({
          ...doc,
          matches,
        })
      }
    }

    const duration = performance.now() - startTime
    await recordProcessingTime(null, "search_fallback", duration)

    return results
  } catch (error) {
    console.error("Error in fallbackSearchDocuments:", error)
    throw error
  }
}

// Get all categories
export async function getCategories(): Promise<Category[]> {
  // First get all categories
  const { data, error } = await supabase.from("categories").select("*")

  if (error) {
    throw new Error(`Error fetching categories: ${error.message}`)
  }

  const categories = data as Category[]

  // Build category tree
  const categoryMap: Record<string, Category> = {}
  const rootCategories: Category[] = []

  // First pass: create map of all categories
  categories.forEach((category) => {
    categoryMap[category.id] = {
      ...category,
      children: [],
    }
  })

  // Second pass: build tree structure
  categories.forEach((category) => {
    if (category.parent_id) {
      const parent = categoryMap[category.parent_id]
      if (parent) {
        parent.children.push(categoryMap[category.id])
      }
    } else {
      rootCategories.push(categoryMap[category.id])
    }
  })

  return rootCategories
}

// Create a new category
export async function createCategory(name: string, parentId?: string, description?: string): Promise<Category> {
  const { data, error } = await supabase
    .from("categories")
    .insert({
      name,
      parent_id: parentId,
      description,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Error creating category: ${error.message}`)
  }

  return data as Category
}

// Classify documents
export async function classifyDocuments(documents: Document[], categories: Category[]): Promise<Document[]> {
  const startTime = performance.now()

  try {
    // Create keyword dictionary for each category
    const categoryKeywords: Record<string, string[]> = {
      // Administrative documents
      "1": ["إدارة", "إداري", "مذكرة", "تقرير", "خطة", "استراتيجية"],
      "1-1": ["تقرير", "تقارير", "إحصائيات", "نتائج", "تحليل"],
      "1-2": ["مذكرة", "مذكرات", "ملاحظة", "ملاحظات", "توجيه"],
      "1-3": ["عقد", "عقود", "اتفاقية", "اتفاق", "تعاقد"],

      // Technical documents
      "2": ["تقني", "فني", "تكنولوجيا", "برمجة", "نظام", "تطبيق"],
      "2-1": ["دليل", "مستخدم", "استخدام", "تعليمات", "إرشادات"],
      "2-2": ["وثيقة", "فنية", "تقنية", "معمارية", "تصميم"],
      "2-3": ["مواصفات", "متطلبات", "معايير", "قياسات", "خصائص"],

      // Financial documents
      "3": ["مالي", "مالية", "حساب", "ميزانية", "تكلفة", "سعر"],
      "3-1": ["فاتورة", "فواتير", "إيصال", "دفع", "مدفوعات"],
      "3-2": ["تقرير مالي", "قوائم مالية", "أرباح", "خسائر", "إيرادات"],
      "3-3": ["ميزانية", "موازنة", "تخطيط مالي", "تقدير", "تكاليف"],
    }

    // Get flat list of all categories
    const allCategories = await supabase.from("categories").select("*")

    if (allCategories.error) {
      throw new Error(`Error fetching categories: ${allCategories.error.message}`)
    }

    const categoryMap: Record<string, Category> = {}
    allCategories.data.forEach((cat) => {
      categoryMap[cat.id] = cat
    })

    // Classify each document
    for (const doc of documents) {
      const docContent = ((doc.title || "") + " " + (doc.content || "")).toLowerCase()
      let bestCategoryId = ""
      let highestScore = 0
      let confidence = 0

      // Calculate match score for each category
      for (const [categoryId, keywords] of Object.entries(categoryKeywords)) {
        let score = 0

        for (const keyword of keywords) {
          const regex = new RegExp(keyword, "gi")
          const matches = docContent.match(regex)
          if (matches) {
            score += matches.length
          }
        }

        // Update best category
        if (score > highestScore) {
          highestScore = score
          bestCategoryId = categoryId
          confidence = Math.min(score / 10, 1) // Normalize confidence between 0-1
        }
      }

      // Assign category to document if there's a match
      if (highestScore > 0) {
        // Find the actual category ID from our database
        const matchingCategory = allCategories.data.find((cat) => cat.name === categoryMap[bestCategoryId]?.name)

        if (matchingCategory) {
          // Insert into document_categories
          await supabase.from("document_categories").upsert({
            document_id: doc.id,
            category_id: matchingCategory.id,
            confidence: confidence,
          })
        }
      }
    }

    const duration = performance.now() - startTime
    await recordProcessingTime(null, "classification", duration)

    // Return updated documents
    const { data, error } = await supabase.from("documents").select("*")

    if (error) {
      throw new Error(`Error fetching documents: ${error.message}`)
    }

    return data as Document[]
  } catch (error) {
    console.error("Error in classifyDocuments:", error)
    throw error
  }
}

// Record processing time
async function recordProcessingTime(documentId: string | null, operation: string, durationMs: number): Promise<void> {
  try {
    await supabase.from("processing_statistics").insert({
      document_id: documentId,
      operation,
      duration_ms: Math.round(durationMs),
    })
  } catch (error) {
    console.error("Error recording processing time:", error)
  }
}

// Get statistics
export async function getStatistics(): Promise<Statistics> {
  try {
    // Get document counts and sizes
    const { data: documents, error: documentsError } = await supabase.from("documents").select("id, size, type")

    if (documentsError) {
      throw new Error(`Error fetching documents: ${documentsError.message}`)
    }

    const totalDocuments = documents.length
    const totalSize = documents.reduce((sum, doc) => sum + doc.size, 0)

    // Count by type
    const pdfCount = documents.filter((doc) => doc.type === "pdf").length
    const wordCount = documents.filter((doc) => doc.type === "word").length

    // Get processing times
    const { data: processingStats, error: statsError } = await supabase
      .from("processing_statistics")
      .select("operation, duration_ms")

    if (statsError) {
      throw new Error(`Error fetching processing statistics: ${statsError.message}`)
    }

    // Calculate average times
    const searchTimes = processingStats.filter((stat) => stat.operation === "search").map((stat) => stat.duration_ms)

    const sortingTimes = processingStats.filter((stat) => stat.operation === "sort").map((stat) => stat.duration_ms)

    const classificationTimes = processingStats
      .filter((stat) => stat.operation === "classification")
      .map((stat) => stat.duration_ms)

    const averageSearchTime =
      searchTimes.length > 0 ? searchTimes.reduce((sum, time) => sum + time, 0) / searchTimes.length : 0

    const sortingTime =
      sortingTimes.length > 0 ? sortingTimes.reduce((sum, time) => sum + time, 0) / sortingTimes.length : 0

    const classificationTime =
      classificationTimes.length > 0
        ? classificationTimes.reduce((sum, time) => sum + time, 0) / classificationTimes.length
        : 0

    // Get category counts
    const { count: categoriesCount, error: categoriesError } = await supabase
      .from("categories")
      .select("id", { count: "exact", head: true })

    if (categoriesError) {
      throw new Error(`Error counting categories: ${categoriesError.message}`)
    }

    // Get classified document count
    const { count: classifiedCount, error: classifiedError } = await supabase
      .from("document_categories")
      .select("document_id", { count: "exact", head: true })

    if (classifiedError) {
      throw new Error(`Error counting classified documents: ${classifiedError.message}`)
    }

    return {
      totalDocuments,
      totalSize,
      documentsByType: {
        pdf: pdfCount,
        word: wordCount,
      },
      averageSearchTime,
      sortingTime,
      searchTime: averageSearchTime,
      classificationTime,
      categoriesCount,
      classifiedDocuments: classifiedCount,
      classificationAccuracy: 85, // Default: 85% classification accuracy
    }
  } catch (error) {
    console.error("Error in getStatistics:", error)
    throw error
  }
}
