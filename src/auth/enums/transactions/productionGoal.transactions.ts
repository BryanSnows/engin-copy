const productionGoal_visualizar = 701;
const productionGoal_alterar = 702;
const productionGoal_total = 703;

export const ProductionGoal = {
  CREATE: [productionGoal_total, productionGoal_alterar],
  READ: [productionGoal_total, productionGoal_alterar, productionGoal_visualizar],
  UPDATE: [productionGoal_total, productionGoal_alterar],
  CHANGE_STATUS: [productionGoal_total],
};
