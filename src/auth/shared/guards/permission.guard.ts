import { CanActivate, ExecutionContext, mixin, Type } from '@nestjs/common';
import { isArray } from 'class-validator';

export function PermissionGuard(permission: any): Type<CanActivate> {
  class PermissionGuardMixin implements CanActivate {
    async canActivate(context: ExecutionContext) {
      const request = context.switchToHttp().getRequest<any>();

      if (request?.user?.profile_id === 0) {
        return true;
      }

      const transactions = request?.user?.transactions;

      if (isArray(permission)) {
        return transactions?.some((transaction: number) => permission?.includes(transaction));
      }

      return transactions?.includes(permission);
    }
  }

  return mixin(PermissionGuardMixin);
}
