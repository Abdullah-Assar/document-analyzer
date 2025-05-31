"use client"

import type React from "react"

import { useState } from "react"
import { Upload, File, Check, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import { uploadDocument } from "@/lib/document-service"

export default function UploadDocuments() {
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState<string>("")

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      const validFiles = selectedFiles.filter(
        (file) =>
          file.type === "application/pdf" ||
          file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      )
      setFiles(validFiles)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()

    if (e.dataTransfer.files) {
      const droppedFiles = Array.from(e.dataTransfer.files)
      const validFiles = droppedFiles.filter(
        (file) =>
          file.type === "application/pdf" ||
          file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      )
      setFiles(validFiles)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  const handleUpload = async () => {
    if (files.length === 0) return

    setUploading(true)
    setProgress(0)
    setUploadStatus("idle")
    setErrorMessage("")

    try {
      for (let i = 0; i < files.length; i++) {
        await uploadDocument(files[i])
        setProgress(((i + 1) / files.length) * 100)
      }
      setUploadStatus("success")
      setFiles([])
    } catch (error) {
      console.error("Error uploading documents:", error)
      setUploadStatus("error")
      setErrorMessage(error instanceof Error ? error.message : "Unknown error occurred")
    } finally {
      setUploading(false)
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col items-center justify-center gap-4">
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-12 w-full text-center cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => document.getElementById("file-upload")?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium">اضغط لاختيار المستندات</h3>
            <p className="text-sm text-gray-500 mt-2">أو اسحب وأفلت الملفات هنا</p>
            <p className="text-xs text-gray-400 mt-1">PDF, DOCX</p>
            <input
              id="file-upload"
              type="file"
              multiple
              accept=".pdf,.docx"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {files.length > 0 && (
            <div className="w-full">
              <h4 className="font-medium mb-2">الملفات المختارة ({files.length})</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center p-2 bg-gray-50 rounded">
                    <File className="h-5 w-5 text-gray-500 mr-2" />
                    <span className="text-sm truncate">{file.name}</span>
                    <span className="text-xs text-gray-500 ml-auto">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {uploading && (
            <div className="w-full">
              <div className="flex justify-between mb-1">
                <span className="text-sm">جاري الرفع...</span>
                <span className="text-sm">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {uploadStatus === "success" && (
            <div className="flex items-center text-green-600 gap-2">
              <Check className="h-5 w-5" />
              <span>تم رفع المستندات بنجاح</span>
            </div>
          )}

          {uploadStatus === "error" && (
            <div className="flex flex-col items-center text-red-600 gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                <span>حدث خطأ أثناء رفع المستندات</span>
              </div>
              {errorMessage && <p className="text-sm text-red-500">{errorMessage}</p>}
            </div>
          )}

          <Button onClick={handleUpload} disabled={files.length === 0 || uploading} className="w-full">
            رفع المستندات
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
