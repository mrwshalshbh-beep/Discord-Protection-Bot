const ServerSettings = require('../models/ServerSettings');

module.exports = {
  name: 'guildDelete',
  async execute(guild, client) {
    try {
      await ServerSettings.deleteOne({ serverId: guild.id });
      console.log(`❌ تم حذف البوت من: ${guild.name}`);
    } catch (error) {
      console.error('خطأ في حدث حذف السيرفر:', error);
    }
  }
};