const ServerSettings = require('../models/ServerSettings');
const Logger = require('../utils/logger');

module.exports = {
  name: 'guildCreate',
  async execute(guild, client) {
    try {
      const settings = new ServerSettings({
        serverId: guild.id,
        serverName: guild.name,
        serverImage: guild.iconURL()
      });

      await settings.save();

      await Logger.logAction(
        guild.id,
        'تم_إضافة_البوت',
        { id: client.user.id, username: client.user.username },
        { type: 'سيرفر', id: guild.id, name: guild.name },
        { memberCount: guild.memberCount },
        'منخفضة',
        'حماية'
      );

      console.log(`✅ تم إضافة البوت إلى: ${guild.name} (${guild.id})`);
    } catch (error) {
      console.error('خطأ في حدث إنشاء السيرفر:', error);
    }
  }
};