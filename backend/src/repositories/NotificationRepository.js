const BaseRepository = require("./BaseRepository");
const { Notification } = require("../models");

class NotificationRepository extends BaseRepository {
  constructor() {
    super(Notification);
  }

  async findUnread() {
    return this.model.findAll({ where: { isRead: false }, order: [["createdAt", "DESC"]] });
  }

  async markAsRead(id) {
    const notification = await this.findById(id);
    return notification.update({ isRead: true });
  }

  async markAllAsRead() {
    return this.model.update({ isRead: true }, { where: { isRead: false } });
  }
}

module.exports = NotificationRepository;
