import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';

const API = axios.create({ baseURL: '' });
API.interceptors.request.use(config => {
  const token = localStorage.getItem('hashchat_token');
  if (token) config.headers.Authorization = 'Bearer ' + token;
  return config;
});

const socket = io();

// Login Page
function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post('/api/login', { username, password });
      localStorage.setItem('hashchat_token', res.data.token);
      localStorage.setItem('hashchat_user', JSON.stringify(res.data.user));
      onLogin(res.data.token);
      navigate('/chats');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-box">
        <h1>HashChat</h1>
        <form onSubmit={handleSubmit}>
          <input type="text" placeholder="نام کاربری" value={username} onChange={e => setUsername(e.target.value)} required />
          <input type="password" placeholder="رمز عبور" value={password} onChange={e => setPassword(e.target.value)} required />
          {error && <p style={{color: 'var(--danger)', marginBottom: 15}}>{error}</p>}
          <button type="submit">ورود</button>
        </form>
        <p>حساب ندارید؟ <Link to="/register">ثبت‌نام</Link></p>
      </div>
    </div>
  );
}

// Register Page
function Register({ onRegister }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post('/api/register', { username, password });
      localStorage.setItem('hashchat_token', res.data.token);
      localStorage.setItem('hashchat_user', JSON.stringify(res.data.user));
      onRegister(res.data.token);
      navigate('/chats');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-box">
        <h1>ثبت‌نام در HashChat</h1>
        <form onSubmit={handleSubmit}>
          <input type="text" placeholder="نام کاربری" value={username} onChange={e => setUsername(e.target.value)} required />
          <input type="password" placeholder="رمز عبور" value={password} onChange={e => setPassword(e.target.value)} required />
          {error && <p style={{color: 'var(--danger)', marginBottom: 15}}>{error}</p>}
          <button type="submit">ثبت‌نام</button>
        </form>
        <p>حساب دارید؟ <Link to="/login">ورود</Link></p>
      </div>
    </div>
  );
}

// Sidebar Component
function Sidebar({ user, onLogout }) {
  const navigate = useNavigate();
  
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1>HashChat</h1>
      </div>
      <div className="sidebar-menu">
        <div className="menu-item" onClick={() => navigate('/chats')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          <span>چت‌ها</span>
        </div>
        <div className="menu-item" onClick={() => navigate('/calls')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          <span>تماس‌ها</span>
        </div>
        <div className="menu-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
          <span>پیام‌های ذخیره شده</span>
        </div>
        <div className="menu-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 8v13H3V8M1 3h22v5H1z"/></svg>
          <span>آرشیو شده</span>
        </div>
        <div className="menu-item" onClick={() => navigate('/settings')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          <span>تنظیمات</span>
        </div>
      </div>
      <div className="sidebar-footer">
        <p>HashChat v2.0</p>
        <p style={{marginTop: 5}}>درباره</p>
      </div>
    </div>
  );
}

// Chat List Page
function ChatList({ token, logout }) {
  const [chats, setChats] = useState([]);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('hashchat_user') || '{}');
    setUser(userData);
    loadChats();
    
    socket.emit('join', userData.id);
    socket.on('new-message', (msg) => {
      loadChats();
    });
    
    return () => {
      socket.off('new-message');
    };
  }, []);

  const loadChats = async () => {
    try {
      const res = await API.get('/api/chats');
      setChats(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredChats = activeTab === 'all' ? chats : chats.filter(c => c.type === activeTab);

  return (
    <div className="app">
      <Sidebar user={user} onLogout={logout} />
      <div className="main-content">
        <div className="chat-list">
          <div className="chat-list-header">
            <div className="search-box">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input type="text" placeholder="جستجو" />
            </div>
          </div>
          <div className="tabs">
            {['all', 'private', 'group', 'channel'].map(tab => (
              <div key={tab} className={`tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
                {tab === 'all' ? 'همه' : tab === 'private' ? 'خصوصی' : tab === 'group' ? 'گروه' : 'کانال'}
              </div>
            ))}
          </div>
          {filteredChats.length === 0 ? (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              <h2>هنوز چتی ندارید</h2>
              <p>برای شروع یک چت جدید بسازید</p>
            </div>
          ) : (
            filteredChat.map(chat => (
              <div key={chat.id} className="chat-item" onClick={() => navigate(`/chat/${chat.id}`)}>
                <div className="chat-avatar">{chat.title ? chat.title[0] : '?'}</div>
                <div className="chat-info">
                  <div className="chat-name">{chat.title || 'چت خصوصی'}</div>
                  <div className="chat-last-message">{chat.last_message || 'پیامی نیست'}</div>
                </div>
                <div className="chat-meta">
                  <div className="chat-time"></div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <button className="fab" onClick={() => navigate('/new-chat')}>+</button>
    </div>
  );
}

// Chat Room Page
function ChatRoom({ token }) {
  const { id } = useParams();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [chat, setChat] = useState(null);
  const [user, setUser] = useState(null);
  const messagesEndRef = React.useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('hashchat_user') || '{}');
    setUser(userData);
    loadChat();
    loadMessages();
    
    socket.on('new-message', (msg) => {
      if (msg.chat_id == id) {
        setMessages(prev => [...prev, msg]);
        scrollToBottom();
      }
    });
    
    return () => {
      socket.off('new-message');
    };
  }, [id]);


  const loadChat = async () => {
    try {
      const res = await API.get(`/api/chats`);
      const found = res.data.find(c => c.id == id);
      setChat(found);
    } catch (err) {
      console.error(err);
    }
  };

  const loadMessages = async () => {
    try {
      const res = await API.get(`/api/messages/${id}`);
      setMessages(res.data);
      scrollToBottom();
    } catch (err) {
      console.error(err);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    const messageData = {
      chat_id: parseInt(id),
      sender_id: user.id,
      message: input,
      type: 'text'
    };
    
    socket.emit('message', messageData);
    setInput('');
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.getHours() + ':' + String(date.getMinutes()).padStart(2, '0');
  };

  return (
    <div className="chat-room">
      <div className="chat-room-header">
        <button className="back-btn" onClick={() => navigate('/chats')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <div className="chat-avatar">{chat?.title ? chat.title[0] : '?'}</div>
        <div className="chat-room-title">
          <h2>{chat?.title || 'چت خصوصی'}</h2>
          <p>آنلاین</p>
        </div>
      </div>
      <div className="messages">
        {messages.map(msg => (
          <div key={msg.id} className={`message ${msg.sender_id === user?.id ? 'sent' : 'received'}`}>
            {msg.message}
            <div className="message-time">{formatTime(msg.created_at)}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form className="message-input" onSubmit={sendMessage}>
        <input type="text" placeholder="پیام خود را بنویسید..." value={input} onChange={e => setInput(e.target.value)} />
        <button type="submit">ارسال</button>
      </form>
    </div>
  );
}

// Settings Page
function Settings({ token }) {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();


  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('hashchat_user') || '{}');
    setUser(userData);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('hashchat_token');
    localStorage.removeItem('hashchat_user');
    window.location.href = '/login';
  };

  return (
    <div className="app">
      <Sidebar user={user} onLogout={handleLogout} />
      <div className="main-content">
        <div className="settings-page">
          <h1>تنظیمات</h1>
          
          <div className="profile-section">
            <div className="profile-avatar">{user?.username?.[0]?.toUpperCase()}</div>
            <div className="profile-name">{user?.username}</div>
            <div className="profile-username">@{user?.username}</div>
            {user?.recovery_code && (
              <div className="recovery-code">کد بازیابی: {user.recovery_code}</div>
            )}
          </div>


          <div className="settings-section">
            <div className="settings-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              <span>ویرایش پروفایل</span>
            </div>
            <div className="settings-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              <span>اعلان‌ها</span>
            </div>
            <div className="settings-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              <span>حریم خصوصی و امنیت</span>
            </div>
            <div className="settings-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
              <span>ظاهر</span>
            </div>
            <div className="settings-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
              <span>زبان</span>
            </div>
            <div className="settings-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
              <span>مدیریت حساب‌ها</span>
            </div>
            <div className="settings-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
              <span>درباره HashChat</span>
            </div>
          </div>

          <button className="settings-item" style={{background: 'var(--danger)', color: 'white', borderRadius: 15}} onClick={handleLogout}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            <span>خروج از حساب</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// Main App
function App() {
  const [token, setToken] = useState(localStorage.getItem('hashchat_token') || '');
  const loginUser = (t) => {
    localStorage.setItem('hashchat_token', t);
    setToken(t);
  };
  const logout = () => {
    localStorage.removeItem('hashchat_token');
    localStorage.removeItem('hashchat_user');
    setToken('');
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!token ? <Login onLogin={loginUser} /> : <Navigate to="/chats" />} />
        <Route path="/register" element={!token ? <Register onRegister={loginUser} /> : <Navigate to="/chats" />} />
        <Route path="/chats" element={token ? <ChatList token={token} logout={logout} /> : <Navigate to="/login" />} />
        <Route path="/chat/:id" element={token ? <ChatRoom token={token} /> : <Navigate to="/login" />} />
        <Route path="/settings" element={token ? <Settings token={token} /> : <Navigate to="/login" />} />
        <Route path="*" element={<Navigate to="/login" />}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
