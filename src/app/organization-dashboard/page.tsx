import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Users, UserCheck, BarChart3, DollarSign } from "lucide-react"

export default function OrganizationDashboardPage() {
  return (
    <>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">لوحة تحكم المنظمة</h1>
        <p className="text-muted-foreground">
          نظرة عامة على أداء المستفيدين في منظمتك.
        </p>
      </div>
      <div className="grid gap-4 pt-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              إجمالي المستفيدين
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              لا توجد بيانات
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              المستفيدون النشطون
            </CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
             لا توجد بيانات
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">متوسط التقدم</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0%</div>
            <p className="text-xs text-muted-foreground">
              لا توجد بيانات
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي مبيعات المتاجر</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0 د.أ</div>
            <p className="text-xs text-muted-foreground">
              لا توجد بيانات
            </p>
          </CardContent>
        </Card>
      </div>
       <div className="grid grid-cols-1 gap-4 pt-4">
        <Card>
          <CardHeader>
            <CardTitle>مرحبا بك في لوحة التحكم</CardTitle>
            <CardDescription>
              هنا يمكنك إدارة المستفيدين، المرشدين، الدورات، والتقارير الخاصة بمنظمتك.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </>
  )
}
