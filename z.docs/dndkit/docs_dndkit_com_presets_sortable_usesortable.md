The `useSortable` hook is an abstraction that composes the [`useDroppable`](https://docs.dndkit.com/api-documentation/droppable) and [`useDraggable`](https://docs.dndkit.com/api-documentation/draggable) hooks.

![](https://docs.dndkit.com/~gitbook/image?url=https%3A%2F%2F3633755066-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-legacy-files%2Fo%2Fassets%252F-MMujhzqaYbBEEmDxnZO%252F-MPAGLQu4q5MwkPGcMwL%252F-MPALbceK3ZbRNIUEqaN%252FuseSortable%2520%283%29.png%3Falt%3Dmedia%26token%3D85c7c4f9-8f7d-4a28-b9dd-69c50c253d95&width=768&dpr=4&quality=100&sign=76d3d454&sv=2)

To function properly, the `useSortable` hook needs to be used within a descendant of a [`SortableContext`](https://docs.dndkit.com/presets/sortable/sortable-context) provider higher up in the tree.

## [Direct link to heading](https://docs.dndkit.com/presets/sortable/usesortable\#usage)    Usage

If you're already familiar with the [`useDraggable`](https://docs.dndkit.com/api-documentation/draggable) hook, the `useSortable` hook should look very familiar, since, it is an abstraction on top of it.

In addition to the `attributes`, `listeners`, `transform` and `setNodeRef` arguments, which you should already be familiar with if you've used the `useDraggable` hook before, you'll notice that the `useSortable` hook also provides a [`transition`](https://docs.dndkit.com/presets/sortable/usesortable#transform) argument.

Copy

```min-w-full inline-grid grid-cols-[auto_1fr] p-2 [count-reset:line]
import React from 'react';
import {useSortable} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';

function SortableItem(props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({id: props.id});

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {/* ... */}
    </li>
  );
}
```

## [Direct link to heading](https://docs.dndkit.com/presets/sortable/usesortable\#properties)    Properties

### [Direct link to heading](https://docs.dndkit.com/presets/sortable/usesortable\#listeners)    Listeners

The `listeners` property contains the [activator event handlers](https://docs.dndkit.com/api-documentation/sensors#activators) for each [Sensor](https://docs.dndkit.com/api-documentation/sensors) that is defined on the parent [`DndContext`](https://docs.dndkit.com/api-documentation/context-provider#props) provider.

It should be attached to the node(s) that you wish to use as the activator to begin a sort event. In most cases, that will be the same node as the one passed to `setNodeRef`, though not necessarily. For instance, when implementing a sortable element with a "drag handle", the ref should be attached to the parent node that should be sortable, but the listeners can be attached to the handle node instead.

For additional details on the [`listeners`](https://docs.dndkit.com/api-documentation/draggable#listeners) property, refer to the [`useDraggable`](https://docs.dndkit.com/api-documentation/draggable) documentation.

### [Direct link to heading](https://docs.dndkit.com/presets/sortable/usesortable\#attributes)    Attributes

The `useSortable` hook provides a set of sensible default attributes for draggable items. We recommend you attach these to your draggable elements, though nothing will break if you don't.

For additional details on the [`attributes`](https://docs.dndkit.com/api-documentation/draggable#attributes) property, refer to the [`useDraggable`](https://docs.dndkit.com/api-documentation/draggable) documentation.

### [Direct link to heading](https://docs.dndkit.com/presets/sortable/usesortable\#transform)    Transform

The `transform` property represents the displacement and change of scale transformation that a sortable item needs to apply to transition to its new position without needing to update the DOM order.

The `transform` property for the `useSortable` hook behaves similarly to the [`transform`](https://docs.dndkit.com/api-documentation/draggable#transforms) property of the [`useDraggable`](https://docs.dndkit.com/api-documentation/draggable) hook for the active sortable item, when there is no [`DragOverlay`](https://docs.dndkit.com/api-documentation/draggable/drag-overlay) being used.

### [Direct link to heading](https://docs.dndkit.com/presets/sortable/usesortable\#node-ref)    Node ref

In order for the `useSortable` hook to function properly, it needs the `setNodeRef` property to be attached to the HTML element you intend on turning into a sortable element:

Copy

```min-w-full inline-grid grid-cols-[auto_1fr] p-2 [count-reset:line]
function SortableItem(props) {
  const {setNodeRef} = useDraggable({
    id: props.id,
  });

  return (
    <li ref={setNodeRef}>
      {/* ... */}
    </li>
  );
}
```

Keep in mind that the `ref` should be assigned to the outer container that you want to become draggable, but this doesn't necessarily need to coincide with the container that the listeners are attached to:

Copy

```min-w-full inline-grid grid-cols-[auto_1fr] p-2 [count-reset:line]
function SortableItem(props) {
  const {arguments, listeners, setNodeRef} = useDraggable({
    id: props.id,
  });

  return (
    <li ref={setNodeRef}>
      {/* ... */}
      <button {...listeners} {...arguments}>Drag handle</button>
    </li>
  );
}
```

Since the `useSortable` hook is simply an abstraction on top of the [`useDraggable`](https://docs.dndkit.com/api-documentation/draggable/usedraggable) and [`useDroppable`](https://docs.dndkit.com/api-documentation/droppable/usedroppable) hooks, in some advanced use cases, you may also use the `setDroppableNodeRef` and `setDraggableNodeRef` properties to connect them to different nodes. For example, if you want the draggable element to have a different dimension than the droppable element that will be sortable:

Copy

```min-w-full inline-grid grid-cols-[auto_1fr] p-2 [count-reset:line]
function SortableItem(props) {
  const {setDraggableNodeRef, setDroppableNodeRef} = useDraggable({
    id: props.id,
  });

  return (
    <li ref={setDroppableNodeRef}>
      {/* ... */}
      <button ref={setDraggableNodeRef}>Drag me</button>
    </li>
  );
}
```

### [Direct link to heading](https://docs.dndkit.com/presets/sortable/usesortable\#activator)    Activator

`setActivatorNodeRef`

It's possible for the listeners to be attached to a different node than the one that `setNodeRef` is attached to.

A common example of this is when implementing a drag handle and attaching the listeners to the drag handle:

Copy

```min-w-full inline-grid grid-cols-[auto_1fr] p-2 [count-reset:line]
function SortableItem(props) {
  const {listeners, setNodeRef} = useSortable({
    id: props.id,
  });

  return (
    <li ref={setNodeRef}>
      {/* ... */}
      <button {...listeners}>Drag handle</button>
    </li>
  );
}
```

When the activator node differs from the draggable node, we recommend setting the activator node ref on the activator node:

Copy

```min-w-full inline-grid grid-cols-[auto_1fr] p-2 [count-reset:line]
function SortableItem(props) {
  const {listeners, setNodeRef, setActivatorNodeRef} = useSortable({
    id: props.id,
  });

  return (
    <li ref={setNodeRef}>
      {/* ... */}
      <button ref={setActivatorNodeRef} {...listeners}>Drag handle</button>
    </li>
  );
}
```

This helps @dnd-kit more accurately handle automatic focus management and can also be accessed by sensors for enhanced activation constraints.

Focus management is automatically handled by [@dnd-kit](https://github.com/dnd-kit). When the activator event is a Keyboard event, focus will automatically be restored back to the first focusable node of the activator node.

If no activator node is set via `setActivatorNodeRef`, focus will automatically be restored on the first focusable node of the draggable node registered via `setNodeRef.`

### [Direct link to heading](https://docs.dndkit.com/presets/sortable/usesortable\#transition)    Transition

Refer to the [`transition` argument](https://docs.dndkit.com/presets/sortable/usesortable#transition-1) documentation below.

## [Direct link to heading](https://docs.dndkit.com/presets/sortable/usesortable\#arguments)    Arguments

### [Direct link to heading](https://docs.dndkit.com/presets/sortable/usesortable\#identifier)    Identifier

The `id` argument is a `string` or `number` that should be unique.

Since the `useSortable` is an abstraction on top of the `useDroppable` and `useDraggable` hooks, which both require a unique identifier, the `useSortable` hook also requires a unique identifier.

The argument passed to the `id` argument of `useSortable` should match the `id` passed in the `items` array of the parent [`SortableContext`](https://docs.dndkit.com/presets/sortable/sortable-context) provider.

### [Direct link to heading](https://docs.dndkit.com/presets/sortable/usesortable\#disabled)    Disabled

If you'd like to temporarily disable a sortable item from being interactive, set the `disabled` argument to `true`.

### [Direct link to heading](https://docs.dndkit.com/presets/sortable/usesortable\#transition-1)    Transition

The transition argument controls the value of the `transition` property for you. It conveniently disables transform transitions while not dragging, but ensures that items transition back to their final positions when the drag operation is ended or cancelled.

It also disables transitions for the active sortable element that is being dragged, unless there is a [`DragOverlay`](https://docs.dndkit.com/api-documentation/draggable/drag-overlay) being used.

The default transition is `250` milliseconds, with an easing function set to `ease`, but you can customize this and pass any valid [CSS transition timing function](https://developer.mozilla.org/en-US/docs/Web/CSS/transition-timing-function).

Copy

```min-w-full inline-grid grid-cols-[auto_1fr] p-2 [count-reset:line]
const {
  transition,
} = useSortable({
  transition: {
    duration: 150, // milliseconds
    easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
  },
});
```

Make sure you pass the `transition` style property to the same node that has the `transform` property applied:

Copy

```min-w-full inline-grid grid-cols-[auto_1fr] p-2 [count-reset:line]
import React from 'react';
import {useSortable} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';

function SortableItem(props) {
  const {
    transform,
    transition,
  } = useSortable({id: props.id});

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li style={style}>
      {/* ... */}
    </li>
  );
}
```

If you prefer, you may also use CSS variables to manage the `transform` and `transition` properties:

Copy

```min-w-full inline-grid grid-cols-[auto_1fr] p-2 [count-reset:line]
import React from 'react';
import {useSortable} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';

function SortableItem(props) {
  const {
    transform,
    transition,
  } = useSortable({id: props.id});

  const style = {
    '--translate-x': transform ? transform.x : 0,
    '--translate-y': transform ? transform.y : 0,
    '--transition': transition,
  };

  return (
    <li style={style}>
      {/* ... */}
    </li>
  );
}
```

To disable transitions entirely, set the `transition` argument to `null`:

Copy

```min-w-full inline-grid grid-cols-[auto_1fr] p-2 [count-reset:line]
const {
  transition,
} = useSortable({
  transition: null,
});
```

If you prefer to manage transitions yourself, you may also choose to do so, but this isn't something we recommend.

### [Direct link to heading](https://docs.dndkit.com/presets/sortable/usesortable\#sorting-strategy)    Sorting strategy

Optionally, you can pass a local sorting strategy that differs from the [global sorting strategy](https://docs.dndkit.com/presets/sortable/sortable-context#strategy) passed to the parent `SortableContext` provider.

Last updated 2 years ago

* * *
