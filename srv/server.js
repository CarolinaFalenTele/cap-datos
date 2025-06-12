const cds = require('@sap/cds');

// Esto aumenta el límite del body a 10 MB para permitir archivos grandes
cds.on("bootstrap", app => {
  app.use(require("body-parser").json({ limit: "20mb" }));
});

module.exports = cds.server;

module.exports = cds.server;
