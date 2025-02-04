exports.up = function (knex) {
    return knex.schema
        .createTable('carts', (table) => {
            table.increments('id').primary();
            table.integer('user_id').unsigned().notNullable();
            table.integer('product_id').unsigned().notNullable();
            table.integer('vendor_id').unsigned().notNullable();
            table.integer('quantity').notNullable().defaultTo(1);
            table.timestamps(true, true);

            // Unique constraint to prevent duplicate combinations
            table.unique(['user_id', 'product_id', 'vendor_id']);
        });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists('carts');
};