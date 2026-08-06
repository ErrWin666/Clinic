const BaseRepository = require("./BaseRepository");
const { Stocktaking, StocktakingItem, ProductVariant, Batch, User } = require("../models");

class StocktakingRepository extends BaseRepository {
  constructor() {
    super(Stocktaking);
  }

  async findByIdWithItems(id) {
    return this.model.findByPk(id, {
      include: [
        { model: User, as: "user", required: false },
        {
          model: StocktakingItem,
          as: "items",
          include: [
            {
              model: ProductVariant,
              as: "variant",
              include: [{ model: Batch, as: "batches", where: { isActive: true }, required: false }],
            },
            { model: Batch, as: "batch" },
          ],
        },
      ],
      order: [[{ model: StocktakingItem, as: "items" }, "id", "ASC"]],
    });
  }
}

module.exports = StocktakingRepository;
