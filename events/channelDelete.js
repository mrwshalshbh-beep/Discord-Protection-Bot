const ServerSettings = require('../models/ServerSettings');
const Logger = require('../utils/logger');
const BackupManager = require('../utils/backup');

module.exports = {
  name: 'channelDelete',
  async execute(channel, client) {
    try {
      const serverId = channel.guild.id;
      const settings = await ServerSettings.findOne({ serverId });

      if (!settings) return;

      // تسجيل الحذف
      await Logger.logAction(
        serverId,
        'تم_حذف_روم',
        { id: 'مجهول', username: 'مجهول' },
        { type: 'روم', id: channel.id, name: channel.name },
        { channelType: channel.type },
        'حرجة',
        'حماية'
      );

      // الاستعادة التلقائية الفورية
      if (settings.punishmentSettings.enableAutoRestore) {
        try {
          // إنشاء روم جديدة بنفس الخصائص
          await channel.guild.channels.create({
            name: channel.name,
            type: channel.type,
            topic: channel.topic,
            nsfw: channel.nsfw,
            position: channel.position
          });

          // تسجيل الاستعادة
          await Logger.logAction(
            serverId,
            'تم_استعادة_روم_تلقائياً',
            { id: 'نظام', username: 'نظام' },
            { type: 'روم', id: channel.id, name: channel.name },
            { reason: 'تم كشف حذف غير مصرح' },
            'عالية',
            'استعادة'
          );

          console.log(`✅ تم استعادة الروم: ${channel.name} تلقائياً`);
        } catch (e) {
          console.error('❌ فشل استعادة الروم:', e);
        }
      }
    } catch (error) {
      console.error('خطأ في معالج حذف الروم:', error);
    }
  }
};