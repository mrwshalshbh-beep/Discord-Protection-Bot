const ServerBackup = require('../models/ServerBackup');
const Logger = require('./logger');

class BackupManager {
  static async createBackup(guild, userId = 'نظام') {
    try {
      const backupData = {
        channels: [],
        roles: [],
        permissions: [],
        webhooks: [],
        settings: {
          name: guild.name,
          icon: guild.iconURL(),
          description: guild.description,
          region: guild.preferredLocale
        }
      };

      const channels = await guild.channels.fetch();
      channels.forEach(channel => {
        if (channel.type !== 4) {
          backupData.channels.push({
            id: channel.id,
            name: channel.name,
            type: channel.type,
            topic: channel.topic,
            nsfw: channel.nsfw,
            position: channel.position,
            permissionOverwrites: channel.permissionOverwrites.cache.map(p => ({
              id: p.id,
              type: p.type,
              allow: p.allow.bitfield,
              deny: p.deny.bitfield
            }))
          });
        }
      });

      const roles = await guild.roles.fetch();
      roles.forEach(role => {
        if (!role.managed) {
          backupData.roles.push({
            id: role.id,
            name: role.name,
            color: role.color,
            permissions: role.permissions.bitfield,
            position: role.position,
            mentionable: role.mentionable,
            hoist: role.hoist
          });
        }
      });

      try {
        const webhooks = await guild.fetchWebhooks();
        webhooks.forEach(webhook => {
          backupData.webhooks.push({
            id: webhook.id,
            name: webhook.name,
            channelId: webhook.channelId,
            owner: webhook.owner?.id
          });
        });
      } catch (e) {
        console.log('تم تخطي النسخ الاحتياطية للـ Webhooks');
      }

      const backup = new ServerBackup({
        serverId: guild.id,
        backupName: `النسخة-${new Date().toISOString()}`,
        backupData,
        backupSize: JSON.stringify(backupData).length,
        createdBy: userId,
        isAutomatic: userId === 'نظام'
      });

      await backup.save();

      await Logger.logAction(
        guild.id,
        'تم_إنشاء_نسخة',
        { id: userId, username: 'نظام' },
        { type: 'نسخة', id: backup._id, name: backup.backupName },
        { itemCount: backupData.channels.length + backupData.roles.length },
        'متوسطة',
        'حماية'
      );

      return backup;
    } catch (error) {
      console.error('خطأ في إنشاء النسخة:', error);
      throw error;
    }
  }

  static async getLatestBackup(serverId) {
    try {
      return await ServerBackup.findOne({ serverId })
        .sort({ createdAt: -1 })
        .lean();
    } catch (error) {
      console.error('خطأ في جلب النسخة:', error);
    }
  }

  static async restoreBackup(guild, backupId, options = {}) {
    try {
      const backup = await ServerBackup.findById(backupId);
      if (!backup) throw new Error('لم يتم العثور على النسخة');

      let restoredCount = 0;
      const maxItems = options.maxItems || 4;

      if (options.restoreChannels) {
        const channels = backup.backupData.channels.slice(0, maxItems);
        for (const channel of channels) {
          try {
            const existingChannel = guild.channels.cache.get(channel.id);
            if (!existingChannel) {
              await guild.channels.create({
                name: channel.name,
                type: channel.type,
                topic: channel.topic,
                nsfw: channel.nsfw
              });
              restoredCount++;
            }
          } catch (e) {
            console.error(`خطأ في استعادة الروم: ${e}`);
          }
        }
      }

      if (options.restoreRoles) {
        const roles = backup.backupData.roles.slice(0, maxItems);
        for (const role of roles) {
          try {
            const existingRole = guild.roles.cache.get(role.id);
            if (!existingRole) {
              await guild.roles.create({
                name: role.name,
                color: role.color,
                permissions: BigInt(role.permissions)
              });
              restoredCount++;
            }
          } catch (e) {
            console.error(`خطأ في استعادة الرتبة: ${e}`);
          }
        }
      }

      await Logger.logAction(
        guild.id,
        'تم_استعادة_نسخة',
        { id: 'نظام', username: 'نظام' },
        { type: 'نسخة', id: backupId },
        { itemsRestored: restoredCount, options },
        'عالية',
        'استعادة'
      );

      return { success: true, restoredCount };
    } catch (error) {
      console.error('خطأ الاستعادة:', error);
      throw error;
    }
  }
}

module.exports = BackupManager;