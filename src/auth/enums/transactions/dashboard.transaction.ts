const dashboard_visualizar = 401;
const dashboard_alterar = 402;
const dashboard_total = 403;


export const Dashboard = {
    CREATE: [dashboard_total, dashboard_alterar],
    READ: [dashboard_total, dashboard_alterar, dashboard_visualizar],
    UPDATE: [dashboard_total, dashboard_alterar],
    CHANGE_STATUS: [dashboard_total],
    CHANGE_PASSWORD: [dashboard_total],
    RESET_PASSWORD: [dashboard_total]
};