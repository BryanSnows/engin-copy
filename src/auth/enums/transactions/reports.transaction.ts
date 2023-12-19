const reports_visualizar = 501;
const reports_alterar = 502;
const reports_total = 503;

export const Reports = {
    CREATE: [reports_total, reports_alterar],
    READ: [reports_total, reports_alterar, reports_visualizar],
    UPDATE: [reports_total, reports_alterar],
    CHANGE_STATUS: [reports_total],
    CHANGE_PASSWORD: [reports_total],
    RESET_PASSWORD: [reports_total]
};