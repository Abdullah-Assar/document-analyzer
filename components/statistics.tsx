"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getStatistics } from "@/lib/document-service"
import type { Statistics as StatsType } from "@/lib/types"
import { FileText, Clock, HardDrive } from "lucide-react"
import dynamic from "next/dynamic"

// استيراد مكونات الرسم البياني بشكل ديناميكي لتجنب تحميلها على الخادم
const DynamicBarChart = dynamic(() => import("recharts").then((mod) => mod.BarChart), { ssr: false })

const DynamicBar = dynamic(() => import("recharts").then((mod) => mod.Bar), { ssr: false })

const DynamicXAxis = dynamic(() => import("recharts").then((mod) => mod.XAxis), { ssr: false })

const DynamicYAxis = dynamic(() => import("recharts").then((mod) => mod.YAxis), { ssr: false })

const DynamicCartesianGrid = dynamic(() => import("recharts").then((mod) => mod.CartesianGrid), { ssr: false })

const DynamicTooltip = dynamic(() => import("recharts").then((mod) => mod.Tooltip), { ssr: false })

const DynamicResponsiveContainer = dynamic(() => import("recharts").then((mod) => mod.ResponsiveContainer), {
  ssr: false,
})

export default function Statistics() {
  const [stats, setStats] = useState<StatsType | null>(null)
  const [loading, setLoading] = useState(true)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    loadStatistics()
  }, [])

  const loadStatistics = async () => {
    setLoading(true)
    try {
      const statistics = await getStatistics()
      setStats(statistics)
    } catch (error) {
      console.error("Error loading statistics:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"

    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)} ms`
    return `${(ms / 1000).toFixed(2)} s`
  }

  const chartData = stats
    ? [
        { name: "PDF", count: stats.documentsByType.pdf },
        { name: "Word", count: stats.documentsByType.word },
      ]
    : []

  return (
    <Card>
      <CardHeader>
        <CardTitle>إحصائيات المستندات</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">جاري تحميل الإحصائيات...</div>
        ) : stats ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">إجمالي المستندات</p>
                    <h3 className="text-2xl font-bold">{stats.totalDocuments}</h3>
                  </div>
                  <FileText className="h-8 w-8 text-gray-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">إجمالي الحجم</p>
                    <h3 className="text-2xl font-bold">{formatBytes(stats.totalSize)}</h3>
                  </div>
                  <HardDrive className="h-8 w-8 text-gray-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">متوسط وقت البحث</p>
                    <h3 className="text-2xl font-bold">{formatTime(stats.averageSearchTime)}</h3>
                  </div>
                  <Clock className="h-8 w-8 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center py-8">لا توجد إحصائيات متاحة</div>
        )}

        {stats && isMounted && (
          <div>
            <h3 className="font-medium mb-4">توزيع المستندات حسب النوع</h3>
            <div className="h-64">
              <DynamicResponsiveContainer width="100%" height="100%">
                <DynamicBarChart data={chartData}>
                  <DynamicCartesianGrid strokeDasharray="3 3" />
                  <DynamicXAxis dataKey="name" />
                  <DynamicYAxis />
                  <DynamicTooltip />
                  <DynamicBar dataKey="count" fill="#8884d8" />
                </DynamicBarChart>
              </DynamicResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
              <div>
                <h3 className="font-medium mb-4">أوقات المعالجة</h3>
                <table className="w-full">
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2">وقت الفرز</td>
                      <td className="py-2 text-right">{formatTime(stats.sortingTime)}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">وقت البحث</td>
                      <td className="py-2 text-right">{formatTime(stats.searchTime)}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">وقت التصنيف</td>
                      <td className="py-2 text-right">{formatTime(stats.classificationTime)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div>
                <h3 className="font-medium mb-4">إحصائيات التصنيف</h3>
                <table className="w-full">
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2">عدد التصنيفات</td>
                      <td className="py-2 text-right">{stats.categoriesCount}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">المستندات المصنفة</td>
                      <td className="py-2 text-right">{stats.classifiedDocuments}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">دقة التصنيف</td>
                      <td className="py-2 text-right">{stats.classificationAccuracy}%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
