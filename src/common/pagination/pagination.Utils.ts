import { MachineModelFilter } from 'src/machine-model/dto/filter-machine-model';
import { PipeModelFilter } from 'src/pipe-model/dto/filter-pipe-model.dto';
import { ProductionGoalFilter } from 'src/production-goal/dto/filter-production-goal.dto';
import { FilterProfile } from 'src/profile/dto/filter-profile.dto';

export function listItems(
  items,
  pageActual,
  limitItems,
  filter: FilterProfile | PipeModelFilter | MachineModelFilter | ProductionGoalFilter,
) {
  const { page, limit } = filter;
  let result = [];
  let totalPage = Math.ceil(items.length / limitItems);
  let count = pageActual * limitItems - limitItems;
  let delimiter = count + limitItems;
  if (pageActual <= totalPage) {
    for (let i = count; i < delimiter; i++) {
      if (items[i] != null) {
        result.push(items[i]);
      }
      count++;
    }
  }
  if (items.length === 0) {
    return {
      message: 'Sem Dados Cadastrados',
      items: result,
      meta: {
        totalItems: items.length,
        itemCount: result.length,
        itemsPerPage: Number(limit),
        totalPages: totalPage,
        currentPage: Number(page),
      },
    };
  } else
    return {
      items: result,
      meta: {
        totalItems: items.length,
        itemCount: result.length,
        itemsPerPage: Number(limit),
        totalPages: totalPage,
        currentPage: Number(page),
      },
    };
}
