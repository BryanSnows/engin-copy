const production_visualizar = 601;
const production_alterar = 602;
const production_total = 603;

export const Production = {
  CREATE: [production_total, production_alterar],
  READ: [production_total, production_alterar, production_visualizar],
  UPDATE: [production_total, production_alterar],
  CHANGE_STATUS: [production_total],
};
