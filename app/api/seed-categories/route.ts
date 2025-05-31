import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Create a Supabase client with the Admin key for server operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST() {
  try {
    // Check if categories already exist
    const { count, error: countError } = await supabase.from("categories").select("*", { count: "exact", head: true })

    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 500 })
    }

    // If categories already exist, don't seed
    if (count && count > 0) {
      return NextResponse.json({ message: "Categories already exist", count })
    }

    // Define the category structure
    const categories = [
      {
        name: "مستندات إدارية",
        description: "مستندات متعلقة بالشؤون الإدارية والتنظيمية",
        children: [
          { name: "تقارير", description: "تقارير إدارية وإحصائية" },
          { name: "مذكرات", description: "مذكرات وملاحظات داخلية" },
          { name: "عقود", description: "عقود واتفاقيات" },
        ],
      },
      {
        name: "مستندات تقنية",
        description: "مستندات متعلقة بالجوانب التقنية والفنية",
        children: [
          { name: "أدلة المستخدم", description: "أدلة استخدام وإرشادات" },
          { name: "وثائق فنية", description: "وثائق فنية ومعمارية" },
          { name: "مواصفات", description: "مواصفات ومتطلبات" },
        ],
      },
      {
        name: "مستندات مالية",
        description: "مستندات متعلقة بالشؤون المالية والمحاسبية",
        children: [
          { name: "فواتير", description: "فواتير وإيصالات" },
          { name: "تقارير مالية", description: "تقارير وقوائم مالية" },
          { name: "ميزانيات", description: "ميزانيات وتخطيط مالي" },
        ],
      },
    ]

    // Insert root categories first
    for (const category of categories) {
      const { data: rootCategory, error: rootError } = await supabase
        .from("categories")
        .insert({
          name: category.name,
          description: category.description,
        })
        .select()
        .single()

      if (rootError) {
        return NextResponse.json({ error: rootError.message }, { status: 500 })
      }

      // Insert children categories
      for (const child of category.children) {
        await supabase.from("categories").insert({
          name: child.name,
          description: child.description,
          parent_id: rootCategory.id,
        })
      }
    }

    return NextResponse.json({ success: true, message: "Categories seeded successfully" })
  } catch (error) {
    console.error("Error seeding categories:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
