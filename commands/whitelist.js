const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, SelectMenuBuilder, StringSelectMenuBuilder } = require('discord.js');
const ServerSettings = require('../models/ServerSettings');
const ProtectionManager = require('../utils/protection');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('whitelist')
    .setDescription('إدارة قائمة التخطي والأشخاص الموثوقين')
    .addSubcommand(sub =>
      sub
        .setName('add_user')
        .setDescription('إضافة مستخدم موثوق')
        .addUserOption(opt => opt.setName('user').setDescription('المستخدم').setRequired(true))
        .addStringOption(opt =>
          opt.setName('action')
            .setDescription('الإجراء المسموح به')
            .addChoices(
              { name: '🎖️ إضافة رتب', value: 'role_assign' },
              { name: '📝 تعديل رومات', value: 'channel_modify' },
              { name: '🤖 إضافة بوتات', value: 'bot_add' },
              { name: '🔗 إدارة ويب هوك', value: 'webhook_manage' },
              { name: '🔒 تعديل صلاحيات', value: 'permission_change' },
              { name: '⚙️ إعدادات السيرفر', value: 'server_settings' }
            )
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('remove_user')
        .setDescription('إزالة مستخدم من الموثوقين')
        .addUserOption(opt => opt.setName('user').setDescription('المستخدم').setRequired(true))
    )
    .addSubcommand(sub =>
      sub
        .setName('list')
        .setDescription('عرض قائمة الأشخاص الموثوقين')
    )
    .addSubcommand(sub =>
      sub
        .setName('add_bot')
        .setDescription('إضافة بوت للقائمة البيضاء')
        .addStringOption(opt => opt.setName('bot_id').setDescription('معرف البوت').setRequired(true))
    ),
  async execute(interaction) {
    try {
      const serverId = interaction.guildId;
      const settings = await ServerSettings.findOne({ serverId });

      if (!settings) {
        return interaction.reply({ content: '⚠️ البوت غير مفعل! استخدم `/setup` أولاً', ephemeral: true });
      }

      const subcommand = interaction.options.getSubcommand();

      if (subcommand === 'add_user') {
        const user = interaction.options.getUser('user');
        const action = interaction.options.getString('action');

        await ProtectionManager.addToWhitelist(serverId, user.id, action);

        const embed = new EmbedBuilder()
          .setTitle('✅ تم إضافة المستخدم')
          .setDescription(`${user.username} يمكنه الآن: **${action}**`)
          .setColor('#00ff00')
          .setThumbnail(user.avatarURL());

        await interaction.reply({ embeds: [embed] });
      }

      if (subcommand === 'remove_user') {
        const user = interaction.options.getUser('user');

        await ServerSettings.findOneAndUpdate(
          { serverId },
          {
            $pull: {
              'trustedUsers': { userId: user.id }
            }
          },
          { new: true }
        );

        const embed = new EmbedBuilder()
          .setTitle('✅ تم إزالة المستخدم')
          .setDescription(`تم إزالة ${user.username} من قائمة الموثوقين`)
          .setColor('#ff6b6b');

        await interaction.reply({ embeds: [embed] });
      }

      if (subcommand === 'list') {
        const embed = new EmbedBuilder()
          .setTitle('📋 قائمة الأشخاص الموثوقين')
          .setColor('#0099ff')
          .setThumbnail(interaction.guild.iconURL());

        if (settings.trustedUsers.length === 0) {
          embed.setDescription('❌ لا يوجد أشخاص موثوقين بعد');
        } else {
          settings.trustedUsers.forEach(user => {
            const actionLabels = {
              'role_assign': '🎖️ إضافة رتب',
              'channel_modify': '📝 تعديل رومات',
              'bot_add': '🤖 إضافة بوتات',
              'webhook_manage': '🔗 إدارة ويب هوك',
              'permission_change': '🔒 تعديل صلاحيات',
              'server_settings': '⚙️ إعدادات السيرفر'
            };

            const permissions = user.permissions.map(p => actionLabels[p] || p).join('\n');
            embed.addFields({
              name: `👤 <@${user.userId}>`,
              value: permissions || 'بدون صلاحيات',
              inline: false
            });
          });
        }

        await interaction.reply({ embeds: [embed], ephemeral: true });
      }

      if (subcommand === 'add_bot') {
        const botId = interaction.options.getString('bot_id');

        await ServerSettings.findOneAndUpdate(
          { serverId },
          {
            $addToSet: { botWhitelist: botId }
          },
          { new: true }
        );

        const embed = new EmbedBuilder()
          .setTitle('✅ تم إضافة البوت')
          .setDescription(`معرف البوت: \`${botId}\` تمت إضافته للقائمة البيضاء`)
          .setColor('#00ff00');

        await interaction.reply({ embeds: [embed] });
      }
    } catch (error) {
      console.error('خطأ في أمر التخطي:', error);
      await interaction.reply({ content: '❌ حدث خطأ!', ephemeral: true });
    }
  }
};