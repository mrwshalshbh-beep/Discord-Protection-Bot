const ServerSettings = require('../models/ServerSettings');
const Logger = require('../utils/logger');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member, client) {
    try {
      const serverId = member.guild.id;
      const settings = await ServerSettings.findOne({ serverId });

      if (!settings) return;

      // فحص البوتات غير المصرحة
      if (member.user.bot) {
        const isWhitelisted = settings.botWhitelist.includes(member.id);
        
        if (!isWhitelisted) {
          // تسجيل محاولة الإضافة
          await Logger.logAction(
            serverId,
            'تم_محاولة_إضافة_بوت_غير_مصرح',
            { id: member.id, username: member.user.username },
            { type: 'بوت', id: member.id, name: member.user.username },
            { owner: member.user.owner?.id || 'مجهول' },
            'حرجة',
            'حماية'
          );

          // ركل البوت فوراً
          if (settings.punishmentSettings.kickBots) {
            try {
              await member.kick('بوت غير مصرح - تم رفضه من قبل نظام الحماية');
              
              await Logger.logAction(
                serverId,
                'تم_ركل_بوت_غير_مصرح',
                { id: 'نظام', username: 'نظام' },
                { type: 'بوت', id: member.id, name: member.user.username },
                { reason: 'لم يكن مدرجاً في القائمة البيضاء' },
                'حرجة',
                'عقاب'
              );

              console.log(`🚫 تم ركل البوت غير المصرح: ${member.user.username}`);
            } catch (e) {
              console.error('❌ فشل ركل البوت:', e);
            }
          }
        } else {
          // تسجيل إضافة بوت مصرح
          await Logger.logAction(
            serverId,
            'تم_إضافة_بوت_مصرح',
            { id: member.id, username: member.user.username },
            { type: 'بوت', id: member.id, name: member.user.username },
            {},
            'منخفضة',
            'حماية'
          );

          console.log(`✅ تم قبول البوت المصرح: ${member.user.username}`);
        }
      }
    } catch (error) {
      console.error('خطأ في معالج إضافة العضو:', error);
    }
  }
};