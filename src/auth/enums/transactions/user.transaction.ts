const user_visualizar = 201;
const user_alterar = 202;
const user_total = 203;

export const UserTransaction = {
    CREATE: [user_total, user_alterar],
    READ: [user_total, user_alterar, user_visualizar],
    UPDATE: [user_total, user_alterar],
    CHANGE_STATUS: [user_total],
    CHANGE_PASSWORD: [user_total],
    RESET_PASSWORD: [user_total]
};