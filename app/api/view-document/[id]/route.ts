import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Create a Supabase client with the Admin key for server operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    if (!id) {
      return NextResponse.json({ error: "Document ID is required" }, { status: 400 })
    }

    // Get document details
    const { data: document, error: fetchError } = await supabase
      .from("documents")
      .select("path, type, name")
      .eq("id", id)
      .single()

    if (fetchError) {
      return NextResponse.json({ error: `Error fetching document: ${fetchError.message}` }, { status: 500 })
    }

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // Download the file from storage
    const { data, error: downloadError } = await supabase.storage.from("documents").download(document.path)

    if (downloadError) {
      return NextResponse.json({ error: `Error downloading document: ${downloadError.message}` }, { status: 500 })
    }

    // Set the appropriate content type
    const contentType = document.type === "pdf" ? "application/pdf" : "application/octet-stream"

    // Get the filename for the Content-Disposition header
    const filename = encodeURIComponent(document.name)

    // Create a response with the file data and appropriate headers
    const response = new NextResponse(data, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${filename}"`,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "public, max-age=3600",
        // Add CORS headers
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    })

    return response
  } catch (error) {
    console.error("Error in view-document API route:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  })
}
