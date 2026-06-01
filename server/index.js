const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');
const { generateToken, authMiddleware, SECRET } = require('./auth');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use(express.static(path.join(__dirname, '../client/build')));

// Ensure uploads directory exists
const fs = require('fs');
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Multer for file uploads up to 2GB
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage, limits: { fileSize: 2147483648 } });

// ----------------------- Auth -----------------------
app.post('/api/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
  const hashed = bcrypt.hashSync(password, 10);
  const recovery = Math.random().toString(36).slice(2, 8);
  try {
    const info = db.prepare('INSERT INTO users (username, password, recovery_code) VALUES (?, ?, ?)').run(username, hashed, recovery);
    const token = generateToken({ id: info.lastInsertRowid, username });
    res.json({ token, user: { id: info.lastInsertRowid, username, recovery_code: recovery } });
  } catch (err) {
    res.status(400).json({ error: 'Username already exists' });
  }
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user || !bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: 'Invalid credentials' });
  const token = generateToken(user);
  db.prepare('UPDATE users SET online = 1 WHERE id = ?').run(user.id);
  res.json({ token, user: { id: user.id, username, bio: user.bio, profile_pic: user.profile_pic, recovery_code: user.recovery_code } });
});


app.get('/api/me', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { password, ...rest } = user;
  res.json(rest);
});

app.put('/api/me', authMiddleware, (req, res) => {
  const { bio, profile_pic, profile_music, theme, bg_image, privacy_lastseen, privacy_online, birthdate } = req.body;
  db.prepare(`UPDATE users SET bio=?, profile_pic=?, profile_music=?, theme=?, bg_image=?, privacy_lastseen=?, privacy_online=?, birthdate=? WHERE id=?`)
    .run(bio, profile_pic, profile_music, theme, bg_image, privacy_lastseen, privacy_online, birthdate, req.user.id);
  res.json({ success: true });
});

app.post('/api/upload', authMiddleware, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  res.json({ url: '/uploads/' + req.file.filename });
});

// ----------------------- Chats -----------------------
app.post('/api/chats', authMiddleware, (req, res) => {
  const { type, title, with_user_id } = req.body;
  const creator = req.user.id;
  const now = Date.now();
  const chatTitle = type === 'private' ? null : title;
  const info = db.prepare('INSERT INTO chats (type, title, creator_id, created_at) VALUES (?,?,?,?)').run(type, chatTitle, creator, now);
  const chatId = info.lastInsertRowid;
  db.prepare('INSERT INTO chat_members (user_id, chat_id, role) VALUES (?,?,?)').run(creator, chatId, 'owner');
  if (type === 'private' && with_user_id) {
    db.prepare('INSERT INTO chat_members (user_id, chat_id, role) VALUES (?,?,?)').run(with_user_id, chatId, 'member');
  }
  res.json({ id: chatId, type, title: chatTitle });
});

app.get('/api/chats', authMiddleware, (req, res) => {
  const rows = db.prepare(`
    SELECT c.*, 
      (SELECT message FROM messages WHERE chat_id = c.id AND deleted=0 ORDER BY created_at DESC LIMIT 1) as last_message
    FROM chats c JOIN chat_members m ON c.id = m.chat_id WHERE m.user_id = ?
    ORDER BY (SELECT created_at FROM messages WHERE chat_id = c.id AND deleted=0 ORDER BY created_at DESC LIMIT 1) DESC
  `).all(req.user.id);
  res.json(rows);
});

app.get('/api/messages/:chatId', authMiddleware, (req, res) => {
  const msgs = db.prepare('SELECT * FROM messages WHERE chat_id = ? AND deleted = 0 ORDER BY created_at ASC').all(req.params.chatId);
  res.json(msgs);
});

app.post('/api/messages/:chatId/pin', authMiddleware, (req, res) => {
  const { message_id } = req.body;
  db.prepare('UPDATE messages SET pinned = 1 WHERE id = ? AND chat_id = ?').run(message_id, req.params.chatId);
  res.json({ success: true });
});

app.post('/api/messages/:chatId/delete', authMiddleware, (req, res) => {
  const { message_id } = req.body;
  db.prepare('UPDATE messages SET deleted = 1 WHERE id = ? AND chat_id = ?').run(message_id, req.params.chatId);
  res.json({ success: true });
});

app.get('/api/search/users', authMiddleware, (req, res) => {
  const q = req.query.q;
  const users = db.prepare('SELECT id, username, bio, profile_pic FROM users WHERE username LIKE ? LIMIT 20').all('%'+q+'%');
  res.json(users);
});

// ----------------------- Socket.io -----------------------
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join', (userId) => {
    socket.join('user_' + userId);
  });

  socket.on('typing', ({ chat_id, user_id }) => {
    const members = db.prepare('SELECT user_id FROM chat_members WHERE chat_id = ?').all(chat_id);
    members.forEach(m => {
      io.to('user_' + m.user_id).emit('typing', { chat_id, user_id });
    });
  });


  socket.on('message', (data) => {
    const { chat_id, sender_id, message, type, reply_to, media_url, media_type } = data;
    const now = Date.now();
    const info = db.prepare('INSERT INTO messages (chat_id, sender_id, message, type, reply_to, media_url, media_type, created_at) VALUES (?,?,?,?,?,?,?,?)')
      .run(chat_id, sender_id, message, type, reply_to, media_url, media_type, now);
    const messageId = info.lastInsertRowid;
    
    const newMessage = db.prepare('SELECT * FROM messages WHERE id = ?').get(messageId);
    
    const members = db.prepare('SELECT user_id FROM chat_members WHERE chat_id = ?').all(chat_id);
    members.forEach(m => {
      io.to('user_' + m.user_id).emit('new-message', newMessage);
    });
  });


  socket.on('call-user', ({ toUserId, signal, from }) => {
    io.to('user_' + toUserId).emit('incoming-call', { signal, from });
  });

  socket.on('accept-call', ({ toUserId, signal }) => {
    io.to('user_' + toUserId).emit('call-accepted', signal);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`HashChat server running on port ${PORT}`);
});
