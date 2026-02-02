import { getCustomerDetail } from "@/app/actions/customer-detail";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, Phone, Mail, Globe, Calendar, 
  ShoppingBag, MessageSquare, Target, Gift, FileText, 
  CreditCard, Clock, CheckCircle, AlertCircle
} from "lucide-react";
import { CustomerActions } from "@/components/customers/customer-actions";

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let customer = null;
  let error = null;

  try {
    const result = await getCustomerDetail(id);
    if (result.error) {
      error = result.error;
    } else {
      customer = result.customer;
    }
  } catch (e) {
    console.error("Error loading customer detail:", e);
    error = e;
  }

  if (error || !customer) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-red-600">고객 정보를 불러올 수 없습니다.</h2>
        <p className="text-muted-foreground mt-2">데이터베이스 연결을 확인해주세요.</p>
        <pre className="mt-4 p-4 bg-slate-100 rounded text-left text-xs overflow-auto max-w-lg mx-auto">
          {String(error)}
        </pre>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header Section */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            {customer.name}
            <Badge variant={customer.status === "ACTIVE" ? "default" : "secondary"}>
              {customer.status}
            </Badge>
            <Badge variant="outline" className="ml-2">{customer.segment}</Badge>
          </h1>
          <p className="text-muted-foreground mt-2 flex items-center gap-4">
            <span className="flex items-center gap-1"><Globe className="w-4 h-4" /> {customer.company || "Direct"}</span>
            <span className="flex items-center gap-1"><Mail className="w-4 h-4" /> {customer.email}</span>
            <span className="flex items-center gap-1"><Phone className="w-4 h-4" /> {customer.phone}</span>
          </p>
        </div>
        <div className="text-right text-sm text-muted-foreground space-y-2">
          <div>
            <p>가입일: {new Date(customer.createdAt).toLocaleDateString()}</p>
            <p>최근 수정: {new Date(customer.updatedAt).toLocaleDateString()}</p>
          </div>
          <CustomerActions customer={customer} />
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-6 lg:w-[800px]">
          <TabsTrigger value="overview">개요</TabsTrigger>
          <TabsTrigger value="orders">구매이력</TabsTrigger>
          <TabsTrigger value="tickets">CS/문의</TabsTrigger>
          <TabsTrigger value="leads">관심상품</TabsTrigger>
          <TabsTrigger value="gifts">사은품</TabsTrigger>
          <TabsTrigger value="notes">관리노트</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">총 구매액</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₩{customer.orders?.reduce((acc: any, curr: any) => acc + Number(curr.totalAmount), 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">최근 30일 내 구매 포함</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">진행중인 문의</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {customer.tickets?.filter((t: any) => t.status !== "CLOSED" && t.status !== "RESOLVED").length}건
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">관심 상품</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {customer.leads?.filter((l: any) => l.status !== "LOST").length}건
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">지급된 사은품</CardTitle>
                <Gift className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {customer.gifts?.length}개
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>구매 이력</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {customer.orders?.length === 0 ? (
                  <p className="text-muted-foreground">구매 이력이 없습니다.</p>
                ) : (
                  customer.orders?.map((order: any) => (
                    <div key={order.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                      <div className="flex items-center gap-4">
                        <div className="bg-blue-100 p-2 rounded-full">
                          <ShoppingBag className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">주문 #{order.id.slice(-6)}</p>
                          <p className="text-sm text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">₩{Number(order.totalAmount).toLocaleString()}</p>
                        <Badge variant="outline">{order.status}</Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tickets Tab */}
        <TabsContent value="tickets" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>CS 및 문의 내역</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {customer.tickets?.length === 0 ? (
                  <p className="text-muted-foreground">문의 내역이 없습니다.</p>
                ) : (
                  customer.tickets?.map((ticket: any) => (
                    <div key={ticket.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-full ${ticket.priority === 'URGENT' ? 'bg-red-100' : 'bg-gray-100'}`}>
                          <AlertCircle className={`h-5 w-5 ${ticket.priority === 'URGENT' ? 'text-red-600' : 'text-gray-600'}`} />
                        </div>
                        <div>
                          <p className="font-medium">{ticket.subject}</p>
                          <p className="text-sm text-muted-foreground">{new Date(ticket.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge>{ticket.status}</Badge>
                        <p className="text-xs text-muted-foreground mt-1">우선순위: {ticket.priority}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leads Tab */}
        <TabsContent value="leads" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>영업 기회 (Leads)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {customer.leads?.length === 0 ? (
                  <p className="text-muted-foreground">영업 기회가 없습니다.</p>
                ) : (
                  customer.leads?.map((lead: any) => (
                    <div key={lead.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                      <div className="flex items-center gap-4">
                        <div className="bg-green-100 p-2 rounded-full">
                          <Target className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium">{lead.title}</p>
                          <p className="text-sm text-muted-foreground">예상 규모: ₩{Number(lead.value).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary">{lead.status}</Badge>
                        <p className="text-sm text-muted-foreground mt-1">{new Date(lead.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gifts Tab */}
        <TabsContent value="gifts" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>사은품 지급 현황</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {customer.gifts?.length === 0 ? (
                  <p className="text-muted-foreground">지급된 사은품이 없습니다.</p>
                ) : (
                  customer.gifts?.map((gift: any) => (
                    <div key={gift.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                      <div className="flex items-center gap-4">
                        <div className="bg-purple-100 p-2 rounded-full">
                          <Gift className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium">{gift.name}</p>
                          <p className="text-sm text-muted-foreground">{gift.description || "설명 없음"}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">{gift.status}</Badge>
                        {gift.sentAt && (
                          <p className="text-xs text-muted-foreground mt-1">지급일: {new Date(gift.sentAt).toLocaleDateString()}</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>관리 포인트 / 노트</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {customer.notes?.length === 0 ? (
                  <p className="text-muted-foreground">작성된 노트가 없습니다.</p>
                ) : (
                  customer.notes?.map((note: any) => (
                    <div key={note.id} className="bg-muted/50 p-4 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-semibold text-sm">{note.authorName || "관리자"}</span>
                        <span className="text-xs text-muted-foreground">{new Date(note.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
