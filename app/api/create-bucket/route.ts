import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Create a Supabase client with the Admin key for server operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: Request) {
  try {
    const { bucketName } = await request.json()

    if (!bucketName) {
      return NextResponse.json({ error: "Bucket name is required" }, { status: 400 })
    }

    // Check if the bucket already exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()

    if (listError) {
      console.error("Error listing buckets:", listError)
      return NextResponse.json({ error: "Failed to list buckets" }, { status: 500 })
    }

    const bucketExists = buckets.some((bucket) => bucket.name === bucketName)

    if (bucketExists) {
      return NextResponse.json({ success: true, message: "Bucket already exists" })
    }

    // Create the bucket
    const { error: createError } = await supabase.storage.createBucket(bucketName, {
      public: true,
    })

    if (createError) {
      console.error("Error creating bucket:", createError)
      return NextResponse.json({ error: "Failed to create bucket" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Bucket created successfully" })
  } catch (error) {
    console.error("Error in create-bucket API route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
