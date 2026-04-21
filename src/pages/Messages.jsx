import { useState, useEffect, useRef } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';

export default function Messages() {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [chatPartners, setChatPartners] = useState({});
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!user?.id) return;
    api.chats.getAll(user.id)
      .then(async data => {
        setChats(data || []);
        const partners = {};
        for (const chat of data || []) {
          const partnerId = chat.ownerId === user.id ? chat.memberId : chat.ownerId;
          try {
            const u = await api.users.getById(partnerId);
            partners[chat.id] = u;
          } catch {}
        }
        setChatPartners(partners);
      })
      .catch(() => {});
  }, [user?.id]);

  useEffect(() => {
    if (!selectedChat) return;
    api.chats.getMessages(selectedChat.id).then(setMessages).catch(() => {});
    const interval = setInterval(() => {
      api.chats.getMessages(selectedChat.id).then(setMessages).catch(() => {});
    }, 3000);
    return () => clearInterval(interval);
  }, [selectedChat?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(e) {
    e.preventDefault();
    if (!text.trim() || !selectedChat || !user?.id) return;
    setSending(true);
    try {
      const msg = await api.chats.sendMessage(selectedChat.id, user.id, text.trim());
      setMessages(prev => [...prev, msg]);
      setText('');
    } catch {}
    setSending(false);
  }

  const partnerName = (chat) => {
    const partner = chatPartners[chat.id];
    return partner?.login || partner?.email || 'Пользователь';
  };

  const partnerInitials = (chat) => {
    const name = partnerName(chat);
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Header />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Chat list */}
        <aside style={{
          width: 280,
          flexShrink: 0,
          background: 'var(--surface)',
          borderRight: '1px solid var(--border)',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <div style={{ padding: '14px 16px', fontSize: 13, fontWeight: 700, borderBottom: '1px solid var(--border)' }}>
            Сообщения
          </div>
          {chats.length === 0 ? (
            <div style={{ padding: 20, fontSize: 13, color: 'var(--muted)', textAlign: 'center' }}>
              Нет диалогов.<br />Найдите объявление и напишите продавцу.
            </div>
          ) : (
            chats.map(chat => (
              <div
                key={chat.id}
                onClick={() => setSelectedChat(chat)}
                style={{
                  padding: '12px 16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  background: selectedChat?.id === chat.id ? 'var(--accent-soft)' : 'none',
                  borderLeft: selectedChat?.id === chat.id ? '3px solid var(--accent)' : '3px solid transparent',
                }}
                onMouseEnter={e => { if (selectedChat?.id !== chat.id) e.currentTarget.style.background = 'var(--bg)'; }}
                onMouseLeave={e => { if (selectedChat?.id !== chat.id) e.currentTarget.style.background = 'none'; }}
              >
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'var(--accent)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {partnerInitials(chat)}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {partnerName(chat)}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                    {new Date(chat.lastUpdate).toLocaleDateString('ru')}
                  </div>
                </div>
              </div>
            ))
          )}
        </aside>

        {/* Chat window */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg)', overflow: 'hidden' }}>
          {!selectedChat ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: 13 }}>
              Выберите диалог
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div style={{
                padding: '12px 20px',
                background: 'var(--surface)',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                flexShrink: 0,
              }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'var(--accent)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {partnerInitials(selectedChat)}
                </div>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{partnerName(selectedChat)}</span>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {messages.length === 0 && (
                  <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13, paddingTop: 40 }}>
                    Начните диалог
                  </div>
                )}
                {messages.map(msg => {
                  const isMine = msg.senderId === user?.id;
                  return (
                    <div
                      key={msg.id}
                      style={{
                        display: 'flex',
                        justifyContent: isMine ? 'flex-end' : 'flex-start',
                      }}
                    >
                      <div style={{
                        maxWidth: '70%',
                        padding: '8px 12px',
                        background: isMine ? 'var(--accent)' : 'var(--surface)',
                        color: isMine ? '#fff' : 'var(--text)',
                        borderRadius: isMine ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                        fontSize: 13,
                        lineHeight: 1.5,
                        border: isMine ? 'none' : '1px solid var(--border)',
                      }}>
                        {msg.text}
                        <div style={{ fontSize: 10, opacity: 0.7, marginTop: 3, textAlign: 'right' }}>
                          {new Date(msg.sendingTime).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form
                onSubmit={sendMessage}
                style={{
                  padding: '12px 20px',
                  background: 'var(--surface)',
                  borderTop: '1px solid var(--border)',
                  display: 'flex',
                  gap: 10,
                  flexShrink: 0,
                }}
              >
                <input
                  type="text"
                  value={text}
                  onChange={e => setText(e.target.value)}
                  placeholder="Напишите сообщение..."
                  style={{
                    flex: 1,
                    padding: '9px 12px',
                    fontSize: 13,
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg)',
                    outline: 'none',
                    color: 'var(--text)',
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                />
                <button
                  type="submit"
                  disabled={sending || !text.trim()}
                  style={{
                    padding: '9px 18px',
                    fontSize: 13,
                    fontWeight: 600,
                    background: sending || !text.trim() ? 'var(--border)' : 'var(--accent)',
                    color: sending || !text.trim() ? 'var(--muted)' : '#fff',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    cursor: sending || !text.trim() ? 'not-allowed' : 'pointer',
                  }}
                >
                  Отправить
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
