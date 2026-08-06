const BaseRepository = require("./BaseRepository");
const { Appointment } = require("../models");
const { Op } = require("sequelize");

class AppointmentRepository extends BaseRepository {
  constructor() {
    super(Appointment);
  }

  async findConflicts(date, startTime, endTime, excludeId = null) {
    const where = {
      appointmentDate: date,
      status: { [Op.notIn]: ["cancelled"] },
      [Op.or]: [
        { startTime: { [Op.lt]: endTime }, endTime: { [Op.gt]: startTime } },
      ],
    };
    if (excludeId) {
      where.id = { [Op.ne]: excludeId };
    }
    return this.model.findAll({ where });
  }

  async findForCalendar(startDate, endDate) {
    return this.model.findAll({
      where: {
        appointmentDate: { [Op.between]: [startDate, endDate] },
        status: { [Op.notIn]: ["cancelled"] },
      },
      include: [{ association: "patient", attributes: ["id", "displayId", "fullName"] }],
      order: [["appointmentDate", "ASC"], ["startTime", "ASC"]],
    });
  }

  async findByPatientId(patientId, options = {}) {
    return this.model.findAll({
      where: { patientId },
      order: [["appointmentDate", "DESC"]],
      ...options,
    });
  }
}

module.exports = AppointmentRepository;
