export interface Document {
  id: string
  name: string
  title?: string
  type: "pdf" | "word"
  size: number
  content?: string
  path: string
  url: string
  created_at: string
  updated_at: string
}

export interface SearchResult extends Document {
  matches?: string[]
  highlights?: string[]
}

export interface Category {
  id: string
  name: string
  parent_id?: string
  description?: string
  created_at: string
  children?: Category[]
  documents?: Document[]
}

export interface DocumentCategory {
  document_id: string
  category_id: string
  confidence: number
  created_at: string
}

export interface ProcessingStatistic {
  id: string
  document_id: string
  operation: string
  duration_ms: number
  created_at: string
}

export interface Statistics {
  totalDocuments: number
  totalSize: number
  documentsByType: {
    pdf: number
    word: number
  }
  averageSearchTime: number
  sortingTime: number
  searchTime: number
  classificationTime: number
  categoriesCount: number
  classifiedDocuments: number
  classificationAccuracy: number
}
