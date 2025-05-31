"use client"

import { useState, useEffect } from "react"
import { FileText, ArrowUpDown, Trash2, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { getDocuments, sortDocumentsByTitle } from "@/lib/document-service"
import PDFViewer from "./pdf-viewer"
import type { Document } from "@/lib/types"

export default function DocumentList() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    loadDocuments()
  }, [])

  const loadDocuments = async () => {
    setLoading(true)
    try {
      const docs = await getDocuments()
      setDocuments(docs)
    } catch (error) {
      console.error("Error loading documents:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSort = async () => {
    const newDirection = sortDirection === "asc" ? "desc" : "asc"
    setSortDirection(newDirection)
    setLoading(true)

    try {
      const sortedDocs = await sortDocumentsByTitle(documents, newDirection)
      setDocuments(sortedDocs)
    } catch (error) {
      console.error("Error sorting documents:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      setDeleteError(null)

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

      setDocuments(documents.filter((doc) => doc.id !== id))
    } catch (error) {
      console.error("Error deleting document:", error)
      setDeleteError(error instanceof Error ? error.message : "Unknown error occurred")
    }
  }

  const handlePreview = (document: Document) => {
    setSelectedDocument(document)
    setPreviewOpen(true)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ar-SA")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>قائمة المستندات</span>
          <Button variant="outline" size="sm" onClick={handleSort}>
            <ArrowUpDown className="h-4 w-4 mr-2" />
            فرز حسب العنوان {sortDirection === "asc" ? "تصاعدياً" : "تنازلياً"}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {deleteError && (
          <div className="bg-red-50 text-red-600 p-3 rounded mb-4">
            <p>خطأ في حذف المستند: {deleteError}</p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">جاري تحميل المستندات...</div>
        ) : documents.length === 0 ? (
          <div className="text-center py-8">لا توجد مستندات</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>العنوان</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead>الحجم</TableHead>
                  <TableHead>تاريخ الرفع</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 mr-2 text-gray-500" />
                        {doc.title || doc.name}
                      </div>
                    </TableCell>
                    <TableCell>{doc.type === "pdf" ? "PDF" : "Word"}</TableCell>
                    <TableCell>{(doc.size / 1024 / 1024).toFixed(2)} MB</TableCell>
                    <TableCell>{formatDate(doc.created_at)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handlePreview(doc)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(doc.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{selectedDocument?.title || selectedDocument?.name}</DialogTitle>
            </DialogHeader>
            {selectedDocument && (
              <div className="h-[70vh] overflow-auto">
                {selectedDocument.type === "pdf" ? (
                  <PDFViewer documentId={selectedDocument.id} title={selectedDocument.title || selectedDocument.name} />
                ) : (
                  <div className="p-4">
                    <p>محتوى المستند: {selectedDocument.content?.substring(0, 500)}...</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
