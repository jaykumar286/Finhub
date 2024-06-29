import { clerkMiddleware, getAuth } from "@hono/clerk-auth";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

import { db } from "@/db/drizzle";
import { categories,categoriesSchema } from "@/db/schema";

import { createId } from "@paralleldrive/cuid2";

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
        id: categories.id,
        name: categories.name,
      })
      .from(categories)
      .where(eq(categories.userId, auth.userId));
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
          id: categories.id,
          name: categories.name,
        })
        .from(categories)
        .where(and(eq(categories.userId, auth.userId), eq(categories.id, id)));

      if (!data) {
        return c.json({ error: "Not found" }, 400);
      }

      return c.json({ data });
    }
  )
  .post(
    "/",
    clerkMiddleware(),
    zValidator("json", categoriesSchema.pick({ name: true })),
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
        .insert(categories)
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
        .delete(categories)
        .where(
          and(eq(categories.userId, auth.userId), inArray(categories.id, data.ids))
        )
        .returning({ id: categories.id });

      return c.json({
        data: deletedData,
      });
    }
  )
  .patch(
    "/:id",
    clerkMiddleware(),
    zValidator("param",z.object({id: z.string().optional()})),
    zValidator("json", categoriesSchema.pick({ name: true })),
    async (c)=>{
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

        const [data] = await db.update(categories).set(values).where(
          and(
            eq(categories.userId,auth.userId),
            eq(categories.id,id)
          )
        ).returning();

        if (!data){
          return c.json({error:"Could not find account"},404)
        }

        return c.json({data});
    }
  )
  .delete(
    "/:id",
    clerkMiddleware(),
    zValidator("param",z.object({id: z.string().optional()})),
    async (c)=>{
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

        const [data] = await db.delete(categories).where(
          and(
            eq(categories.userId,auth.userId),
            eq(categories.id,id)
          )
        ).returning({id:categories.id});

        if (!data){
          return c.json({error:"Could not find account"},404)
        }

        return c.json({data});
    }
  );

export default app;
