const mongoose = require('mongoose');

const ScoreSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  moves: { type: Number, required: true },
  timeInSeconds: { type: Number, required: true },
  difficulty: { 
    type: String, 
    enum: ['easy', 'medium', 'hard'], 
    required: true 
  },
  category: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Score', ScoreSchema);