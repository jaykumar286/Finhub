// books.ts
import { clerkMiddleware, getAuth } from "@hono/clerk-auth";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

import { db } from "@/db/drizzle";
import { accounts } from "@/db/schema";

import { createId } from "@paralleldrive/cuid2";

import { accountSchema } from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";

const app = new Hono()
  .get("/", clerkMiddleware(), async (c) => {
    const auth = getAuth(c);

    if (!auth?.userId) {
      const response = c.json(
        {
          error: "Unauthorize",
        },
        401
      );
      return response;
    }

    const results = await db
      .select({
        id: accounts.id,
        name: accounts.name,
      })
      .from(accounts)
      .where(eq(accounts.userId, auth.userId));
    return c.json({ data: results });
  })
  .get(
    "/:id",
    clerkMiddleware(),
    zValidator(
      "param",
      z.object({
        id: z.string().optional(),
      })
    ),
    async (c) => {
      const auth = getAuth(c);

      if (!auth?.userId) {
        const response = c.json(
          {
            error: "Unauthorize",
          },
          401
        );
        return response;
      }

      const { id } = c.req.valid("param");

      if (!id) {
        return c.json({ error: "Missing id" }, 400);
      }

      const [data] = await db
        .select({
          id: accounts.id,
          name: accounts.name,
        })
        .from(accounts)
        .where(and(eq(accounts.userId, auth.userId), eq(accounts.id, id)));

      if (!data) {
        return c.json({ error: "Not found" }, 400);
      }

      return c.json({ data });
    }
  )
  .post(
    "/",
    clerkMiddleware(),
    zValidator("json", accountSchema.pick({ name: true })),
    async (c) => {
      const auth = getAuth(c);

      if (!auth?.userId) {
        const response = c.json({ error: "Unauthorize" }, 401);
        throw new HTTPException(401, { res: response });
      }

      const data = c.req.valid("json");
      const insertValues = {
        id: createId(),
        userId: auth.userId,
        ...data,
      };
      const insertedData = await db
        .insert(accounts)
        .values(insertValues)
        .returning();
      return c.json({
        data: insertedData[0],
      });
    }
  )
  .post(
    "/bulk-delete",
    clerkMiddleware(),
    zValidator(
      "json",
      z.object({
        ids: z.array(z.string()),
      })
    ),
    async (c) => {
      const auth = getAuth(c);

      if (!auth?.userId) {
        const response = c.json({ error: "Unauthorize" }, 401);
        throw new HTTPException(401, { res: response });
      }

      const data = c.req.valid("json");

      const deletedData = await db
        .delete(accounts)
        .where(
          and(eq(accounts.userId, auth.userId), inArray(accounts.id, data.ids))
        )
        .returning({ id: accounts.id });


      return c.json({
        data: deletedData,
      });
    }
  )
  .patch(
    "/:id",
    clerkMiddleware(),
    zValidator("param", z.object({ id: z.string().optional() })),
    zValidator("json", accountSchema.pick({ name: true })),
    async (c) => {
      const auth = getAuth(c);

      if (!auth?.userId) {
        const response = c.json(
          {
            error: "Unauthorize",
          },
          401
        );
        return response;
      }

      const { id } = c.req.valid("param");
      const values = c.req.valid("json");

      if (!id) {
        return c.json({ error: "Missing id" }, 400);
      }

      const [data] = await db
        .update(accounts)
        .set(values)
        .where(and(eq(accounts.userId, auth.userId), eq(accounts.id, id)))
        .returning();

      if (!data) {
        return c.json({ error: "Could not find account" }, 404);
      }

      return c.json({ data });
    }
  )
  .delete(
    "/:id",
    clerkMiddleware(),
    zValidator("param", z.object({ id: z.string().optional() })),
    async (c) => {
      const auth = getAuth(c);

      if (!auth?.userId) {
        const response = c.json(
          {
            error: "Unauthorize",
          },
          401
        );
        return response;
      }

      const { id } = c.req.valid("param");

      if (!id) {
        return c.json({ error: "Missing id" }, 400);
      }

      const [data] = await db
        .delete(accounts)
        .where(and(eq(accounts.userId, auth.userId), eq(accounts.id, id)))
        .returning({ id: accounts.id });

      if (!data) {
        return c.json({ error: "Could not find account" }, 404);
      }

      return c.json({ data });
    }
  );

export default app;
