import { useState, useMemo } from 'react';
const useSortableData = (items, config = null) => {
  const [sortConfig, setSortConfig] = useState(config);
  const sortedItems = useMemo(() => {
    let sortableItems = [...items];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const keys = sortConfig.key.split('.');
        if (keys.includes("firstName")) {
          var aa = `${a.firstName} ${a.lastName}`,
            bb = `${b.firstName} ${b.lastName}`;
          if (aa > bb) {
            return sortConfig.direction === 'sorting_desc' ? -1 : 1;
          }
          else if (aa < bb)
            return sortConfig.direction === 'sorting_asc' ? -1 : 1;
        }
        else {
          const valueA = keys.reduce((obj, key) => obj[key], a);
          const valueB = keys.reduce((obj, key) => obj[key], b);
          if (valueA < valueB) {
            return sortConfig.direction === 'sorting_asc' ? -1 : 1;
          }
          if (valueA > valueB) {
            return sortConfig.direction === 'sorting_desc' ? 1 : -1;
          }
        }
        return 0;
      });
    }
    return sortableItems;
  }, [items, sortConfig]);

  const requestSort = (key) => {
    let direction = 'sorting_asc';
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === 'sorting_asc'
    ) {
      direction = 'sorting_desc';
    }
    setSortConfig({ key, direction });
  };

  return { items: sortedItems, requestSort, sortConfig };
};
export default useSortableData