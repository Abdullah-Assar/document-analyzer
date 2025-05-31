import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Create a Supabase client with the Admin key for server operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Function to sanitize filenames for Supabase Storage
function sanitizeFilename(filename: string): string {
  // Generate a random string to ensure uniqueness
  const randomString = Math.random().toString(36).substring(2, 10)

  // Extract file extension
  const extension = filename.split(".").pop() || ""

  // Create a safe filename with timestamp and random string
  return `${Date.now()}_${randomString}.${extension}`
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Extract file metadata
    const fileName = formData.get("fileName") as string
    const fileType = formData.get("fileType") as string
    const fileSize = Number(formData.get("fileSize"))
    const fileContent = formData.get("content") as string
    const fileTitle = (formData.get("title") as string) || fileName

    // Sanitize the filename to make it URL-safe
    const safeFilename = sanitizeFilename(fileName)

    // Upload file to Supabase Storage
    const filePath = safeFilename
    const fileBuffer = await file.arrayBuffer()

    // Ensure the documents bucket exists
    const { data: buckets } = await supabase.storage.listBuckets()
    const bucketExists = buckets.some((bucket) => bucket.name === "documents")

    if (!bucketExists) {
      await supabase.storage.createBucket("documents", { public: true })
    }

    // Set the correct content type for the file
    const contentType = file.type === "application/pdf" ? "application/pdf" : file.type

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("documents")
      .upload(filePath, fileBuffer, {
        contentType: contentType,
        upsert: false,
        cacheControl: "3600", // Cache for 1 hour
      })

    if (uploadError) {
      console.error("Error uploading file:", uploadError)
      return NextResponse.json({ error: `Error uploading file: ${uploadError.message}` }, { status: 500 })
    }

    // Get public URL for the file
    const { data: urlData } = supabase.storage.from("documents").getPublicUrl(filePath, {
      download: false, // Don't force download
    })

    // Insert document metadata into database
    const { data, error } = await supabase
      .from("documents")
      .insert({
        name: fileName, // Keep the original filename for display
        title: fileTitle,
        type: fileType === "application/pdf" ? "pdf" : "word",
        size: fileSize,
        content: fileContent,
        path: filePath, // Store the sanitized path
        url: urlData.publicUrl,
      })
      .select()
      .single()

    if (error) {
      console.error("Error saving document metadata:", error)
      return NextResponse.json({ error: `Error saving document metadata: ${error.message}` }, { status: 500 })
    }

    // Record processing time
    await supabase.from("processing_statistics").insert({
      document_id: data.id,
      operation: "upload",
      duration_ms: 0, // We can't measure this accurately from the server
    })

    return NextResponse.json({ success: true, document: data })
  } catch (error) {
    console.error("Error in upload-document API route:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    )
  }
}

export const config = {
  api: {
    bodyParser: false, // Disable the default body parser
  },
}
