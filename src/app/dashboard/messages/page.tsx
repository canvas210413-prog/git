"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Mail,
  Send,
  Inbox,
  Trash2,
  Plus,
  Search,
  RefreshCw,
  Eye,
  Clock,
  User,
  CheckCircle,
  Circle,
  AlertCircle,
  ArrowLeft,
  Reply,
} from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderEmail: string | null;
  receiverId: string;
  receiverName: string;
  receiverEmail: string | null;
  subject: string;
  content: string;
  isRead: boolean;
  readAt: string | null;
  priority: string;
  createdAt: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  assignedPartner: string | null;
}

export default function MessagesPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<"inbox" | "sent">("inbox");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMessageIds, setSelectedMessageIds] = useState<Set<string>>(new Set());

  // 새 메시지 폼
  const [newMessage, setNewMessage] = useState({
    receiverId: "",
    subject: "",
    content: "",
    priority: "NORMAL",
  });
  const [sending, setSending] = useState(false);

  // 메시지 목록 조회
  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/messages?type=${activeTab}`);
      const data = await res.json();
      
      if (res.ok) {
        setMessages(data.messages || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  // 사용자 목록 조회
  const fetchUsers = async (search = "") => {
    try {
      const res = await fetch(`/api/messages/users?search=${search}`);
      const data = await res.json();
      
      if (res.ok) {
        setUsers(data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    if (showCompose) {
      fetchUsers();
    }
  }, [showCompose]);

  // 메시지 상세 보기
  const handleViewMessage = async (message: Message) => {
    try {
      const res = await fetch(`/api/messages/${message.id}`);
      const data = await res.json();
      
      if (res.ok) {
        setSelectedMessage(data);
        setShowDetail(true);
        // 읽음 상태 업데이트
        if (!message.isRead && activeTab === "inbox") {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === message.id ? { ...m, isRead: true } : m
            )
          );
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error("Error viewing message:", error);
    }
  };

  // 메시지 보내기
  const handleSendMessage = async () => {
    if (!newMessage.receiverId || !newMessage.subject || !newMessage.content) {
      alert("수신자, 제목, 내용을 모두 입력해주세요.");
      return;
    }

    try {
      setSending(true);
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMessage),
      });

      const data = await res.json();

      if (res.ok) {
        alert("메시지가 전송되었습니다.");
        setShowCompose(false);
        setNewMessage({
          receiverId: "",
          subject: "",
          content: "",
          priority: "NORMAL",
        });
        if (activeTab === "sent") {
          fetchMessages();
        }
      } else {
        alert(data.error || "메시지 전송에 실패했습니다.");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      alert("메시지 전송에 실패했습니다.");
    } finally {
      setSending(false);
    }
  };

  // 메시지 삭제
  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
      const res = await fetch(`/api/messages/${messageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete" }),
      });

      if (res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
        if (showDetail) {
          setShowDetail(false);
          setSelectedMessage(null);
        }
      }
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  // 전체 메시지 삭제
  const handleDeleteAllMessages = async () => {
    if (messages.length === 0) {
      alert("삭제할 메시지가 없습니다.");
      return;
    }

    if (!confirm(`${activeTab === "inbox" ? "받은" : "보낸"} 메시지함의 모든 메시지(${messages.length}건)를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/messages?type=${activeTab}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (res.ok) {
        alert(`${data.deletedCount}건의 메시지가 삭제되었습니다.`);
        setMessages([]);
        setSelectedMessageIds(new Set());
        if (activeTab === "inbox") {
          setUnreadCount(0);
        }
      } else {
        alert(data.error || "메시지 삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("Error deleting all messages:", error);
      alert("메시지 삭제에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 선택 메시지 삭제
  const handleDeleteSelectedMessages = async () => {
    if (selectedMessageIds.size === 0) {
      alert("삭제할 메시지를 선택해주세요.");
      return;
    }

    if (!confirm(`선택한 ${selectedMessageIds.size}건의 메시지를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      setLoading(true);
      let successCount = 0;
      const deletePromises = Array.from(selectedMessageIds).map(async (messageId) => {
        const res = await fetch(`/api/messages/${messageId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "delete" }),
        });
        if (res.ok) successCount++;
        return res.ok;
      });

      await Promise.all(deletePromises);

      setMessages((prev) => prev.filter((m) => !selectedMessageIds.has(m.id)));
      setSelectedMessageIds(new Set());
      alert(`${successCount}건의 메시지가 삭제되었습니다.`);
    } catch (error) {
      console.error("Error deleting selected messages:", error);
      alert("메시지 삭제에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 전체 선택/해제
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedMessageIds(new Set(messages.map((m) => m.id)));
    } else {
      setSelectedMessageIds(new Set());
    }
  };

  // 개별 선택/해제
  const handleSelectMessage = (messageId: string, checked: boolean) => {
    const newSelected = new Set(selectedMessageIds);
    if (checked) {
      newSelected.add(messageId);
    } else {
      newSelected.delete(messageId);
    }
    setSelectedMessageIds(newSelected);
  };

  // 답장
  const handleReply = () => {
    if (selectedMessage) {
      setNewMessage({
        receiverId: selectedMessage.senderId,
        subject: `Re: ${selectedMessage.subject}`,
        content: `\n\n--- 원본 메시지 ---\n보낸 사람: ${selectedMessage.senderName}\n날짜: ${format(new Date(selectedMessage.createdAt), "yyyy-MM-dd HH:mm", { locale: ko })}\n\n${selectedMessage.content}`,
        priority: "NORMAL",
      });
      setShowDetail(false);
      setShowCompose(true);
    }
  };

  // 우선순위 배지
  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      LOW: "bg-gray-100 text-gray-600",
      NORMAL: "bg-blue-100 text-blue-600",
      HIGH: "bg-orange-100 text-orange-600",
      URGENT: "bg-red-100 text-red-600",
    };
    const labels: Record<string, string> = {
      LOW: "낮음",
      NORMAL: "일반",
      HIGH: "높음",
      URGENT: "긴급",
    };
    return (
      <Badge className={colors[priority] || colors.NORMAL}>
        {labels[priority] || priority}
      </Badge>
    );
  };

  // 역할 표시명 가져오기
  const getRoleDisplay = (role: string) => {
    const roleMap: Record<string, string> = {
      'SUPER_ADMIN': '최고 관리자',
      'ADMIN': '관리자',
      'MANAGER': '매니저',
      'PARTNER': '협력사',
      'USER': '사용자',
      'VIEWER': '조회자'
    };
    return roleMap[role] || role;
  };

  // 역할 배지 색상
  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      'SUPER_ADMIN': 'bg-purple-100 text-purple-700',
      'ADMIN': 'bg-red-100 text-red-700',
      'MANAGER': 'bg-blue-100 text-blue-700',
      'PARTNER': 'bg-green-100 text-green-700',
      'USER': 'bg-gray-100 text-gray-700',
      'VIEWER': 'bg-slate-100 text-slate-700'
    };
    return colors[role] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Mail className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold">메시지함</h1>
            <p className="text-sm text-muted-foreground">
              사용자 간 메시지를 주고받을 수 있습니다
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {selectedMessageIds.size > 0 && (
            <Button 
              variant="destructive" 
              onClick={handleDeleteSelectedMessages}
              disabled={loading}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              선택 삭제 ({selectedMessageIds.size})
            </Button>
          )}
          <Button 
            variant="outline" 
            onClick={handleDeleteAllMessages}
            disabled={loading || messages.length === 0}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            전체 삭제
          </Button>
          <Button variant="outline" onClick={() => fetchMessages()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            새로고침
          </Button>
          <Button onClick={() => setShowCompose(true)}>
            <Plus className="h-4 w-4 mr-2" />
            새 메시지
          </Button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Inbox className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">받은 메시지</p>
              <p className="text-2xl font-bold">
                {activeTab === "inbox" ? messages.length : "-"}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-lg">
              <Circle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">안읽은 메시지</p>
              <p className="text-2xl font-bold text-red-600">{unreadCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Send className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">보낸 메시지</p>
              <p className="text-2xl font-bold">
                {activeTab === "sent" ? messages.length : "-"}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <User className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">등록된 사용자</p>
              <p className="text-2xl font-bold">{users.length || "-"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 메시지 목록 */}
      <Card>
        <CardHeader className="pb-3">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "inbox" | "sent")}>
            <TabsList>
              <TabsTrigger value="inbox" className="gap-2">
                <Inbox className="h-4 w-4" />
                받은 메시지함
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-1">
                    {unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="sent" className="gap-2">
                <Send className="h-4 w-4" />
                보낸 메시지함
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>메시지가 없습니다.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={selectedMessageIds.size === messages.length && messages.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                  </TableHead>
                  <TableHead className="w-12">상태</TableHead>
                  <TableHead className="w-32">
                    {activeTab === "inbox" ? "보낸 사람" : "받는 사람"}
                  </TableHead>
                  <TableHead>제목</TableHead>
                  <TableHead className="w-20">우선순위</TableHead>
                  <TableHead className="w-40">날짜</TableHead>
                  <TableHead className="w-24">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {messages.map((message) => (
                  <TableRow
                    key={message.id}
                    className={`hover:bg-muted/50 ${
                      !message.isRead && activeTab === "inbox"
                        ? "bg-blue-50 font-semibold"
                        : ""
                    }`}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedMessageIds.has(message.id)}
                        onChange={(e) => handleSelectMessage(message.id, e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                    </TableCell>
                    <TableCell
                      className="cursor-pointer"
                      onClick={() => handleViewMessage(message)}
                    >
                      {message.isRead ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Circle className="h-4 w-4 text-blue-500" />
                      )}
                    </TableCell>
                    <TableCell
                      className="cursor-pointer"
                      onClick={() => handleViewMessage(message)}
                    >
                      {activeTab === "inbox"
                        ? message.senderName
                        : message.receiverName}
                    </TableCell>
                    <TableCell
                      className="max-w-md truncate cursor-pointer"
                      onClick={() => handleViewMessage(message)}
                    >
                      {message.subject}
                    </TableCell>
                    <TableCell
                      className="cursor-pointer"
                      onClick={() => handleViewMessage(message)}
                    >
                      {getPriorityBadge(message.priority)}
                    </TableCell>
                    <TableCell
                      className="cursor-pointer"
                      onClick={() => handleViewMessage(message)}
                    >
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {format(new Date(message.createdAt), "MM/dd HH:mm", {
                          locale: ko,
                        })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewMessage(message);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteMessage(message.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 메시지 상세 보기 */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedMessage && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-2">
                  {getPriorityBadge(selectedMessage.priority)}
                  {selectedMessage.isRead ? (
                    <Badge variant="outline" className="text-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      읽음
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-blue-600">
                      <Circle className="h-3 w-3 mr-1" />
                      안읽음
                    </Badge>
                  )}
                </div>
                <DialogTitle className="text-xl">
                  {selectedMessage.subject}
                </DialogTitle>
                <DialogDescription className="space-y-2">
                  <div className="flex items-center gap-4 text-sm">
                    <span>
                      <strong>보낸 사람:</strong> {selectedMessage.senderName}
                      {selectedMessage.senderEmail && (
                        <span className="text-muted-foreground">
                          {" "}
                          ({selectedMessage.senderEmail})
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span>
                      <strong>받는 사람:</strong> {selectedMessage.receiverName}
                      {selectedMessage.receiverEmail && (
                        <span className="text-muted-foreground">
                          {" "}
                          ({selectedMessage.receiverEmail})
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span>
                      <strong>날짜:</strong>{" "}
                      {format(
                        new Date(selectedMessage.createdAt),
                        "yyyy년 MM월 dd일 HH:mm:ss",
                        { locale: ko }
                      )}
                    </span>
                  </div>
                </DialogDescription>
              </DialogHeader>
              <div className="border-t pt-4 mt-4">
                <div className="whitespace-pre-wrap text-sm leading-relaxed min-h-[200px]">
                  {selectedMessage.content}
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setShowDetail(false)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  목록으로
                </Button>
                {activeTab === "inbox" && (
                  <Button onClick={handleReply}>
                    <Reply className="h-4 w-4 mr-2" />
                    답장
                  </Button>
                )}
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteMessage(selectedMessage.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  삭제
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* 새 메시지 작성 */}
      <Dialog open={showCompose} onOpenChange={setShowCompose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-blue-600" />
              새 메시지 작성
            </DialogTitle>
            <DialogDescription>
              메시지를 보낼 사용자를 선택하고 내용을 입력하세요.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>받는 사람 *</Label>
              <Select
                value={newMessage.receiverId}
                onValueChange={(value) =>
                  setNewMessage({ ...newMessage, receiverId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="수신자를 선택하세요" />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex items-center justify-between gap-3 w-full">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span className="font-medium">{user.name || user.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={`text-xs ${getRoleBadgeColor(user.role)}`}>
                            {getRoleDisplay(user.role)}
                          </Badge>
                          {user.assignedPartner && (
                            <Badge variant="outline" className="text-xs">
                              {user.assignedPartner}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>제목 *</Label>
                <Input
                  placeholder="제목을 입력하세요"
                  value={newMessage.subject}
                  onChange={(e) =>
                    setNewMessage({ ...newMessage, subject: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>우선순위</Label>
                <Select
                  value={newMessage.priority}
                  onValueChange={(value) =>
                    setNewMessage({ ...newMessage, priority: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">낮음</SelectItem>
                    <SelectItem value="NORMAL">일반</SelectItem>
                    <SelectItem value="HIGH">높음</SelectItem>
                    <SelectItem value="URGENT">긴급</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>내용 *</Label>
              <Textarea
                placeholder="메시지 내용을 입력하세요"
                value={newMessage.content}
                onChange={(e) =>
                  setNewMessage({ ...newMessage, content: e.target.value })
                }
                rows={8}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCompose(false)}
              disabled={sending}
            >
              취소
            </Button>
            <Button onClick={handleSendMessage} disabled={sending}>
              {sending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              보내기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
