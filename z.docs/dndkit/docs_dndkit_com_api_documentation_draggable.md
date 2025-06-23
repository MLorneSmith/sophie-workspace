![](https://3633755066-files.gitbook.io/~/files/v0/b/gitbook-legacy-files/o/assets%2F-MMujhzqaYbBEEmDxnZO%2F-MN0Kqdqp2CU1CxUV_hg%2F-MN0LCrhtymDDEQ6kaJj%2Fdraggable-large.svg?alt=media&token=16954bf4-1357-4890-9e99-a74ca336ddf1)

Use the `useDraggable` hook turn DOM nodes into draggable sources that can be picked up, moved and dropped over [droppable](https://docs.dndkit.com/api-documentation/droppable) containers.

## [Direct link to heading](https://docs.dndkit.com/api-documentation/draggable\#usage)    Usage

The `useDraggable` hook isn't particularly opinionated about how your app should be structured.

### [Direct link to heading](https://docs.dndkit.com/api-documentation/draggable\#node-ref)    Node ref

At minimum though, you need to pass the `setNodeRef` function that is returned by the `useDraggable` hook to a DOM element so that it can access the underlying DOM node and keep track of it to [detect collisions and intersections](https://docs.dndkit.com/api-documentation/context-provider/collision-detection-algorithms) with other [droppable](https://docs.dndkit.com/api-documentation/droppable) elements.

Copy

```min-w-full inline-grid grid-cols-[auto_1fr] p-2 [count-reset:line]
import {useDraggable} from '@dnd-kit/core';
import {CSS} from '@dnd-kit/utilities';

function Draggable() {
  const {attributes, listeners, setNodeRef, transform} = useDraggable({
    id: 'unique-id',
  });
  const style = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <button ref={setNodeRef} style={style} {...listeners} {...attributes}>
      /* Render whatever you like within */
    </button>
  );
}
```

Always try to use the DOM element that is most [semantic](https://developer.mozilla.org/en-US/docs/Glossary/Semantics) in the context of your app.
Check out our [Accessibility guide](https://docs.dndkit.com/guides/accessibility) to learn more about how you can help provide a better experience for screen readers.

### [Direct link to heading](https://docs.dndkit.com/api-documentation/draggable\#identifier)    Identifier

The `id` argument is a string that should be a unique identifier, meaning there should be no other **draggable** elements that share that same identifier within a given [`DndContext`](https://docs.dndkit.com/api-documentation/context-provider) provider.

### [Direct link to heading](https://docs.dndkit.com/api-documentation/draggable\#listeners)    Listeners

The `useDraggable` hook requires that you attach `listeners` to the DOM node that you would like to become the activator to start dragging.

While we could have attached these listeners manually to the node provided to `setNodeRef`, there are actually a number of key advantages to forcing the consumer to manually attach the listeners.

#### [Direct link to heading](https://docs.dndkit.com/api-documentation/draggable\#flexibility)    Flexibility

While many drag and drop libraries need to expose the concept of "drag handles", creating a drag handle with the `useDraggable` hook is as simple as manually attaching the listeners to a different DOM element than the one that is set as the draggable source DOM node:

Copy

```min-w-full inline-grid grid-cols-[auto_1fr] p-2 [count-reset:line]
import {useDraggable} from '@dnd-kit/core';

function Draggable() {
  const {attributes, listeners, setNodeRef} = useDraggable({
    id: 'unique-id',
  });

  return (
    <div ref={setNodeRef}>
      /* Some other content that does not activate dragging */
      <button {...listeners} {...attributes}>Drag handle</button>
    </div>
  );
}
```

When attaching the listeners to a different element than the node that is draggable, make sure you also attach the attributes to the same node that has the listeners attached so that it is still [accessible](https://docs.dndkit.com/guides/accessibility).

You can even have multiple drag handles if that makes sense in the context of your application:

Copy

```min-w-full inline-grid grid-cols-[auto_1fr] p-2 [count-reset:line]
import {useDraggable} from '@dnd-kit/core';

function Draggable() {
  const {attributes, listeners, setNodeRef} = useDraggable({
    id: 'unique-id',
  });

  return (
    <div ref={setNodeRef}>
      <button {...listeners} {...attributes}>Drag handle 1</button>
      /* Some other content that does not activate dragging */
      <button {...listeners} {...attributes}>Drag handle 2</button>
    </div>
  );
}
```

#### [Direct link to heading](https://docs.dndkit.com/api-documentation/draggable\#performance)    Performance

This strategy also means that we're able to use [React synthetic events](https://reactjs.org/docs/events.html), which ultimately leads to improved performance over manually attaching event listeners to each individual node.

Why? Because rather than having to attach individual event listeners for each draggable DOM node, React attaches a single event listener for every type of event we listen to on the `document`. Once click on one of the draggable nodes happens, React's listener on the document dispatches a SyntheticEvent back to the original handler.

### [Direct link to heading](https://docs.dndkit.com/api-documentation/draggable\#transforms)    Transforms

In order to actually see your draggable items move on screen, you'll need to move the item using CSS. You can use inline styles, CSS variables, or even CSS-in-JS libraries to pass the `transform` property as CSS to your draggable element.

For performance reasons, we strongly recommend you use the `transform` CSS property to move your draggable item on the screen, as other positional properties such as `top`, `left` or `margin` can cause expensive repaints. Learn more about [CSS transforms](https://developer.mozilla.org/en-US/docs/Web/CSS/transform).

After an item starts being dragged, the `transform` property will be populated with the `translate` coordinates you'll need to move the item on the screen. The `transform` object adheres to the following shape: `{x: number, y: number, scaleX: number, scaleY: number}`

The `x` and `y` coordinates represent the delta from the point of origin of your draggable element since it started being dragged.

The `scaleX` and `scaleY` properties represent the difference in scale between the item that is dragged and the droppable container it is currently over. This is useful for building interfaces where the draggable item needs to adapt to the size of the droppable container it is currently over.

The `CSS` helper is entirely optional; it's a convenient helper for generating [CSS transform](https://developer.mozilla.org/en-US/docs/Web/CSS/transform) strings, and is equivalent to manually constructing the string as such:

Copy

```min-w-full inline-grid grid-cols-[auto_1fr] p-2 [count-reset:line]
CSS.Translate.toString(transform) ===
`translate3d(${translate.x}, ${translate.y}, 0)`
```

### [Direct link to heading](https://docs.dndkit.com/api-documentation/draggable\#attributes)    Attributes

The `useDraggable` hookprovides a set of sensible default attributes for draggable items. We recommend you attach these to the HTML element you are attaching the draggable listeners to.

We encourage you to manually attach the attributes that you think make sense in the context of your application rather than using them all without considering whether it makes sense to do so.

For example, if the HTML element you are attaching the `useDraggable` `listeners` to is already a semantic `button`, although it's harmless to do so, there's no need to add the `role="button"` attribute, since that is already the default role.

Attribute

Default value

Description

`role`

`"button"`

If possible, we recommend you use a semantic `<button>` element for the DOM element you plan on attaching draggable listeners to.

In case that's not possible, make sure you include the `role="button"` attribute, which is the default value.

`tabIndex`

`"0"`

In order for your draggable elements to receive keyboard focus, they **need** to have the `tabindex` attribute set to `0` if they are not natively interactive elements (such as the HTML `button` element). For this reason, the `useDraggable` hook sets the `tabindex="0"` attribute by default.

`aria-roledescription`

`"draggable"`

While `draggable` is a sensible default, we recommend you customize this value to something that is tailored to the use case you are building.

`aria-describedby`

`"DndContext-[uniqueId]"`

Each draggable item is provided a unique `aria-describedby` ID that points to the [screen reader instructions](https://docs.dndkit.com/api-documentation/context-provider#screen-reader-instructions) to be read out when a draggable item receives focus.

To learn more about the best practices for making draggable interfaces accessible, read the full accessibility guide:

[Accessibility](https://docs.dndkit.com/guides/accessibility)

### [Direct link to heading](https://docs.dndkit.com/api-documentation/draggable\#recommendations)    Recommendations

#### [Direct link to heading](https://docs.dndkit.com/api-documentation/draggable\#touch-action)    `touch-action`

We highly recommend you specify the `touch-action` CSS property for all of your draggable elements.

> The `touch-action` CSS property sets how an element's region can be manipulated by a touchscreen user (for example, by zooming features built into the browser).
>
> Source: [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action)

In general, we recommend you set the `touch-action` property to `none` for draggable elements in order to prevent scrolling on mobile devices.

For [Pointer Events,](https://docs.dndkit.com/api-documentation/sensors/pointer) there is no way to prevent the default behaviour of the browser on touch devices when interacting with a draggable element from the pointer event listeners. Using `touch-action: none;` is the only way to reliably prevent scrolling for pointer events.

Further, using `touch-action: none;` is currently the only reliable way to prevent scrolling in iOS Safari for both Touch and Pointer events.

If your draggable item is part of a scrollable list, we recommend you use a drag handle and set `touch-action` to `none` only for the drag handle, so that the contents of the list can still be scrolled, but that initiating a drag from the drag handle does not scroll the page.

Once a `pointerdown` or `touchstart` event has been initiated, any changes to the `touch-action` value will be ignored. Programmatically changing the `touch-action` value for an element from `auto` to `none` after a pointer or touch event has been initiated will not result in the user agent aborting or suppressing any default behavior for that event for as long as that pointer is active (for more details, refer to the [Pointer Events Level 2 Spec](https://www.w3.org/TR/pointerevents2/#determining-supported-touch-behavior)).

## [Direct link to heading](https://docs.dndkit.com/api-documentation/draggable\#drag-overlay)    Drag Overlay

The `<DragOverlay>` component provides a way to render a draggable overlay that is removed from the normal document flow and is positioned relative to the viewport.

![](https://docs.dndkit.com/~gitbook/image?url=https%3A%2F%2F3633755066-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-legacy-files%2Fo%2Fassets%252F-MMujhzqaYbBEEmDxnZO%252F-MPLpbsfQHd26rAwapkQ%252F-MPPblr-tx81-ZakW6gn%252FDragOverlay.png%3Falt%3Dmedia%26token%3Dc2d84cda-d1bb-4560-8056-f430599b414c&width=768&dpr=4&quality=100&sign=fde8bc11&sv=2)

To learn more about how to use drag overlays, read the in-depth guide:

[Drag Overlay](https://docs.dndkit.com/api-documentation/draggable/drag-overlay)

Last updated 4 years ago

* * *
