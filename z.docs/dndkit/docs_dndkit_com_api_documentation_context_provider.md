## [Direct link to heading](https://docs.dndkit.com/api-documentation/context-provider\#application-structure)    Application structure

### [Direct link to heading](https://docs.dndkit.com/api-documentation/context-provider\#context-provider)    Context provider

In order for your your [Droppable](https://docs.dndkit.com/api-documentation/droppable) and [Draggable](https://docs.dndkit.com/api-documentation/draggable) components to interact with each other, you'll need to make sure that the part of your React tree that uses them is nested within a parent `<DndContext>` component. The `<DndContext>` provider makes use of the [React Context API](https://reactjs.org/docs/context.html) to share data between draggable and droppable components and hooks.

> React context provides a way to pass data through the component tree without having to pass props down manually at every level.

Therefore, components that use [`useDraggable`](https://docs.dndkit.com/api-documentation/draggable/usedraggable), [`useDroppable`](https://docs.dndkit.com/api-documentation/droppable/usedroppable) or [`DragOverlay`](https://docs.dndkit.com/api-documentation/draggable/drag-overlay) will need to be nested within a `DndContext` provider.

They don't need to be direct descendants, but, there does need to be a parent `<DndContext>` provider somewhere higher up in the tree.

Copy

```min-w-full inline-grid grid-cols-[auto_1fr] p-2 [count-reset:line]
import React from 'react';
import {DndContext} from '@dnd-kit/core';

function App() {
  return (
    <DndContext>
      {/* Components that use `useDraggable`, `useDroppable` */}
    </DndContext>
  );
}
```

### [Direct link to heading](https://docs.dndkit.com/api-documentation/context-provider\#nesting)    Nesting

You may also nest `<DndContext>` providers within other `<DndContext>` providers to achieve nested draggable/droppable interfaces that are independent of one another.

Copy

```min-w-full inline-grid grid-cols-[auto_1fr] p-2 [count-reset:line]
import React from 'react';
import {DndContext} from '@dnd-kit/core';

function App() {
  return (
    <DndContext>
      {/* Components that use `useDraggable`, `useDroppable` */}
      <DndContext>
        {/* ... */}
        <DndContext>
          {/* ... */}
        </DndContext>
      </DndContext>
    </DndContext>
  );
}
```

When nesting `DndContext` providers, keep in mind that the `useDroppable` and `useDraggable` hooks will only have access to the other draggable and droppable nodes within that context.

If multiple `DndContext` providers are listening for the same event, events will be captured by the first `DndContext` that contains a [Sensor](https://docs.dndkit.com/api-documentation/sensors) that is activated by that event, similar to how [events bubble in the DOM](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events#Event_bubbling_and_capture).

## [Direct link to heading](https://docs.dndkit.com/api-documentation/context-provider\#props)    Props

Copy

```min-w-full inline-grid grid-cols-[auto_1fr] p-2 [count-reset:line]
interface Props {
  announcements?: Announcements;
  autoScroll?: boolean;
  cancelDrop?: CancelDrop;
  children?: React.ReactNode;
  collisionDetection?: CollisionDetection;
  layoutMeasuring?: Partial<LayoutMeasuring>;
  modifiers?: Modifiers;
  screenReaderInstructions?: ScreenReaderInstructions;
  sensors?: SensorDescriptor<any>[];
  onDragStart?(event: DragStartEvent): void;
  onDragMove?(event: DragMoveEvent): void;
  onDragOver?(event: DragOverEvent): void;
  onDragEnd?(event: DragEndEvent): void;
  onDragCancel?(): void;
}
```

### [Direct link to heading](https://docs.dndkit.com/api-documentation/context-provider\#event-handlers)    Event handlers

As you can see from the list of props above, there are a number of different events emitted by `<DndContext>` that you can listen to and decide how to handle.

The main events you can listen to are:

#### [Direct link to heading](https://docs.dndkit.com/api-documentation/context-provider\#ondragstart)    `onDragStart`

Fires when a drag event that meets the [activation constraints](https://docs.dndkit.com/api-documentation/sensors#concepts) for that [sensor](https://docs.dndkit.com/api-documentation/sensors) happens, along with the unique identifier of the draggable element that was picked up.

#### [Direct link to heading](https://docs.dndkit.com/api-documentation/context-provider\#ondragmove)    `onDragMove`

Fires anytime as the [draggable](https://docs.dndkit.com/api-documentation/draggable) item is moved. Depending on the activated [sensor](https://docs.dndkit.com/api-documentation/sensors#activators), this could for example be as the [Pointer](https://docs.dndkit.com/api-documentation/sensors/pointer) is moved or the [Keyboard](https://docs.dndkit.com/api-documentation/sensors/keyboard) movement keys are pressed.

#### [Direct link to heading](https://docs.dndkit.com/api-documentation/context-provider\#ondragover)    `onDragOver`

Fires when a [draggable](https://docs.dndkit.com/api-documentation/draggable) item is moved over a [droppable](https://docs.dndkit.com/api-documentation/droppable) container, along with the unique identifier of that droppable container.

#### [Direct link to heading](https://docs.dndkit.com/api-documentation/context-provider\#ondragend)    `onDragEnd`

Fires after a draggable item is dropped.

This event contains information about the active draggable `id` along with information on whether the draggable item was dropped `over`.

If there are no [collisions detected](https://docs.dndkit.com/api-documentation/context-provider/collision-detection-algorithms) when the draggable item is dropped, the `over` property will be `null`. If a collision is detected, the `over` property will contain the `id` of the droppable over which it was dropped.

It's important to understand that the `onDragEnd` event **does not move** [**draggable**](https://docs.dndkit.com/api-documentation/draggable) **items into** [**droppable**](https://docs.dndkit.com/api-documentation/droppable) **containers.**

Rather, it provides **information** about which draggable item was dropped and whether it was over a droppable container when it was dropped.

It is up to the **consumer** of `DndContext` to decide what to do with that information and how to react to it, for example, by updating (or not) its internal state in response to the event so that the items are declaratively rendered in a different parent droppable.

#### [Direct link to heading](https://docs.dndkit.com/api-documentation/context-provider\#ondragcancel)    `onDragCancel`

Fires if a drag operation is cancelled, for example, if the user presses `escape` while dragging a draggable item.

### [Direct link to heading](https://docs.dndkit.com/api-documentation/context-provider\#accessibility)    Accessibility

For more details and best practices around accessibility of draggable and droppable components, read the accessibility section:

[Accessibility](https://docs.dndkit.com/guides/accessibility)

#### [Direct link to heading](https://docs.dndkit.com/api-documentation/context-provider\#announcements)    Announcements

Use the `announcements` prop to customize the screen reader announcements that are announced in the live region when draggable items are picked up, moved over droppable regions, and dropped.

The default announcements are:

Copy

```min-w-full inline-grid grid-cols-[auto_1fr] p-2 [count-reset:line]
const defaultAnnouncements = {
  onDragStart(id) {
    return `Picked up draggable item ${id}.`;
  },
  onDragOver(id, overId) {
    if (overId) {
      return `Draggable item ${id} was moved over droppable area ${overId}.`;
    }

    return `Draggable item ${id} is no longer over a droppable area.`;
  },
  onDragEnd(id, overId) {
    if (overId) {
      return `Draggable item was dropped over droppable area ${overId}`;
    }

    return `Draggable item ${id} was dropped.`;
  },
  onDragCancel(id) {
    return `Dragging was cancelled. Draggable item ${id} was dropped.`;
  },
}
```

While these default announcements are sensible defaults that should cover most simple use cases, you know your application best, and we highly recommend that you customize these to provide a screen reader experience that is more tailored to the use case you are building.

#### [Direct link to heading](https://docs.dndkit.com/api-documentation/context-provider\#screen-reader-instructions)    Screen reader instructions

Use the `screenReaderInstructions` prop to customize the instructions that are read to screen readers when the focus is moved

### [Direct link to heading](https://docs.dndkit.com/api-documentation/context-provider\#autoscroll)    Autoscroll

Use the optional `autoScroll` boolean prop to temporarily or permanently disable auto-scrolling for all sensors used within this `DndContext`.

Auto-scrolling may also be disabled on an individual sensor basis using the static property `autoScrollEnabled` of the sensor. For example, the [Keyboard sensor](https://docs.dndkit.com/api-documentation/sensors/keyboard) manages scrolling internally, and therefore has the static property `autoScrollEnabled` set to `false`.

### [Direct link to heading](https://docs.dndkit.com/api-documentation/context-provider\#collision-detection)    Collision detection

Use the `collisionDetection` prop to customize the collision detection algorithm used to detect collisions between draggable nodes and droppable areas within the `DndContext` provider.

The default collision detection algorithm is the [rectangle intersection](https://docs.dndkit.com/api-documentation/context-provider/collision-detection-algorithms#rectangle-intersection) algorithm.

The built-in collision detection algorithms are:

- [Rectangle intersection](https://docs.dndkit.com/api-documentation/context-provider/collision-detection-algorithms#rectangle-intersection)

- [Closest center](https://docs.dndkit.com/api-documentation/context-provider/collision-detection-algorithms#closest-center)

- [Closest corners](https://docs.dndkit.com/api-documentation/context-provider/collision-detection-algorithms#closest-corners)

You may also build custom collision detection algorithms or compose existing ones.

To learn more, read the collision detection guide:

[Collision detection algorithms](https://docs.dndkit.com/api-documentation/context-provider/collision-detection-algorithms)

### [Direct link to heading](https://docs.dndkit.com/api-documentation/context-provider\#sensors)    Sensors

Sensors are an abstraction to detect different input methods in order to initiate drag operations, respond to movement and end or cancel the operation.

The default sensors used by `DndContext` are the [Pointer](https://docs.dndkit.com/api-documentation/sensors/pointer) and [Keyboard](https://docs.dndkit.com/api-documentation/sensors/keyboard) sensors.

To learn how to customize sensors or how to pass different sensors to `DndContext`, read the Sensors guide:

[Sensors](https://docs.dndkit.com/api-documentation/sensors)

### [Direct link to heading](https://docs.dndkit.com/api-documentation/context-provider\#modifiers)    Modifiers

Modifiers let you dynamically modify the movement coordinates that are detected by sensors. They can be used for a wide range of use cases, for example:

- Restricting motion to a single axis

- Restricting motion to the draggable node container's bounding rectangle

- Restricting motion to the draggable node's scroll container bounding rectangle

- Applying resistance or clamping the motion

To learn more about how to use Modifiers, read the Modifiers guide:

[Modifiers](https://docs.dndkit.com/api-documentation/modifiers)

### [Direct link to heading](https://docs.dndkit.com/api-documentation/context-provider\#layout-measuring)    Layout measuring

You can configure when and how often `DndContext` should measure its droppable elements by using the `layoutMeasuring` prop.

The `frequency` argument controls how frequently layouts should be measured. By default, layout measuring is set to `optimized`, which only measures layouts based on the `strategy`.

Specify one of the following strategies:

- `LayoutMeasuringStrategy.WhileDragging`: Default behavior, only measure droppable elements right after dragging has begun.

`LayoutMeasuringStrategy.BeforeDragging`: Measure droppable elements before dragging begins and right after it ends.

- `LayoutMeasuringStrategy.Always`: Measure droppable elements before dragging begins, right after dragging has begun, and after it ends.

Example usage:

Copy

```min-w-full inline-grid grid-cols-[auto_1fr] p-2 [count-reset:line]
import {DndContext, LayoutMeasuringStrategy} from '@dnd-kit/core';

<DndContext layoutMeasuring={{strategy: LayoutMeasuringStrategy.Always}} />
```

Last updated 3 years ago

* * *
