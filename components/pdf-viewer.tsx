"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2 } from "lucide-react"

interface PDFViewerProps {
  documentId: string
  title: string
}

export default function PDFViewer({ documentId, title }: PDFViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pdfData, setPdfData] = useState<string | null>(null)

  useEffect(() => {
    const fetchPDF = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch the PDF as a blob
        const response = await fetch(`/api/view-document/${documentId}`)

        if (!response.ok) {
          throw new Error(`Failed to load PDF: ${response.statusText}`)
        }

        const blob = await response.blob()

        // Convert blob to data URL
        const reader = new FileReader()
        reader.onloadend = () => {
          setPdfData(reader.result as string)
          setLoading(false)
        }
        reader.onerror = () => {
          setError("Failed to convert PDF data")
          setLoading(false)
        }
        reader.readAsDataURL(blob)
      } catch (err) {
        console.error("Error loading PDF:", err)
        setError(err instanceof Error ? err.message : "Failed to load PDF")
        setLoading(false)
      }
    }

    fetchPDF()
  }, [documentId])

  return (
    <div className="w-full h-full flex flex-col">
      <div className="text-sm text-gray-500 mb-2">{title}</div>

      <div ref={containerRef} className="flex-1 border rounded-md overflow-hidden relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <span className="ml-2">جاري تحميل المستند...</span>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-50 text-red-600 p-4">
            <p>خطأ في تحميل المستند: {error}</p>
          </div>
        )}

        {pdfData && !loading && !error && (
          <object data={pdfData} type="application/pdf" className="w-full h-full" aria-label={title}>
            <div className="p-4 text-center">
              <p>
                لا يمكن عرض ملف PDF. يرجى{" "}
                <a href={pdfData} className="text-blue-600 underline" download={title}>
                  تحميل الملف
                </a>{" "}
                لعرضه.
              </p>
            </div>
          </object>
        )}
      </div>
    </div>
  )
}
