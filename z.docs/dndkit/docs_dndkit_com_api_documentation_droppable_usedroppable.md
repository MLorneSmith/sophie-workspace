![](https://docs.dndkit.com/~gitbook/image?url=https%3A%2F%2F3633755066-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-legacy-files%2Fo%2Fassets%252F-MMujhzqaYbBEEmDxnZO%252F-MPGCvfijns42CI5nrlr%252F-MPGDLnPmFP795JX9M20%252FDroppable%2520%281%29.png%3Falt%3Dmedia%26token%3D083911df-02fc-4aed-a81d-95e8edd2f65f&width=768&dpr=4&quality=100&sign=84533101&sv=2)

## [Direct link to heading](https://docs.dndkit.com/api-documentation/droppable/usedroppable\#arguments)    Arguments

Copy

```min-w-full inline-grid grid-cols-[auto_1fr] p-2 [count-reset:line]
interface UseDroppableArguments {
  id: string | number;
  disabled?: boolean;
  data?: Record<string, any>;
}
```

### [Direct link to heading](https://docs.dndkit.com/api-documentation/droppable/usedroppable\#identifier)    Identifier

The `id` argument is a `string` or `number` that should be a unique identifier, meaning there should be no other **droppable** elements that share that same identifier within a given [`DndContext`](https://docs.dndkit.com/api-documentation/context-provider) provider.

If you're building a component that uses both the `useDroppable` and `useDraggable` hooks, they can both share the same identifier since droppable elements are stored in a different key-value store than draggable elements.

### [Direct link to heading](https://docs.dndkit.com/api-documentation/droppable/usedroppable\#disabled)    Disabled

Since [hooks cannot be conditionally invoked](https://reactjs.org/docs/hooks-rules.html), use the `disabled` argument and set it to `true` if you need to temporarily disable a `droppable` area.

### [Direct link to heading](https://docs.dndkit.com/api-documentation/droppable/usedroppable\#data)    Data

The `data` argument is for advanced use-cases where you may need access to additional data about the droppable element in event handlers, modifiers or custom sensors.

For example, if you were building a sortable preset, you could use the `data` attribute to store the index of the droppable element within a sortable list to access it within a custom sensor.

Copy

```min-w-full inline-grid grid-cols-[auto_1fr] p-2 [count-reset:line]
const {setNodeRef} = useDroppable({
  id: props.id,
  data: {
    index: props.index,
  },
});
```

Another more advanced example where the `data` argument can be useful is create relationships between draggable nodes and droppable areas, for example, to specify which types of draggable nodes your droppable accepts:

Copy

```min-w-full inline-grid grid-cols-[auto_1fr] p-2 [count-reset:line]
import {DndContext, useDraggable, useDroppable} from '@dnd-kit/core';

function Droppable() {
  const {setNodeRef} = useDroppable({
    id: 'droppable',
    data: {
      accepts: ['type1', 'type2'],
    },
  });

  /* ... */
}

function Draggable() {
  const {attributes, listeners, setNodeRef, transform} = useDraggable({
    id: 'draggable',
    data: {
      type: 'type1',
    },
  });

  /* ... */
}

function App() {
  return (
    <DndContext onDragEnd={handleDragEnd}>
      /* ... */
    </DndContext>
  );

  function handleDragEnd(event) {
    const {active, over} = event;

    if (over && over.data.current.accepts.includes(active.data.current.type)) {
      // do stuff
    }
  }
}
```

## [Direct link to heading](https://docs.dndkit.com/api-documentation/droppable/usedroppable\#properties)    Properties

Copy

```min-w-full inline-grid grid-cols-[auto_1fr] p-2 [count-reset:line]
{
  rect: React.MutableRefObject<LayoutRect | null>;
  isOver: boolean;
  node: React.RefObject<HTMLElement>;
  over: {id: UniqueIdentifier} | null;
  setNodeRef(element: HTMLElement | null): void;
}
```

### [Direct link to heading](https://docs.dndkit.com/api-documentation/droppable/usedroppable\#node)    Node

#### [Direct link to heading](https://docs.dndkit.com/api-documentation/droppable/usedroppable\#setnoderef)    `setNodeRef`

In order for the `useDroppable` hook to function properly, it needs the `setNodeRef` property to be attached to the HTML element you intend on turning into a droppable area:

Copy

```min-w-full inline-grid grid-cols-[auto_1fr] p-2 [count-reset:line]
function Droppable(props) {
  const {setNodeRef} = useDroppable({
    id: props.id,
  });

  return (
    <div ref={setNodeRef}>
      {/* ... */}
    </div>
  );
}
```

#### [Direct link to heading](https://docs.dndkit.com/api-documentation/droppable/usedroppable\#node-1)    `node`

A [ref](https://reactjs.org/docs/refs-and-the-dom.html) to the current node that is passed to `setNodeRef`

#### [Direct link to heading](https://docs.dndkit.com/api-documentation/droppable/usedroppable\#rect)    `rect`

For advanced use cases, if you need the bounding rect measurement of the droppable area.

### [Direct link to heading](https://docs.dndkit.com/api-documentation/droppable/usedroppable\#over)    Over

#### [Direct link to heading](https://docs.dndkit.com/api-documentation/droppable/usedroppable\#isover)    `isOver`

Use the `isOver` boolean returned by the `useDroppable` hook to change the appearance or content displayed when a `draggable` element is dragged over your droppable container.

#### [Direct link to heading](https://docs.dndkit.com/api-documentation/droppable/usedroppable\#over-1)    `over`

If you'd like to change the appearance of the droppable in response to a draggable being dragged over a different droppable container, check whether the `over` value is defined. Depending on your use-case, you can also read the `id` of the other droppable that the draggable item to make changes to the render output of your droppable component.

#### [Direct link to heading](https://docs.dndkit.com/api-documentation/droppable/usedroppable\#undefined)

Last updated 2 years ago

* * *