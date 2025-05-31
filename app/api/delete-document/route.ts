import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Create a Supabase client with the Admin key for server operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: Request) {
  try {
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "Document ID is required" }, { status: 400 })
    }

    // Get document path first
    const { data: document, error: fetchError } = await supabase.from("documents").select("path").eq("id", id).single()

    if (fetchError) {
      return NextResponse.json({ error: `Error fetching document: ${fetchError.message}` }, { status: 500 })
    }

    if (document && document.path) {
      // Delete file from storage
      const { error: storageError } = await supabase.storage.from("documents").remove([document.path])

      if (storageError) {
        console.error(`Error deleting file from storage: ${storageError.message}`)
        // Continue with deleting the database record even if storage deletion fails
      }
    }

    // Delete document metadata from database
    const { error } = await supabase.from("documents").delete().eq("id", id)

    if (error) {
      return NextResponse.json({ error: `Error deleting document: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in delete-document API route:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    )
  }
}
