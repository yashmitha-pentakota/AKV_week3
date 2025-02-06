exports.up = function (knex) {
    return knex.schema.createTable('messages', function (table) {
      table.increments('id').primary();
      table.string('sender').notNullable();
      table.text('message').notNullable();
      table.timestamp('timestamp').defaultTo(knex.fn.now());
    });
  };
  
  exports.down = function (knex) {
    return knex.schema.dropTable('messages');
  };
  