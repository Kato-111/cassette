const NON_TYPING_INPUT_TYPES = new Set([
  "button",
  "checkbox",
  "color",
  "file",
  "hidden",
  "image",
  "radio",
  "range",
  "reset",
  "submit",
]);

const TYPING_ROLES = new Set(["combobox", "searchbox", "textbox"]);

/** True when the event target accepts text entry and app shortcuts should defer. */
export const isTypingTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false;

  const editable = target.closest<HTMLElement>(
    'input, textarea, select, [contenteditable=""], [contenteditable="true"]',
  );
  if (!editable) {
    const role = target.getAttribute("role");
    return role != null && TYPING_ROLES.has(role);
  }

  if (editable.isContentEditable) return true;
  if (editable instanceof HTMLTextAreaElement) return true;
  if (editable instanceof HTMLSelectElement) return true;
  if (!(editable instanceof HTMLInputElement)) return false;
  if (editable.disabled || editable.readOnly) return false;

  const type = (editable.type || "text").toLowerCase();
  return !NON_TYPING_INPUT_TYPES.has(type);
};
