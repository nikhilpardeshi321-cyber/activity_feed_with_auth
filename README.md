Activity Feed

In this assignment I have added the authentication basis logic to get tenant login wise activity feed. Also created signup API aand logout API.

This repository contains a tenant-isolated Activity Feed service with a React frontend and an Express/MongoDB backend.

Summary
Backend: Express + Mongoose (MongoDB). Implements tenant-isolated activities, cursor-based pagination, and optimistic writes.

Frontend: React (create-react-app) with an ActivityFeed UI that uses cursor-based pagination and optimistic updates.


Quickstart (development)
1. Start the backend

```bash
cd backend
npm install
# start the API on port 5000 (default)
npm run dev
```

2. Start the frontend

```bash
cd frontend
npm install
npm start
```

Environment
Backend reads environment variables via `dotenv` if present. Typical env values:
	`MONGODB_URI` — MongoDB connection string (if not using default local)
  `PORT` — backend port (default used in `server.js`)

Ports used
 Frontend dev server: 3000
 Backend API (default): 5000


What follows below documents the implementation and design notes for the project.



Task 1 – Activity Feed API (Backend) :-

The activity feed service was implemented using MongoDB with a tenant-isolated data model. An activities collection was created with the required fields: _id, tenantId, actorId, actorName, type, entityId, metadata, and createdAt.

The POST /activities endpoint creates new activity records and is optimized for high write throughput by using a simple schema and avoiding joins.

The GET /activities endpoint supports cursor-based pagination using createdAt as the cursor. Records are fetched by filtering on tenantId and createdAt, sorted in descending order, and limited to the requested page size. Offset-based pagination was not used.

A compound index on tenantId and createdAt was added to ensure fast reads and proper tenant isolation. Projection was used to return only required fields.



Task 2 – Performance Debugging :-

A MongoDB query using skip() is slow because MongoDB must scan and discard all skipped documents before returning the requested results. Even though the skipped records are not returned to the client, they are still read and processed internally, which causes the query time to increase linearly as the offset grows. This makes skip() especially inefficient for large collections and infinite scroll use cases, leading to high CPU usage and poor performance in production.

To fix this, cursor-based pagination should be used instead of offset-based pagination. Cursor pagination works by using a reference value, usually an indexed field like createdAt, to fetch the next set of records. Instead of skipping documents, the query filters records using a range condition such as createdAt < lastSeenCreatedAt, sorts them in descending order, and limits the result size. This allows MongoDB to directly jump to the correct position in the index, providing consistent and efficient performance even with millions of records.

The correct index to support this approach is a compound index on tenantId and createdAt, for example { tenantId: 1, createdAt: -1 }. This index ensures tenant isolation, supports efficient sorting, and enables fast range queries required for cursor pagination. To monitor performance in production, key metrics such as query execution time, documents scanned versus documents returned, index hit ratio, CPU usage, memory usage, and slow query logs should be tracked to identify inefficient queries and ensure the database is using indexes correctly.



Task 3 – Activity Feed UI (Frontend) :-

A React ActivityFeed component was implemented using hooks only. State management was handled using useState, and data fetching was controlled with useEffect.

Infinite scrolling was implemented using cursor-based pagination from the backend API. Loading states, empty states, filtering, and real-time updates were handled within the component.

Unnecessary re-renders were prevented by using proper dependency management and memoized callbacks. Redux was not used.



Task 4 – Optimistic UI Update :-

Optimistic UI updates were implemented during activity creation. New activities are immediately rendered in the UI before the API response is received.

If the API request succeeds, the temporary activity is replaced with the persisted activity. If the request fails, the temporary entry is removed to maintain consistency.



Task 5 – System Design and Scalability :-

The system was designed to scale up to 50 million activities per tenant. Data is partitioned using sharding based on tenantId, supported by compound indexing on tenantId and createdAt.

Hot Tenants are isolated by assigning them to dedicated shards. Data retention policies are applied to archive or remove older activity records.

Real-time delivery is handled using WebSockets for frequent updates or Server-Sent Events for simpler one-way communication, depending on usage patterns.

Overall, scaling to tens of millions of activities per tenant requires aligning indexing with query patterns, distributing data intelligently through sharding, isolating high-traffic tenants, enforcing data retention policies, and choosing an appropriate real-time delivery mechanism (WebSocket or SSE) to balance performance and complexity.


Task 6 – Debugging and Refactoring :-

The bug in this useEffect is that activities is included in the dependency array, but the effect itself updates activities using setActivities. This causes the effect to run again every time the state updates, creating an infinite loop of API calls and re-renders.

In production, this can lead to continuous network requests, high server load, poor application performance, and even browser freezes or crashes.

The fix is to remove activities from the dependency array and run the effect only when needed, such as on component mount or when a cursor or filter changes.

To prevent this issue, developers should carefully manage useEffect dependencies, avoid including state that is updated inside the effect, use ESLint hook rules.


Bonus – Event-Driven Architecture :-

The backend flow was redesigned using asynchronous processing with a message queue. Activity creation events are published to the queue and processed by background workers.

Idempotency is ensured using unique event identifiers. Retry mechanisms and failure handling are implemented to prevent data loss and ensure reliable processing.