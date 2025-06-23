For advanced use-cases, for example, if you're building your own presets on top of `@dnd-kit/core`, you may want to have access to the internal context of `<DndContext>` that the `useDraggable` and `useDroppable` have access to.

Copy

```min-w-full inline-grid grid-cols-[auto_1fr] p-2 [count-reset:line]
import {useDndContext} from '@dnd-kit/core';

function CustomPreset() {
  const dndContext = useDndContext();
}
```

If you think the preset you're building could be useful to others, feel free to open up a PR for discussion in the `dnd-kit` repository.

Last updated 3 years ago

---
