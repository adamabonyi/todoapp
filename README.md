# Todo Client

I wanted to get a lot more done. Maybe not the best idea learning new things while in a time press isn't the best idea:

The idea behind the frontend was to generate/send _events_. So that others can _replay_. Sadly I forgot to think about having to implement the _replay_ feature on the backend to store a state... I didn't have time for that.

This task was done in two days (saturday and sunday) so there wasn't almost any time to refactor and/or improve things.

Completed:

- [x] **I as a user can create to-do items**
- [x] **I as another user can collaborate in real-time with user**
- [x] Set items as done\_\_
- [x] Can filter through items
- [x] Can add sub-tasks
- [] \_Add cost/price for tasks (**partially**, client missing)
- [] Sum of subtasks agregated to parent (**partially**, client missing)
- [x] Infinite nested levels (what UI allows, but infinite in logic)
- [] Rich text descriptions (**prepared**, client missing, "marked" npm library)
- [] I as user can see cursor/selection of another-user (wanted to do it over websockets, send x,y coordinates with an animated mouse cursor, changes already propagate instantly, only selections would needed to be implemented)
- [] multiple to-do lists (nothing, would expand structure of todo items and use query param to filter)
- [] special items (nothing, to-do would have type and type-values json type)
- [] keep editing list offline (nothing, PWA, store in local storage, store events, replay them once internet comes back online, or just save local state after online)
- [] VR goggles (nothing, would try to use WebXR but displaying web is difficult, maybe try WebXR DOM Overlays, but its only experimental on some browsers)
- [] Drag and drop (**partially**, just need to add DnD - did it many times in the past, updates for order change are prepared on client)
- [] Drag and drop subtasks (**dtto**)
- [x] Persisted when server restarts (it would be if deployed correctly, now it should, but its not perfect)
- [] Locking items (nothing, but adding a lock property and propagating it to other clients should be easy with what I have)

## Client

```
cd client
npm run dev
```

Probably the only interesting thing is recursive display of **TodoItems** and how I have nested creation of sub-items and sub itemlist.
I spent a lot of time on Tailwind too, so that it looks decent. Switching from dark/light mode should also be supported (I didn't have time to add a switch to the UI but it should respect the system settings and change dynamically).
My first time working with VITE and React was actually very enjoyable.
I would definitely split up the components more, remove logic from the larger files. Mainly regarding data loading. Custom Hooks or something like that.
Also I would have liked to added a router and support for query parameters. Route parameters for todo-lists and query parameters for filters so that you could easily send links.

Technologies:

- React
- Vite
- Websocket\*
- Tailwind\*

> \* library/package I didn't work with before

## Server

```
cd server
npm run start
```

Server is hacked quickly together. Wanted to try something so went with Fastify. Plugged in websockets. For DB I went with Prisma ORM that uses connects to SQLLite locally. This was also a new experience and I have struggled to set up Docker build correctly for Prisma and its SQLite db.
Otherwise it was pretty straightforward.
The backend is a mess. I would split routes separately from server setup.
I would convert access to Prism to a Fastify plugin so its part of the middleware process but It was easily usable the way it was.
Websockets have a simple pub-sub implementation for rooms (each todo-list would its own room) and all messages are always realted to a room and user who sends them.

Technologies:

- Fastify\*
- Websockets\*
- Prisma\* (ORM)

> \* library/package I didn't work with before

## Deployment

Docker, Nginx

Ideally I start my projects by setting up a CI in github actions (or whatever is available). I like to use docker multi-stage files to minimise the size of the docker image.
An attempt withou user permissiosn (because of prisma) was made in `server/Dockerfile`

## Hosting

I am hosting on a Virtual runing `Docker` and `Nginx`

# What Have I Done?

I tried to prepare my structures and approach to be ready for most of the tasks.
