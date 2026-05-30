export function confirmDelete(itemType: string, itemName?: string): boolean {
  const target = itemName ? `${itemType} "${itemName}"` : `this ${itemType}`;
  return window.confirm(
    `Are you sure you want to delete ${target}?\n\nThis action cannot be undone.`,
  );
}
