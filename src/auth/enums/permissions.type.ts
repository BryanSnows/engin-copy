import { Dashboard } from './transactions/dashboard.transaction';
import { Process } from './transactions/process.transactions';
import { Production } from './transactions/production.transaction';
import { ProductionGoal } from './transactions/productionGoal.transactions';
import { Profile } from './transactions/profile.transaction';
import { Reports } from './transactions/reports.transaction';
import { UserTransaction } from './transactions/user.transaction';

let Permission = {
  User: UserTransaction,
  Profile: Profile,
  Dashboard: Dashboard,
  Reports: Reports,
  Production: Production,
  ProductionGoal: ProductionGoal,
  Process: Process,
};

export default Permission;
