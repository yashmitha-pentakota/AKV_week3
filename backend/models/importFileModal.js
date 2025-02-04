const knex = require('../mysql/connection');

class ImportFile {
  static async create(data) {
    return knex('import_files').insert(data).returning('*');
  }

  static async update(id, data) {
    return knex('import_files').where('id', id).update(data);
  }

  static async getPendingFiles() {
    return knex('import_files').where('status', 'pending');
  }

  static async getById(id) {
    return knex('import_files').where('id', id).first();
  }
}

module.exports = ImportFile;
