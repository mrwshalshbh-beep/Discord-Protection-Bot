const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const ServerSettings = require('../models/ServerSettings');
const ProtectionManager = require('../utils/protection');
const Logger = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('whitelist')
    .setDescription('🛡️ إدارة متقدمة للقائمة البيضاء والتخطي'),
  async execute(interaction) {
    try {
      const serverId = interaction.guildId;
      const settings = await ServerSettings.findOne({ serverId });

      if (!settings) {
        const errorEmbed = new EmbedBuilder()
          .setTitle('❌ خطأ')
          .setDescription('البوت غير مفعل! استخدم `/setup` أولاً')
          .setColor('#ff0000');
        return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }

      // القائمة الرئيسية
      const mainMenu = new StringSelectMenuBuilder()
        .setCustomId('whitelist_main_menu')
        .setPlaceholder('اختر ما تريد إدارته...')
        .addOptions(
          {
            label: '👥 إدارة الأشخاص الموثوقين',
            value: 'manage_users',
            emoji: '👤',
            description: 'أضف أو أزل أشخاص موثوقين'
          },
          {
            label: '🤖 إدارة البوتات',
            value: 'manage_bots',
            emoji: '🤖',
            description: 'تحكم في البوتات المسموح بها'
          },
          {
            label: '🎖️ إدارة الرتب',
            value: 'manage_roles',
            emoji: '🎖️',
            description: 'تخطي لإضافة رتب معينة'
          },
          {
            label: '📝 إدارة الرومات',
            value: 'manage_channels',
            emoji: '📝',
            description: 'تخطي لتعديل رومات معينة'
          },
          {
            label: '🔗 إدارة الويب هوك',
            value: 'manage_webhooks',
            emoji: '🔗',
            description: 'تخطي لإدارة الويب هوك'
          },
          {
            label: '⚙️ إعدادات الحماية',
            value: 'protection_settings',
            emoji: '⚙️',
            description: 'تفعيل/تعطيل الحماية'
          }
        );

      const mainRow = new ActionRowBuilder().addComponents(mainMenu);

      const mainEmbed = new EmbedBuilder()
        .setTitle('🛡️ نظام إدارة الحماية والتخطي')
        .setDescription('مرحباً! اختر من القائمة أدناه ما تريد إدارته')
        .setColor('#0099ff')
        .addFields(
          {
            name: '👥 الأشخاص الموثوقين',
            value: `${settings.trustedUsers.length} شخص`,
            inline: true
          },
          {
            name: '🤖 البوتات المسموح بها',
            value: `${settings.botWhitelist.length} بوت`,
            inline: true
          },
          {
            name: '🎖️ الرتب المتخطاة',
            value: `${settings.roleWhitelist.length} رتبة`,
            inline: true
          },
          {
            name: '📝 الرومات المتخطاة',
            value: `${settings.channelWhitelist.length} روم`,
            inline: true
          },
          {
            name: '🔗 الويب هوك المتخطاة',
            value: `${settings.webhookWhitelist.length} ويب هوك`,
            inline: true
          },
          {
            name: '⚙️ حالة الحماية',
            value: settings.punishmentSettings.enableAutoRestore ? '✅ مفعلة' : '❌ معطلة',
            inline: true
          }
        )
        .setFooter({ text: 'اختر من السلكت منيو أدناه' })
        .setThumbnail(interaction.guild.iconURL());

      await interaction.reply({ embeds: [mainEmbed], components: [mainRow] });

    } catch (error) {
      console.error('خطأ في أمر التخطي:', error);
      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ حدث خطأ')
        .setDescription('حدث خطأ ما! حاول مرة أخرى')
        .setColor('#ff0000');
      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
  }
};