import { useState } from "react";

export function useEditableItem<T>() {
  const [editingItem, setEditingItem] = useState<T | null>(null);

  const editItem = (item: T) => {
    setEditingItem(item);
  };

  const cancelEdit = () => {
    setEditingItem(null);
  };

  return { cancelEdit, editItem, editingItem };
}
