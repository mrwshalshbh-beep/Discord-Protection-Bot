const ServerSettings = require('../models/ServerSettings');
const Logger = require('../utils/logger');
const BackupManager = require('../utils/backup');

module.exports = {
  name: 'roleDelete',
  async execute(role, client) {
    try {
      const serverId = role.guild.id;
      const settings = await ServerSettings.findOne({ serverId });

      if (!settings) return;

      // تسجيل الحذف
      await Logger.logAction(
        serverId,
        'تم_حذف_رتبة',
        { id: 'مجهول', username: 'مجهول' },
        { type: 'رتبة', id: role.id, name: role.name },
        { permissions: role.permissions.bitfield },
        'حرجة',
        'حماية'
      );

      // الاستعادة التلقائية الفورية
      if (settings.punishmentSettings.enableAutoRestore) {
        const latestBackup = await BackupManager.getLatestBackup(serverId);
        if (latestBackup) {
          const roleData = latestBackup.backupData.roles.find(r => r.name === role.name);
          if (roleData) {
            try {
              await role.guild.roles.create({
                name: roleData.name,
                color: roleData.color,
                permissions: BigInt(roleData.permissions),
                hoist: roleData.hoist,
                mentionable: roleData.mentionable
              });

              await Logger.logAction(
                serverId,
                'تم_استعادة_رتبة_تلقائياً',
                { id: 'نظام', username: 'نظام' },
                { type: 'رتبة', id: role.id, name: role.name },
                { reason: 'تم كشف حذف غير مصرح' },
                'عالية',
                'استعادة'
              );

              console.log(`✅ تم استعادة الرتبة: ${role.name} تلقائياً`);
            } catch (e) {
              console.error('❌ فشل استعادة الرتبة:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('خطأ في معالج حذف الرتبة:', error);
    }
  }
};