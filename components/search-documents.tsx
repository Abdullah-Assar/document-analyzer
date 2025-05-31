"use client"

import { useState } from "react"
import { Search, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { searchDocuments } from "@/lib/document-service"
import PDFViewer from "./pdf-viewer"
import type { SearchResult } from "@/lib/types"

export default function SearchDocuments() {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<SearchResult | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setSearching(true)
    try {
      const results = await searchDocuments(searchQuery)
      setSearchResults(results)
    } catch (error) {
      console.error("Error searching documents:", error)
    } finally {
      setSearching(false)
    }
  }

  const handlePreview = (document: SearchResult) => {
    setSelectedDocument(document)
    setPreviewOpen(true)
  }

  const highlightMatches = (text: string, query: string) => {
    if (!text) return ""

    const regex = new RegExp(`(${query})`, "gi")
    return text.replace(regex, "<mark>$1</mark>")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>البحث في المستندات</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-6">
          <Input
            placeholder="أدخل كلمات البحث..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <Button onClick={handleSearch} disabled={searching}>
            <Search className="h-4 w-4 mr-2" />
            بحث
          </Button>
        </div>

        {searching ? (
          <div className="text-center py-8">جاري البحث...</div>
        ) : searchResults.length > 0 ? (
          <div className="space-y-4">
            <h3 className="font-medium">نتائج البحث ({searchResults.length})</h3>
            {searchResults.map((result, index) => (
              <Card key={index} className="cursor-pointer hover:bg-gray-50" onClick={() => handlePreview(result)}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-gray-500 mt-1" />
                    <div>
                      <h4 className="font-medium">{result.title || result.name}</h4>
                      <p className="text-sm text-gray-500">
                        {result.type === "pdf" ? "PDF" : "Word"} • {(result.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      {result.highlights && result.highlights.length > 0 ? (
                        <div className="mt-2 text-sm">
                          <p className="font-medium">المطابقات:</p>
                          <ul className="list-disc list-inside space-y-1 mt-1">
                            {result.highlights.map((highlight, idx) => (
                              <li key={idx} className="text-gray-700">
                                <span dangerouslySetInnerHTML={{ __html: highlight }} />
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : result.matches && result.matches.length > 0 ? (
                        <div className="mt-2 text-sm">
                          <p className="font-medium">المطابقات:</p>
                          <ul className="list-disc list-inside space-y-1 mt-1">
                            {result.matches.slice(0, 3).map((match, idx) => (
                              <li key={idx} className="text-gray-700">
                                <span
                                  dangerouslySetInnerHTML={{
                                    __html: `...${highlightMatches(match, searchQuery)}...`,
                                  }}
                                />
                              </li>
                            ))}
                            {result.matches.length > 3 && (
                              <li className="text-gray-500">+{result.matches.length - 3} مطابقات أخرى</li>
                            )}
                          </ul>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : searchQuery && !searching ? (
          <div className="text-center py-8">لا توجد نتائج مطابقة لبحثك</div>
        ) : null}

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
                    <div
                      dangerouslySetInnerHTML={{
                        __html: highlightMatches(selectedDocument.content || "", searchQuery),
                      }}
                    />
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
