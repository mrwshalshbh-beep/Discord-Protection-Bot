const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, SelectMenuBuilder } = require('discord.js');
const ServerSettings = require('../models/ServerSettings');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('تفعيل حماية البوت للسيرفر'),
  async execute(interaction) {
    try {
      const serverId = interaction.guildId;
      let settings = await ServerSettings.findOne({ serverId });

      if (settings) {
        return interaction.reply({ content: '⚠️ البوت مفعل بالفعل على هذا السيرفر!', ephemeral: true });
      }

      settings = new ServerSettings({
        serverId,
        serverName: interaction.guild.name,
        serverImage: interaction.guild.iconURL()
      });

      await settings.save();

      const embed = new EmbedBuilder()
        .setTitle('✅ تم إعداد البوت بنجاح!')
        .setDescription('نظام الحماية نشط الآن على سيرفرك')
        .setThumbnail(interaction.guild.iconURL())
        .setColor('#00ff00')
        .addFields(
          { name: '🖥️ السيرفر', value: interaction.guild.name, inline: true },
          { name: '🟢 الحالة', value: 'نشط', inline: true },
          { name: '🛡️ الحماية', value: 'مفعلة', inline: true },
          { name: '📝 التعليمات', value: 'استخدم `/whitelist` لإدارة المسموح لهم', inline: false }
        )
        .setFooter({ text: 'نظام حماية متقدم لخادمك' });

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('خطأ في أمر الإعداد:', error);
      await interaction.reply({ content: '❌ فشل الإعداد!', ephemeral: true });
    }
  }
};