import * as bcrypt from 'bcrypt';

export class Utils {
  private static instance: Utils;
  public static getInstance(): Utils {
    if (!Utils.instance) {
      Utils.instance = new Utils();
    }
    return Utils.instance;
  }

  async encryptPassword(pass: string): Promise<string> {
    const saltOrRounds = 10;
    return bcrypt.hash(pass, saltOrRounds);
  }

  isValidDate(date: string) {
    const dateParts = date.split('T')[0].split('-');

    const year = +dateParts[0];
    const month = +dateParts[1];
    const day = +dateParts[2];

    if (isNaN(year) || isNaN(month) || isNaN(day)) {
      return false;
    }

    if (month > 12 || month < 1) return false;
    if (day > 31 || day < 1) return false;

    const lastDayOfMonth = new Date(year, month, 0).getDate();
    return day <= lastDayOfMonth;
  }
}
