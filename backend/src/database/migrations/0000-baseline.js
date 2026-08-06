/**
 * Baseline migration.
 *
 * Establishes the migration history from the current Sequelize models. The
 * `up` step uses `sequelize.sync()` without `alter` or `force`, which is a
 * no-op on a database whose tables already match the models and only creates
 * missing tables otherwise. It never drops or alters existing columns, so it
 * is safe to run against an existing production database.
 *
 * The `down` step is intentionally a no-op: the baseline cannot be rolled
 * back without losing data, and any future destructive change must ship as a
 * separate, explicit migration.
 */

async function up({ sequelize }) {
  await sequelize.sync();
}

async function down() {
  // Intentionally empty. Dropping the baseline would erase the schema.
}

module.exports = { up, down };
