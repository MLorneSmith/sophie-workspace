## [Direct link to heading](https://docs.dndkit.com/presets/sortable\#installation)    Installation

To get started, install the sortable preset via `npm` or `yarn`:

Copy

```min-w-full inline-grid grid-cols-[auto_1fr] p-2 [count-reset:line]
npm install @dnd-kit/sortable
```

## [Direct link to heading](https://docs.dndkit.com/presets/sortable\#overview)    Overview

If you're eager to get started right away, here's the code you'll need:

App.jsxSortableItem.jsx

Copy

```min-w-full inline-grid grid-cols-[auto_1fr] p-2 [count-reset:line]
import React, {useState} from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import {SortableItem} from './SortableItem';

function App() {
  const [items, setItems] = useState([1, 2, 3]);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items}
        strategy={verticalListSortingStrategy}
      >
        {items.map(id => <SortableItem key={id} id={id} />)}
      </SortableContext>
    </DndContext>
  );

  function handleDragEnd(event) {
    const {active, over} = event;

    if (active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.indexOf(active.id);
        const newIndex = items.indexOf(over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }
}
```

Copy

```min-w-full inline-grid grid-cols-[auto_1fr] p-2 [count-reset:line]
import React from 'react';
import {useSortable} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';

export function SortableItem(props) {
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
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {/* ... */}
    </div>
  );
}
```

For most sortable lists, we recommend you use a [`DragOverlay`](https://docs.dndkit.com/api-documentation/draggable/drag-overlay) if your sortable list is scrollable or if the contents of the scrollable list are taller than the viewport of the window. Check out the [sortable drag overlay guide](https://docs.dndkit.com/presets/sortable#drag-overlay) below to learn more.

## [Direct link to heading](https://docs.dndkit.com/presets/sortable\#architecture)    Architecture

The sortable preset builds on top of the primitives exposed by `@dnd-kit/core` to help building sortable interfaces.

The sortable preset exposes two main concepts: [`SortableContext`](https://docs.dndkit.com/presets/sortable#sortable-context) and the [`useSortable`](https://docs.dndkit.com/presets/sortable#usesortable) hook:

- The `SortableContext` provides information via context that is consumed by the `useSortable` hook.

- The `useSortable` hook is an abstraction that composes the [`useDroppable`](https://docs.dndkit.com/api-documentation/droppable) and [`useDraggable`](https://docs.dndkit.com/api-documentation/draggable) hooks:

![](https://docs.dndkit.com/~gitbook/image?url=https%3A%2F%2F3633755066-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-legacy-files%2Fo%2Fassets%252F-MMujhzqaYbBEEmDxnZO%252F-MPAGLQu4q5MwkPGcMwL%252F-MPAJ4EP6hgc_WyBRvU2%252FuseSortable%2520%281%29.png%3Falt%3Dmedia%26token%3D5258bd82-7443-4c7d-8b27-7d092d04ab03&width=768&dpr=4&quality=100&sign=8781210d&sv=2)

### [Direct link to heading](https://docs.dndkit.com/presets/sortable\#single-container)    Single container

At a high level, the application structure to implement a **sortable list with a single container** looks as follows:

![](https://docs.dndkit.com/~gitbook/image?url=https%3A%2F%2F3633755066-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-legacy-files%2Fo%2Fassets%252F-MMujhzqaYbBEEmDxnZO%252F-MP7kCLhAw6rXlUxFILQ%252F-MPA8JRM90_d98a9Tvzz%252FSortable%2520%281%29.png%3Falt%3Dmedia%26token%3Dfc6b976d-f97e-4a07-90c5-dee05d3e1498&width=768&dpr=4&quality=100&sign=9fb5e799&sv=2)

### [Direct link to heading](https://docs.dndkit.com/presets/sortable\#multiple-containers)    Multiple containers

To implement sortable list with items that can be dropped within **multiple containers**, the application structure is the same, but we add as many `SortableContext` providers as we have containers:

![](https://docs.dndkit.com/~gitbook/image?url=https%3A%2F%2F3633755066-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-legacy-files%2Fo%2Fassets%252F-MMujhzqaYbBEEmDxnZO%252F-MPF80W-heGKUftClbx3%252F-MPF9JDgemy4mwpbni_V%252FSortable%2520Multiple%2520Containers%2520Example.png%3Falt%3Dmedia%26token%3D72170d65-d588-4d93-8da8-26252873c285&width=768&dpr=4&quality=100&sign=77dcea88&sv=2)

In this example, we would use the `onDragOver` callback of `DndContext` to detect when a draggable element is moved over a different container to insert it in that new container while dragging.

If you paid close attention to the illustration above, you may also have noticed that we added a droppable zone around each sortable context. This isn't required, but will likely be the behaviour most people want. If you move all sortable items from one column into the other, you will need a droppable zone for the empty column so that you may drag sortable items back into that empty column:

![](https://docs.dndkit.com/~gitbook/image?url=https%3A%2F%2F3633755066-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-legacy-files%2Fo%2Fassets%252F-MMujhzqaYbBEEmDxnZO%252F-MPF80W-heGKUftClbx3%252F-MPF9MpK_A0AGiZaGSl7%252FSortable%2520Multiple%2520Containers%2520Empty%2520Column%2520%281%29.png%3Falt%3Dmedia%26token%3D51cd76c1-1c07-49dd-bc80-69128e8b6cbf&width=768&dpr=4&quality=100&sign=43114e8c&sv=2)

## [Direct link to heading](https://docs.dndkit.com/presets/sortable\#concepts)    Concepts

### [Direct link to heading](https://docs.dndkit.com/presets/sortable\#sortable-context)    Sortable Context

In addition to the [`DndContext` provider](https://docs.dndkit.com/introduction/getting-started#context-provider), the Sortable preset requires its own context provider that contains the **sorted** array of the unique identifiers associated to each sortable item:

Copy

```min-w-full inline-grid grid-cols-[auto_1fr] p-2 [count-reset:line]
import React, {useState} from 'react';
import {DndContext} from '@dnd-kit/core';
import {SortableContext} from '@dnd-kit/sortable';

function App() {
  const [items] = useState(['1', '2', '3']);

  return (
    <DndContext>
      <SortableContext items={items}>
        {/* ... */}
      </SortableContext>
    </DndContext>
  );
}
```

The `SortableContext` provides information via context that is consumed by the `useSortable` hook, which is covered in greater detail in the next section.

It's important that the `items` prop passed to `SortableContext` be sorted in the same order in which the items are rendered, otherwise you may see unexpected results.

It does not expose any callback props. To know when a sortable (draggable) item is being picked or moved over another sortable (droppable) item, use the callback props of `DndContext`:

Copy

```min-w-full inline-grid grid-cols-[auto_1fr] p-2 [count-reset:line]
import React, {useState} from 'react';
import {DndContext} from '@dnd-kit/core';
import {SortableContext} from '@dnd-kit/sortable';

function App() {
  const [items] = useState(['1', '2', '3']);

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <SortableContext items={items}>
        {/* ... */}
      </SortableContext>
    </DndContext>
  );

  function handleDragEnd(event) {
    /* ... */
  }
}
```

In order for the `SortableContext` component to function properly, make sure it is a descendant of a `DndContext` provider. You may nest multiple `SortableContext` components within the same parent `DndContext`.

### [Direct link to heading](https://docs.dndkit.com/presets/sortable\#usesortable)    useSortable

As outlined above, the `useSortable` hook combines both the [`useDraggable`](https://docs.dndkit.com/api-documentation/draggable) and [`useDroppable`](https://docs.dndkit.com/api-documentation/droppable) hooks to connect elements as both draggable sources and drop targets:

![](https://docs.dndkit.com/~gitbook/image?url=https%3A%2F%2F3633755066-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-legacy-files%2Fo%2Fassets%252F-MMujhzqaYbBEEmDxnZO%252F-MPAGLQu4q5MwkPGcMwL%252F-MPALbceK3ZbRNIUEqaN%252FuseSortable%2520%283%29.png%3Falt%3Dmedia%26token%3D85c7c4f9-8f7d-4a28-b9dd-69c50c253d95&width=768&dpr=4&quality=100&sign=76d3d454&sv=2)

In most cases, the draggable and droppable hooks will be attached to the same node, and therefore be identical in size. They are represented as different nodes for illustration purposes above.

If you're already familiar with the [`useDraggable`](https://docs.dndkit.com/api-documentation/draggable) hook, the [`useSortable`](https://docs.dndkit.com/presets/sortable/usesortable) hook should look very familiar, since, it is an abstraction on top of it.

In addition to the `attributes`, `listeners`, `transform` and `setNodeRef` properties, which you should already be familiar with if you've used the `useDraggable` hook before, you'll notice that the `useSortable` hook also provides a `transition` property.

The `transform` property for `useSortable` represents the displacement and change of scale transformation that a sortable item needs to apply to transition to its new position without needing to update the DOM order.

The `transform` property for the `useSortable` hook behaves similarly to the [`transform`](https://docs.dndkit.com/api-documentation/draggable#transforms) property of the [`useDraggable`](https://docs.dndkit.com/api-documentation/draggable) hook for the active sortable item, when there is no [`DragOverlay`](https://docs.dndkit.com/api-documentation/draggable/drag-overlay) being used.

SortableItem.jsx

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
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {/* ... */}
    </div>
  );
}
```

The default transition is `250` milliseconds, with an easing function set to `ease`, but you can customize this and pass any valid [CSS transition timing function](https://developer.mozilla.org/en-US/docs/Web/CSS/transition-timing-function), or set the transition argument to `null` to disable transitions entirely:

Copy

```min-w-full inline-grid grid-cols-[auto_1fr] p-2 [count-reset:line]
const {
  transition,
} = useSortable({
  id: props.id,
  transition: {
    duration: 150, // milliseconds
    easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
  },
});
```

For more details on the `useSortable` hook, read the full [API documentation](https://docs.dndkit.com/presets/sortable/usesortable).

### [Direct link to heading](https://docs.dndkit.com/presets/sortable\#sensors)    Sensors

Sensors are an abstraction to manage and listen to different input methods. If you're unfamiliar with the concept of sensors, we recommend you read the [introduction to sensors](https://docs.dndkit.com/api-documentation/sensors) first.

By default, the [Keyboard](https://docs.dndkit.com/api-documentation/sensors/keyboard) sensor moves the active draggable item by `25` pixels in the direction of the arrow key that was pressed. This is an arbitrary default, and can be customized using the `coordinateGetter` option of the keyboard sensor.

The sortable preset ships with a custom coordinate getter function for the keyboard sensor that moves the active draggable to the closest sortable element in a given direction within the same `DndContext`.

To use it, import the `sortableKeyboardCoordinates` coordinate getter function provided by `@dnd-kit/sortable`, and pass it to the `coordiniateGetter` option of the Keyboard sensor.

In this example, we'll also be setting up the [Pointer](https://docs.dndkit.com/api-documentation/sensors/pointer) sensor, which is the other sensor that is enabled by default on `DndContext` if none are defined. We use the `useSensor` and `useSensors` hooks to initialize the sensors:

Copy

```min-w-full inline-grid grid-cols-[auto_1fr] p-2 [count-reset:line]
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';

function App() {
  const [items] = useState(['1', '2', '3']);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  return (
    <DndContext sensors={sensors}>
      <SortableContext items={items}>
        {/* ... */}
      </SortableContext>
    </DndContext>
  );
}
```

If you'd like to use the [Mouse](https://docs.dndkit.com/api-documentation/sensors/mouse) and [Touch](https://docs.dndkit.com/api-documentation/sensors/touch) sensors instead of the [Pointer](https://docs.dndkit.com/api-documentation/sensors/pointer) sensor, simply initialize those sensors instead:

Copy

```min-w-full inline-grid grid-cols-[auto_1fr] p-2 [count-reset:line]
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';

function App() {
  const [items] = useState(['1', '2', '3']);
  const sensors = useSensors(
    useSensor(MouseSensor, {
      // Require the mouse to move by 10 pixels before activating
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      // Press delay of 250ms, with tolerance of 5px of movement
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  return (
    <DndContext sensors={sensors}>
      <SortableContext items={items}>
        {/* ... */}
      </SortableContext>
    </DndContext>
  );
}
```

To learn more about sensors, read the in-depth documentation on sensors:

[Sensors](https://docs.dndkit.com/api-documentation/sensors)

### [Direct link to heading](https://docs.dndkit.com/presets/sortable\#sorting-strategies)    Sorting strategies

The supported use cases of the Sortable preset include vertical lists, horizontal lists, grids, and virtualized lists. Because of the wide variety of use cases supported, it would be difficult to write a single strategy to cover all of these different use cases. Instead, the sortable preset exposes a number of different strategies you can use, that are tailored to these various use cases:

- `rectSortingStrategy`: This is the default value, and is suitable for most use cases. This strategy does not support virtualized lists.

- `verticalListSortingStrategy`: This strategy is optimized for vertical lists, and supports virtualized lists.

- `horizontalListSortingStrategy`: This strategy is optimized for horizontal lists, and supports virtualized lists.

- `rectSwappingStrategy`: Use this strategy to achieve swappable functionality.

Make sure to use the sorting strategy that is the most adapted to the use case you are building for.

### [Direct link to heading](https://docs.dndkit.com/presets/sortable\#collision-detection-algorithm)    Collision detection algorithm

The default collision detection algorithm of `DndContext` is the [rectangle intersection](https://docs.dndkit.com/api-documentation/context-provider/collision-detection-algorithms#rectangle-intersection) algorithm. While the rectangle intersection strategy is well suited for many use cases, it can be unforgiving, since it requires both the draggable and droppable bounding rectangles to come into direct contact and intersect.

For sortable lists, we recommend using a more forgiving collision detection strategy such as the [closest center](https://docs.dndkit.com/api-documentation/context-provider/collision-detection-algorithms#closest-center) or [closest corners](https://docs.dndkit.com/api-documentation/context-provider/collision-detection-algorithms#closest-corners) algorithms.

In this example, we'll be using the closest center algorithm:

Copy

```min-w-full inline-grid grid-cols-[auto_1fr] p-2 [count-reset:line]
import {DndContext, closestCenter} from '@dnd-kit/core';
import {SortableContext} from '@dnd-kit/sortable';

function App() {
  const [items] = useState(['1', '2', '3']);

  return (
    <DndContext collisionDetection={closestCenter}>
      <SortableContext items={items}>
        {/* ... */}
      </SortableContext>
    </DndContext>
  );
}
```

To learn more about collision detection algorithms and when to use one over the other, read our guide on collision detection algorithms:

[Collision detection algorithms](https://docs.dndkit.com/api-documentation/context-provider/collision-detection-algorithms)

## [Direct link to heading](https://docs.dndkit.com/presets/sortable\#connecting-all-the-pieces)    Connecting all the pieces

First, let's go ahead and render all of our sortable items:

App.jsxSortableItem.jsx

Copy

```min-w-full inline-grid grid-cols-[auto_1fr] p-2 [count-reset:line]
import React, {useState} from 'react';
import {DndContext} from '@dnd-kit/core';
import {SortableContext} from '@dnd-kit/sortable';

import {SortableItem} from './SortableItem';

function App() {
  const [items] = useState(['1', '2', '3']);

  return (
    <DndContext>
      <SortableContext items={items}>
        {items.map(id => <SortableItem key={id} id={id} />)}
      </SortableContext>
    </DndContext>
  );
}
```

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
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {/* ... */}
    </div>
  );
}
```

Next, let's wire up the custom sensors for `DndContext` and add a custom collision detection strategy:

App.jsxSortableItem.jsx

Copy

```min-w-full inline-grid grid-cols-[auto_1fr] p-2 [count-reset:line]
import React, {useState} from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';

import {SortableItem} from './SortableItem';

function App() {
  const [items] = useState(['1', '2', '3']);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter}>
      <SortableContext items={items}>
        {items.map(id => <SortableItem key={id} id={id} />)}
      </SortableContext>
    </DndContext>
  );
}
```

Copy

```min-w-full inline-grid grid-cols-[auto_1fr] p-2 [count-reset:line]
import {useSortable} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';

export function SortableItem(props) {
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
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {/* ... */}
    </div>
  );
}
```

In this example, we'll be building a vertical sortable list, so we will be using the `verticalListSortingStrategy` sorting strategy:

Copy

```min-w-full inline-grid grid-cols-[auto_1fr] p-2 [count-reset:line]
import React, {useState} from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import {SortableItem} from './SortableItem';

function App() {
  const [items] = useState(['1', '2', '3']);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter}>
      <SortableContext
        items={items}
        strategy={verticalListSortingStrategy}
      >
        {items.map(id => <SortableItem key={id} id={id} />)}
      </SortableContext>
    </DndContext>
  );
}
```

Finally, we'll need to set up event handlers on the `DndContext` provider in order to update the order of the items on drag end.

Copy

```min-w-full inline-grid grid-cols-[auto_1fr] p-2 [count-reset:line]
import React, {useState} from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import {SortableItem} from './SortableItem';

function App() {
  const [items, setItems] = useState(['1', '2', '3']);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items}
        strategy={verticalListSortingStrategy}
      >
        {items.map(id => <SortableItem key={id} id={id} />)}
      </SortableContext>
    </DndContext>
  );

  function handleDragEnd(event) {
    const {active, over} = event;

    if (active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.indexOf(active.id);
        const newIndex = items.indexOf(over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }
}
```

### [Direct link to heading](https://docs.dndkit.com/presets/sortable\#drag-overlay)    Drag Overlay

For most sortable lists, we recommend you use a [`DragOverlay`](https://docs.dndkit.com/api-documentation/draggable/drag-overlay) if your sortable list is scrollable or if the contents of the scrollable list are taller than the viewport of the window.

The `<DragOverlay>` component provides a way to render a draggable overlay that is removed from the normal document flow and is positioned relative to the viewport. The drag overlay also implements drop animations.

A **common pitfall** when using the `DragOverlay` component is rendering the same component that calls `useSortable` inside the `DragOverlay`. This will lead to unexpected results, since there will be an `id` collision between the two components both calling `useDraggable` with the same `id`, since `useSortable` is an abstraction on top of `useDraggable`.

Instead, create a presentational version of your component that you intend on rendering in the drag overlay, and another version that is sortable and renders the presentational component. There are two recommended patterns for this, either using [wrapper nodes](https://docs.dndkit.com/api-documentation/draggable/drag-overlay#wrapper-nodes) or [ref forwarding](https://docs.dndkit.com/api-documentation/draggable/drag-overlay#ref-forwarding).

In this example, we'll use the [ref forwarding](https://docs.dndkit.com/api-documentation/draggable/drag-overlay#ref-forwarding) pattern to avoid introducing wrapper nodes:

App.jsxSortableItem.jsxItem.jsx

Copy

```min-w-full inline-grid grid-cols-[auto_1fr] p-2 [count-reset:line]
import React, {useState} from 'react';
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import {SortableItem} from './SortableItem';
import {Item} from './Item';

function App() {
  const [activeId, setActiveId] = useState(null);
  const [items, setItems] = useState(['1', '2', '3']);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items}
        strategy={verticalListSortingStrategy}
      >
        {items.map(id => <SortableItem key={id} id={id} />)}
      </SortableContext>
      <DragOverlay>
        {activeId ? <Item id={activeId} /> : null}
      </DragOverlay>
    </DndContext>
  );

  function handleDragStart(event) {
    const {active} = event;

    setActiveId(active.id);
  }

  function handleDragEnd(event) {
    const {active, over} = event;

    if (active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.indexOf(active.id);
        const newIndex = items.indexOf(over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }

    setActiveId(null);
  }
}
```

Copy

```min-w-full inline-grid grid-cols-[auto_1fr] p-2 [count-reset:line]
import React from 'react';
import {useSortable} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';

import Item from './Item';

export function SortableItem(props) {
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
    <Item ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {value}
    </Item>
  );
}
```

Copy

```min-w-full inline-grid grid-cols-[auto_1fr] p-2 [count-reset:line]
import React, {forwardRef} from 'react';

export const Item = forwardRef(({id, ...props}, ref) => {
  return (
    <div {...props} ref={ref}>{id}</div>
  )
});
```

Last updated 2 years ago

* * *
