var azure = require('azure-storage'),
    config = require('../../util/config'),
    priv = {};

// Create the table client.
var tableService = azure.createTableService(
  config('azure.account_name'),
  config('azure.account_key'));

var generator = azure.TableUtilities.entityGenerator;
var tables = [];

module.exports.set = function (table, key, value, done) {
  priv.initializeTable(table, function (err) {
    if (err)
      return done(err);

    tableService.insertOrReplaceEntity(table, {
      PartitionKey: generator.String(table),
      RowKey: generator.String(key),
      value: generator.String(JSON.stringify(value))
    }, done);
  });
};

module.exports.get = function (table, key, done) {
  priv.initializeTable(table, function (err) {
    if (err)
      return done(err);

    tableService.retrieveEntity(table, table, key, function (err, result) {
      if (err)
        return done(err);

      done(null, result.value && result.value._ && JSON.parse(result.value._));
    });
  });
};

priv.initializeTable = function (table, done) {
  if (tables[table])
    return done();

  tableService.createTableIfNotExists(table, function (err) {
    if (err)
      return done(err);

    tables[table] = true;
    done();
  });
};
