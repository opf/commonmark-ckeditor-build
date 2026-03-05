export function hoistTaskListCheckboxes(fragment) {
  const checkboxes = fragment.querySelectorAll('input.task-list-item-checkbox');
  checkboxes.forEach(checkbox => {
    const li = checkbox.closest('li.task-list-item');
    if (li && checkbox.parentElement !== li) {
      // Remove checkbox from its current parent
      checkbox.parentElement && checkbox.parentElement.removeChild(checkbox);
      // Insert checkbox as the first child of <li>
      li.insertBefore(checkbox, li.firstChild);
    }
  });
}