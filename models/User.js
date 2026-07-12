const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: [true, 'اسم المستخدم مطلوب'], 
    unique: true, 
    trim: true,
    minlength: [3, 'الاسم يجب أن يكون 3 أحرف على الأقل']
  },
  pin: { 
    type: String, 
    required: [true, 'الرمز السري مطلوب'],
    minlength: [4, 'الرمز السري يجب أن يكون 4 أرقام']
  }
}, { timestamps: true });

// تشفير الـ PIN تلقائياً قبل الحفظ
UserSchema.pre('save', async function () {
  if (!this.isModified('pin')) return;
  const salt = await bcrypt.genSalt(10);
  this.pin = await bcrypt.hash(this.pin, salt);
});

// دالة المقارنة
UserSchema.methods.matchPin = async function (enteredPin) {
  return await bcrypt.compare(enteredPin, this.pin);
};

module.exports = mongoose.model('User', UserSchema);