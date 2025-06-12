const cds = require('@sap/cds');

// Esto aumenta el límite del body a 10 MB para permitir archivos grandes
cds.on("bootstrap", app => {
  app.use(require("body-parser").json({ limit: "10mb" }));
});

module.exports = cds.server;
