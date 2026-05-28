import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Space,
  Badge,
  message,
  Empty,
  Spin,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  ExportOutlined,
  SendOutlined,
  LeftOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  listConversations,
  getConversation,
  replyToConversation,
  exportConversation,
  type ConversationItem,
  type ConversationDetail,
  type ConversationMessage,
} from './services/support';

const { TextArea } = Input;

const SupportPage: React.FC = () => {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [form] = Form.useForm();

  // Chat panel state
  const [selectedStaffAccountId, setSelectedStaffAccountId] = useState<string | null>(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<ConversationMessage[]>([]);
  const [chatStaff, setChatStaff] = useState<ConversationDetail['staff'] | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);
  const [showMobileList, setShowMobileList] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchConversations = useCallback(async () => {
    setLoading(true);
    try {
      const values = form.getFieldsValue();
      const params: any = {
        page,
        pageSize,
        keyword: values.keyword || undefined,
      };
      const result = await listConversations(params);
      setConversations(result.list || []);
      setTotal(result.total || 0);
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, form]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const handleSearch = () => {
    setPage(1);
    fetchConversations();
  };

  const handleReset = () => {
    form.resetFields();
    setPage(1);
    fetchConversations();
  };

  const openConversation = async (staffAccountId: string) => {
    setSelectedStaffAccountId(staffAccountId);
    setShowMobileList(false);
    setChatLoading(true);
    setReplyContent('');
    try {
      const detail = await getConversation(staffAccountId);
      setChatMessages(detail.messages || []);
      setChatStaff(detail.staff);
      // Refresh unread count in list
      fetchConversations();
    } catch {
      // handled by interceptor
    } finally {
      setChatLoading(false);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  };

  const handleSendReply = async () => {
    if (!replyContent.trim()) {
      message.warning('请输入回复内容');
      return;
    }
    if (!selectedStaffAccountId) return;
    setReplyLoading(true);
    try {
      const newMsg = await replyToConversation(selectedStaffAccountId, replyContent.trim());
      setChatMessages((prev) => [...prev, newMsg]);
      setReplyContent('');
      message.success('发送成功');
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch {
      // handled by interceptor
    } finally {
      setReplyLoading(false);
    }
  };

  const handleExport = async () => {
    if (!selectedStaffAccountId) return;
    try {
      const data = await exportConversation(selectedStaffAccountId);
      // Generate CSV client-side and trigger download
      const csvRows: string[] = [];
      csvRows.push('时间,发送者角色,发送者姓名,员工ID,标题,内容,消息类型');
      for (const row of data.messages) {
        const escaped = [row.time, row.senderRole, row.senderName, row.staffId, row.title, row.content, row.messageType]
          .map((v) => {
            const str = String(v ?? '');
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
              return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
          });
        csvRows.push(escaped.join(','));
      }
      const bom = '﻿';
      const csv = bom + csvRows.join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `chat_${data.staff.staffId}_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
      message.success('导出成功');
    } catch {
      // handled by interceptor
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  };

  const backToList = () => {
    setShowMobileList(true);
    setSelectedStaffAccountId(null);
  };

  const renderChatBubble = (msg: ConversationMessage) => {
    const isStaff = msg.senderType === 'staff';
    const senderName = isStaff
      ? (chatStaff?.staffName ?? msg.staffId ?? '员工')
      : (msg.adminName ?? '客服');
    const alignClass = isStaff ? 'chat-bubble-left' : 'chat-bubble-right';
    const bubbleStyle: React.CSSProperties = isStaff
      ? { backgroundColor: '#fff', border: '1px solid #e8e8e8' }
      : { backgroundColor: '#95ec69', border: '1px solid #7ddb5a' };

    return (
      <div key={msg.id} className={`chat-bubble-wrapper ${alignClass}`}>
        <div className="chat-bubble-sender">{senderName}</div>
        <div className="chat-bubble" style={bubbleStyle}>
          <div className="chat-bubble-content">{msg.content || msg.title}</div>
        </div>
        <div className="chat-bubble-time">
          {msg.createdAt ? dayjs(msg.createdAt).format('MM/DD HH:mm') : ''}
        </div>
      </div>
    );
  };

  const isConversationSelected = !!selectedStaffAccountId;

  return (
    <div style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <h2 style={{ marginBottom: 16, flexShrink: 0 }}>客服消息</h2>

      <div style={{ flex: 1, display: 'flex', gap: 16, minHeight: 0 }}>
        {/* Conversation List Panel */}
        <Card
          title="咨询列表"
          style={{
            flex: showMobileList || !isConversationSelected ? '1 1 400px' : '0 0 360px',
            maxWidth: showMobileList || !isConversationSelected ? '100%' : 360,
            display: showMobileList || !isConversationSelected ? 'block' : 'block',
            overflow: 'hidden',
          }}
          bodyStyle={{ padding: 0, height: 'calc(100% - 57px)', display: 'flex', flexDirection: 'column' }}
        >
          {/* Search */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0' }}>
            <Form form={form} layout="inline" style={{ flexWrap: 'nowrap' }}>
              <Form.Item name="keyword" style={{ flex: 1, marginBottom: 0 }}>
                <Input
                  placeholder="员工姓名/ID/手机号"
                  allowClear
                  onPressEnter={handleSearch}
                />
              </Form.Item>
              <Form.Item style={{ marginBottom: 0 }}>
                <Space size="small">
                  <Button
                    type="primary"
                    icon={<SearchOutlined />}
                    onClick={handleSearch}
                    size="small"
                  >
                    搜索
                  </Button>
                  <Button icon={<ReloadOutlined />} onClick={handleReset} size="small" />
                </Space>
              </Form.Item>
            </Form>
          </div>

          {/* Conversation List */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
            ) : conversations.length === 0 ? (
              <Empty description="暂无咨询" style={{ padding: 40 }} />
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.staffAccountId}
                  onClick={() => openConversation(conv.staffAccountId)}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #f0f0f0',
                    cursor: 'pointer',
                    backgroundColor:
                      selectedStaffAccountId === conv.staffAccountId
                        ? '#e6f7ff'
                        : 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (selectedStaffAccountId !== conv.staffAccountId) {
                      (e.target as HTMLDivElement).style.backgroundColor = '#fafafa';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedStaffAccountId !== conv.staffAccountId) {
                      (e.target as HTMLDivElement).style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <Space>
                      <strong>{conv.staffName}</strong>
                      <span style={{ color: '#999', fontSize: 12 }}>{conv.staffId}</span>
                    </Space>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: '#999', fontSize: 12 }}>
                        {conv.latestMessageAt
                          ? dayjs(conv.latestMessageAt).format('MM/DD HH:mm')
                          : ''}
                      </span>
                      {conv.unreadCount > 0 && (
                        <Badge
                          count={conv.unreadCount}
                          size="small"
                          style={{ backgroundColor: '#ff4d4f' }}
                        />
                      )}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: '#999' }}>
                    <span>{conv.staffPhone}</span>
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: '#666',
                      marginTop: 4,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {conv.latestMessage?.content || '(无内容)'}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination info */}
          {total > pageSize && (
            <div style={{ padding: '8px 16px', borderTop: '1px solid #f0f0f0', textAlign: 'center' }}>
              <Space>
                <Button
                  size="small"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  上一页
                </Button>
                <span style={{ fontSize: 12, color: '#999' }}>
                  {page} / {Math.ceil(total / pageSize)}
                </span>
                <Button
                  size="small"
                  disabled={page >= Math.ceil(total / pageSize)}
                  onClick={() => setPage((p) => p + 1)}
                >
                  下一页
                </Button>
              </Space>
            </div>
          )}
        </Card>

        {/* Chat Panel */}
        <Card
          style={{
            flex: 1,
            display: isConversationSelected || !showMobileList ? 'flex' : 'none',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
          bodyStyle={{
            padding: 0,
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
          title={
            chatStaff ? (
              <Space>
                <Button
                  type="text"
                  icon={<LeftOutlined />}
                  onClick={backToList}
                  style={{ marginLeft: -8 }}
                />
                <strong>{chatStaff.staffName}</strong>
                <span style={{ color: '#999', fontSize: 13 }}>{chatStaff.staffId}</span>
                <span style={{ color: '#999', fontSize: 13 }}>{chatStaff.staffPhone}</span>
              </Space>
            ) : (
              '聊天详情'
            )
          }
          extra={
            chatStaff && (
              <Button icon={<ExportOutlined />} onClick={handleExport} size="small">
                导出聊天记录
              </Button>
            )
          }
        >
          {!isConversationSelected ? (
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Empty description="选择左侧咨询开始对话" />
            </div>
          ) : chatLoading ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Spin tip="加载聊天记录..." />
            </div>
          ) : (
            <>
              {/* Messages */}
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '16px 20px',
                  backgroundColor: '#f5f5f5',
                }}
              >
                {chatMessages.length === 0 ? (
                  <Empty description="暂无消息" />
                ) : (
                  chatMessages.map((msg) => renderChatBubble(msg))
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Reply Input */}
              <div
                style={{
                  borderTop: '1px solid #e8e8e8',
                  padding: '12px 16px',
                  display: 'flex',
                  gap: 12,
                  alignItems: 'flex-end',
                }}
              >
                <TextArea
                  rows={3}
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="输入回复内容，Enter 发送，Shift+Enter 换行"
                  maxLength={1000}
                  style={{ flex: 1 }}
                />
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={handleSendReply}
                  loading={replyLoading}
                  style={{ height: 62 }}
                >
                  发送
                </Button>
              </div>
            </>
          )}
        </Card>
      </div>

      {/* CSS for chat bubbles */}
      <style>{`
        .chat-bubble-wrapper {
          margin-bottom: 16px;
          display: flex;
          flex-direction: column;
          max-width: 70%;
        }
        .chat-bubble-left {
          align-items: flex-start;
        }
        .chat-bubble-right {
          align-items: flex-end;
          margin-left: auto;
        }
        .chat-bubble-sender {
          font-size: 12px;
          color: #999;
          margin-bottom: 4px;
        }
        .chat-bubble {
          padding: 10px 14px;
          border-radius: 8px;
          word-break: break-word;
          white-space: pre-wrap;
        }
        .chat-bubble-content {
          font-size: 14px;
          line-height: 1.5;
        }
        .chat-bubble-time {
          font-size: 11px;
          color: #bbb;
          margin-top: 4px;
        }
      `}</style>
    </div>
  );
};

export default SupportPage;
