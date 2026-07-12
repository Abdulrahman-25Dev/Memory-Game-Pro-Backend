require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const User = require('./models/User');
const Score = require('./models/Score');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// الاتصال بـ MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB 🍃'))
  .catch((err) => console.error('Error connecting to MongoDB:', err));

// 📌 الـ Endpoint الأساسية للتأكد من التوصيل
app.get('/', (req, res) => {
  res.json({ message: "Connected successfully! 🚀" });
});

// --- 🔐 1. ENDPOINT: التحقق من اسم المستخدم ---
app.post('/api/auth/check', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ message: "اسم المستخدم مطلوب" });

    // البحث عن المستخدم (بدون التحسس لحالة الأحرف العادية)
    const user = await User.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } });

    if (user) {
      // المستخدم مسجل مسبقاً، اطلب الـ PIN منه في الفرونت إند
      return res.json({ isNewUser: false, message: "مرحباً بعودتك! الرجاء إدخال الرمز السري." });
    } else {
      // المستخدم جديد
      return res.json({ isNewUser: true, message: "لاعب جديد! اختر رمزاً سرياً مكوناً من 4 أرقام." });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- 🔑 2. ENDPOINT: تسجيل الدخول أو إنشاء حساب جديد ---
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, pin } = req.body;
    if (!username || !pin) return res.status(400).json({ message: "جميع الحقول مطلوبة" });

    let user = await User.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } });

    if (user) {
      // إذا كان قديماً، نقارن الـ PIN المشفرة
      const isMatch = await user.matchPin(pin);
      if (!isMatch) return res.status(401).json({ message: "الرمز السري PIN غير صحيح لهذا المحارب!" });
    } else {
      // إذا كان جديداً، ننشئ له حساباً ويتم تشفير الـ PIN تلقائياً بفضل الـ Pre-save middleware
      user = new User({ username, pin });
      await user.save();
    }

    res.status(200).json({ 
      message: "تم الدخول بنجاح! جاهز للتحدي 🎯", 
      userId: user._id, 
      username: user.username 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- 🏆 3. ENDPOINT: حفظ نتيجة جولة جديدة ---
app.post('/api/scores', async (req, res) => {
  try {
    const { userId, moves, timeInSeconds, difficulty, category } = req.body;

    if (!userId || !moves || !timeInSeconds || !difficulty || !category) {
      return res.status(400).json({ message: "جميع بيانات الجولة مطلوبة للحفظ" });
    }

    const newScore = new Score({ userId, moves, timeInSeconds, difficulty, category });
    await newScore.save();

    res.status(201).json({ message: "تم تسجيل السكور وحفظه في لوحة الأبطال! 🥇", score: newScore });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- 📊 4. ENDPOINT: جلب قائمة المتصدرين (Leaderboard) ---
app.get('/api/leaderboard', async (req, res) => {
  try {
    // نأخذ مستوى الصعوبة من الـ Query parameters (الافتراضي هو medium)
    const difficulty = req.query.difficulty || 'medium';

    const topScores = await Score.find({ difficulty })
      .populate('userId', 'username') // لدمج اسم المستخدم من جدول الـ User بدلاً من الـ ID فقط
      .sort({ moves: 1, timeInSeconds: 1 }) // الترتيب تصاعدياً: الأقل في المحاولات أولاً، ثم الأقل في الوقت
      .limit(10); // جلب أعلى 10 لاعبين فقط

    // تعديل شكل البيانات لتسهيل قراءتها في الفرونت إند
    const formattedLeaderboard = topScores.map((score, index) => ({
      rank: index + 1,
      username: score.userId ? score.userId.username : "لاعب مجهول",
      moves: score.moves,
      timeInSeconds: score.timeInSeconds,
      category: score.category,
      date: score.createdAt
    }));

    res.json(formattedLeaderboard);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// تشغيل السيرفر
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`السيرفر يعمل الآن على المنفذ: http://localhost:${PORT}`);
});