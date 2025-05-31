export const dynamic = "force-dynamic"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import UploadDocuments from "@/components/upload-documents"
import DocumentList from "@/components/document-list"
import SearchDocuments from "@/components/search-documents"
import ClassifyDocuments from "@/components/classify-documents"
import Statistics from "@/components/statistics"

export default function Home() {
  return (
    <div className="container mx-auto py-10 px-4 min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-center">تطبيق تحليل المستندات</h1>

      <Tabs defaultValue="upload" dir="rtl" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="upload">رفع المستندات</TabsTrigger>
          <TabsTrigger value="list">قائمة المستندات</TabsTrigger>
          <TabsTrigger value="search">البحث</TabsTrigger>
          <TabsTrigger value="classify">التصنيف</TabsTrigger>
          <TabsTrigger value="stats">الإحصائيات</TabsTrigger>
        </TabsList>
        <TabsContent value="upload">
          <UploadDocuments />
        </TabsContent>
        <TabsContent value="list">
          <DocumentList />
        </TabsContent>
        <TabsContent value="search">
          <SearchDocuments />
        </TabsContent>
        <TabsContent value="classify">
          <ClassifyDocuments />
        </TabsContent>
        <TabsContent value="stats">
          <Statistics />
        </TabsContent>
      </Tabs>
    </div>
  )
}
