![](https://3633755066-files.gitbook.io/~/files/v0/b/gitbook-legacy-files/o/assets%2F-MMujhzqaYbBEEmDxnZO%2F-MNQc_e_FVewH2dAwjx9%2F-MNQdykNUAckcRaS-rWa%2Fdroppable-large.svg?alt=media&token=18af3a4e-b911-4149-82af-5d67c7198eea)

Use the `useDroppable` hook to set up DOM nodes as droppable areas that [draggable](https://docs.dndkit.com/api-documentation/draggable) elements can be dropped over.

## [Direct link to heading](https://docs.dndkit.com/api-documentation/droppable\#usage)    Usage

The `useDroppable` hook isn't opinionated about how you should structure your application.

At minimum though, you need to pass the `setNodeRef` function that is returned by the `useDroppable` hook to a DOM element so that it can register the underlying DOM node and keep track of it to detect collisions and intersections with other draggable elements.

If the concept of `ref` is new to you, we recommend you first check out the [Refs and the DOM article](https://reactjs.org/docs/refs-and-the-dom.html#adding-a-ref-to-a-dom-element) on the React documentation website.

Copy

```min-w-full inline-grid grid-cols-[auto_1fr] p-2 [count-reset:line]
import {useDroppable} from '@dnd-kit/core';

function Droppable() {
  const {setNodeRef} = useDroppable({
    id: 'unique-id',
  });

  return (
    <div ref={setNodeRef}>
      /* Render whatever you like within */
    </div>
  );
}
```

You can set up as many droppable containers as you want, just make sure they all have a unique `id` so that they can be differentiated. Each droppable needs to have its own unique node though, so make sure you don't try to connect a single droppable to multiple refs.

To set up multiple droppable targets, simply use the `useDroppable` hook as many times as needed.

Copy

```min-w-full inline-grid grid-cols-[auto_1fr] p-2 [count-reset:line]
function MultipleDroppables() {
  const {setNodeRef: setFirstDroppableRef} = useDroppable({
    id: 'droppable-1',
  });
  const {setNodeRef: setsecondDroppableRef} = useDroppable({
    id: 'droppable-2',
  });

  return (
    <section>
      <div ref={setFirstDroppableRef}>
        /* Render whatever you like within */
      </div>
      <div ref={setsecondDroppableRef}>
        /* Render whatever you like within */
      </div>
    </section>
  );
}
```

If you need to dynamically render a list of droppable containers, we recommend you create a re-usable Droppable component and render that component as many times as needed:

Copy

```min-w-full inline-grid grid-cols-[auto_1fr] p-2 [count-reset:line]
function Droppable(props) {
  const {setNodeRef} = useDroppable({
    id: props.id,
  });

  return (
    <div ref={setNodeRef}>
      {props.children}
    </div>
  );
}

function MultipleDroppables() {
  const droppables = ['1', '2', '3', '4'];

  return (
    <section>
      {droppables.map((id) => (
        <Droppable id={id} key={id}>
          Droppable container id: ${id}
        </Droppable>
      ))}
    </section>
  );
}
```

For more details usage of the `useDroppable` hook, refer to the API documentation section:

[useDroppable](https://docs.dndkit.com/api-documentation/droppable/usedroppable)

Last updated 4 years ago

* * *
