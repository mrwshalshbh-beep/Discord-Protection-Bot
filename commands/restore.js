const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const ServerBackup = require('../models/ServerBackup');
const BackupManager = require('../utils/backup');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('restore')
    .setDescription('🔄 استعادة السيرفر من نسخة احتياطية'),
  async execute(interaction) {
    try {
      const serverId = interaction.guildId;
      const latestBackup = await ServerBackup.findOne({ serverId }).sort({ createdAt: -1 });

      if (!latestBackup) {
        const noBackupEmbed = new EmbedBuilder()
          .setTitle('❌ لا توجد نسخ احتياطية')
          .setDescription('لم يتم العثور على أي نسخ احتياطية للسيرفر')
          .setColor('#ff0000');
        return interaction.reply({ embeds: [noBackupEmbed], ephemeral: true });
      }

      const restoreButtons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('restore_channels')
          .setLabel('📝 استعادة الرومات')
          .setEmoji('📝')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('restore_roles')
          .setLabel('🎖️ استعادة الرتب')
          .setEmoji('🎖️')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('restore_all')
          .setLabel('⚡ استعادة كل شيء')
          .setEmoji('⚡')
          .setStyle(ButtonStyle.Danger)
      );

      const embed = new EmbedBuilder()
        .setTitle('🔄 خيارات الاستعادة')
        .setDescription('اختر ما تريد استعادته من النسخة الاحتياطية الأخيرة')
        .setColor('#ff9900')
        .setThumbnail(interaction.guild.iconURL())
        .addFields(
          { name: '📦 معرف النسخة', value: `\`${latestBackup._id}\``, inline: false },
          { name: '🎖️ الرتب المتاحة', value: latestBackup.backupData.roles.length.toString(), inline: true },
          { name: '📝 الرومات المتاحة', value: latestBackup.backupData.channels.length.toString(), inline: true },
          { name: '🔗 الويب هوك', value: latestBackup.backupData.webhooks.length.toString(), inline: true },
          { name: '⏰ تاريخ النسخة', value: `<t:${Math.floor(latestBackup.createdAt / 1000)}:R>`, inline: true },
          { name: '⚠️ ملاحظة مهمة', value: 'سيتم استعادة **4 عناصر كحد أقصى** من كل نوع للحفاظ على الأمان', inline: false }
        )
        .setFooter({ text: '🛡️ اضغط على الزر المناسب للاستعادة' });

      await interaction.reply({ embeds: [embed], components: [restoreButtons], ephemeral: true });
    } catch (error) {
      console.error('خطأ في الاستعادة:', error);
      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ حدث خطأ')
        .setDescription('حدث خطأ أثناء محاولة الاستعادة')
        .setColor('#ff0000');
      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
  }
};