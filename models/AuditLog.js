const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  serverId: {
    type: String,
    required: true,
    index: true
  },
  action: String,
  actionType: String,
  actor: {
    id: String,
    username: String
  },
  target: {
    type: String,
    id: String,
    name: String
  },
  details: Object,
  severity: { type: String, enum: ['منخفضة', 'متوسطة', 'عالية', 'حرجة'], default: 'متوسطة' },
  timestamp: { type: Date, default: Date.now },
  channelId: String
});

module.exports = mongoose.model('AuditLog', auditLogSchema);