const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const BackupManager = require('../utils/backup');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('backup')
    .setDescription('💾 إنشاء نسخة احتياطية من السيرفر'),
  async execute(interaction) {
    try {
      await interaction.deferReply();

      const backup = await BackupManager.createBackup(interaction.guild, interaction.user.id);

      const embed = new EmbedBuilder()
        .setTitle('✅ تم إنشاء النسخة الاحتياطية')
        .setColor('#00ff00')
        .setThumbnail(interaction.guild.iconURL())
        .addFields(
          { name: '📦 معرف النسخة', value: `\`${backup._id}\``, inline: false },
          { name: '📝 اسم النسخة', value: backup.backupName, inline: false },
          { name: '🎖️ الرتب', value: backup.backupData.roles.length.toString(), inline: true },
          { name: '📝 الرومات', value: backup.backupData.channels.length.toString(), inline: true },
          { name: '🔗 الويب هوك', value: backup.backupData.webhooks.length.toString(), inline: true },
          { name: '💾 حجم النسخة', value: `${(backup.backupSize / 1024).toFixed(2)} KB`, inline: true },
          { name: '👤 أنشأها', value: `<@${interaction.user.id}>`, inline: true },
          { name: '⏰ الوقت', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }
        )
        .setFooter({ text: '🛡️ يمكنك استعادة هذه النسخة في أي وقت' });

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('خطأ في إنشاء النسخة:', error);
      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ فشل إنشاء النسخة')
        .setDescription('حدث خطأ أثناء محاولة إنشاء النسخة الاحتياطية')
        .setColor('#ff0000');
      await interaction.editReply({ embeds: [errorEmbed] });
    }
  }
};