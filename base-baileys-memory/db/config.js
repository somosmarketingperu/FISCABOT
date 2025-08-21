// db/config.js
module.exports = {
  // Configuración para reportes de Ergonomía y Sector (tablas SIIT)
  dbSIIT: {
    user: "DLLANOS",
    password: "Sunaf1l2025#",
    connectString: "172.20.0.21:1521/PRODSIIT",
    poolMin: 1,
    poolMax: 4,
    poolIncrement: 1,
  },
  // Configuración para consultas de RUC y DNI (tablas de empleadores/trabajadores)
  db: {
    user: "usr_jpariona",
    password: "Sun471l2o21$$",
    connectString: "scan-bi:1521/srv_dwhsuna",
    poolMin: 1,
    poolMax: 4,
    poolIncrement: 1,
  },
};


