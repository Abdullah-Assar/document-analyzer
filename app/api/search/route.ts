import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Create a Supabase client with the Admin key for server operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: Request) {
  try {
    const { query } = await request.json()

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Invalid query parameter" }, { status: 400 })
    }

    // Use PostgreSQL full-text search
    const { data, error } = await supabase.from("document_search").select("id").textSearch("document_tsvector", query, {
      config: "arabic",
    })

    if (error) {
      console.error("Search error:", error)
      return NextResponse.json({ error: "Search failed" }, { status: 500 })
    }

    // Get full document details for the matching IDs
    const documentIds = data.map((item) => item.id)

    if (documentIds.length === 0) {
      return NextResponse.json({ results: [] })
    }

    const { data: documents, error: documentsError } = await supabase
      .from("documents")
      .select("*")
      .in("id", documentIds)

    if (documentsError) {
      console.error("Error fetching documents:", documentsError)
      return NextResponse.json({ error: "Failed to fetch document details" }, { status: 500 })
    }

    // Process results to include highlights
    const results = documents.map((doc) => {
      const content = doc.content || ""
      const title = doc.title || doc.name

      // Create simple highlights
      const highlights = []
      const queryLower = query.toLowerCase()
      const contentLower = content.toLowerCase()

      let startIndex = 0
      while (startIndex < contentLower.length) {
        const matchIndex = contentLower.indexOf(queryLower, startIndex)
        if (matchIndex === -1) break

        // Get surrounding context (50 chars before and after)
        const contextStart = Math.max(0, matchIndex - 50)
        const contextEnd = Math.min(contentLower.length, matchIndex + query.length + 50)
        const highlight = content.substring(contextStart, contextEnd)

        highlights.push(`...${highlight}...`)
        startIndex = matchIndex + query.length

        // Limit to 3 highlights per document
        if (highlights.length >= 3) break
      }

      return {
        ...doc,
        highlights,
      }
    })

    return NextResponse.json({ results })
  } catch (error) {
    console.error("Search route error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
