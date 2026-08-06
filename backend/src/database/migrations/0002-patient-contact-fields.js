/**
 * Adds contact-method fields to `patients` and dispatch-tracking fields
 * to `notifications` for the message cascade system.
 */

async function up({ sequelize }) {
  const queryInterface = sequelize.getQueryInterface();
  const tables = await queryInterface.showAllTables();

  if (tables.includes("patients")) {
    const patientDesc = await queryInterface.describeTable("patients");
    if (!patientDesc.telegramChatId) {
      await queryInterface.addColumn("patients", "telegramChatId", {
        type: sequelize.Sequelize.STRING,
        allowNull: true,
      });
    }
    if (!patientDesc.telegramLinkToken) {
      await queryInterface.addColumn("patients", "telegramLinkToken", {
        type: sequelize.Sequelize.STRING,
        allowNull: true,
      });
    }
    if (!patientDesc.whatsappOptIn) {
      await queryInterface.addColumn("patients", "whatsappOptIn", {
        type: sequelize.Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      });
    }
    if (!patientDesc.preferredContactMethod) {
      await queryInterface.addColumn("patients", "preferredContactMethod", {
        type: sequelize.Sequelize.ENUM("auto", "whatsapp", "telegram", "sms_mobile", "sms"),
        allowNull: false,
        defaultValue: "auto",
      });
    }
  }

  if (tables.includes("notifications")) {
    const notifDesc = await queryInterface.describeTable("notifications");
    if (!notifDesc.dispatchChannel) {
      await queryInterface.addColumn("notifications", "dispatchChannel", {
        type: sequelize.Sequelize.STRING,
        allowNull: true,
      });
    }
    if (!notifDesc.dispatchedAt) {
      await queryInterface.addColumn("notifications", "dispatchedAt", {
        type: sequelize.Sequelize.DATE,
        allowNull: true,
      });
    }
    if (!notifDesc.dispatchError) {
      await queryInterface.addColumn("notifications", "dispatchError", {
        type: sequelize.Sequelize.TEXT,
        allowNull: true,
      });
    }
  }
}

async function down({ sequelize }) {
  const queryInterface = sequelize.getQueryInterface();
  const tables = await queryInterface.showAllTables();

  if (tables.includes("patients")) {
    const patientDesc = await queryInterface.describeTable("patients");
    if (patientDesc.preferredContactMethod) {
      await queryInterface.removeColumn("patients", "preferredContactMethod");
    }
    if (patientDesc.whatsappOptIn) {
      await queryInterface.removeColumn("patients", "whatsappOptIn");
    }
    if (patientDesc.telegramLinkToken) {
      await queryInterface.removeColumn("patients", "telegramLinkToken");
    }
    if (patientDesc.telegramChatId) {
      await queryInterface.removeColumn("patients", "telegramChatId");
    }
  }

  if (tables.includes("notifications")) {
    const notifDesc = await queryInterface.describeTable("notifications");
    if (notifDesc.dispatchError) {
      await queryInterface.removeColumn("notifications", "dispatchError");
    }
    if (notifDesc.dispatchedAt) {
      await queryInterface.removeColumn("notifications", "dispatchedAt");
    }
    if (notifDesc.dispatchChannel) {
      await queryInterface.removeColumn("notifications", "dispatchChannel");
    }
  }
}

module.exports = { up, down };
