const ServerSettings = require('../models/ServerSettings');
const Logger = require('./logger');

class ProtectionManager {
  static async isWhitelisted(serverId, userId, action) {
    try {
      const settings = await ServerSettings.findOne({ serverId });
      if (!settings) return false;

      const trustedUser = settings.trustedUsers.find(u => u.userId === userId);
      if (trustedUser && trustedUser.permissions.includes(action)) {
        return true;
      }

      return false;
    } catch (error) {
      console.error('خطأ في فحص القائمة البيضاء:', error);
      return false;
    }
  }

  static async addToWhitelist(serverId, userId, action) {
    try {
      await ServerSettings.findOneAndUpdate(
        { serverId },
        {
          $addToSet: {
            'trustedUsers': {
              userId,
              permissions: [action]
            }
          }
        },
        { new: true }
      );

      await Logger.logAction(
        serverId,
        'تمت_إضافة_تخطي',
        { id: 'نظام', username: 'نظام' },
        { type: 'مستخدم', id: userId },
        { action },
        'منخفضة',
        'حماية'
      );

      return true;
    } catch (error) {
      console.error('خطأ في إضافة التخطي:', error);
      return false;
    }
  }

  static async removeFromWhitelist(serverId, userId, action) {
    try {
      await ServerSettings.findOneAndUpdate(
        { serverId },
        {
          $pull: {
            'trustedUsers.$[elem].permissions': action
          }
        },
        {
          arrayFilters: [{ 'elem.userId': userId }],
          new: true
        }
      );

      return true;
    } catch (error) {
      console.error('خطأ في إزالة التخطي:', error);
      return false;
    }
  }
}

module.exports = ProtectionManager;