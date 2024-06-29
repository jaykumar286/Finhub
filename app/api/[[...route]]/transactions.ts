import { clerkMiddleware, getAuth } from "@hono/clerk-auth";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

import { db } from "@/db/drizzle";
import { accounts, categories, transactionSchema, transactions } from "@/db/schema";

import { createId } from "@paralleldrive/cuid2";

import { and, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { parse, subDays } from "date-fns";

const app = new Hono()
  .get(
    "/",
    zValidator(
      "query",
      z.object({
        from: z.string().optional(),
        to: z.string().optional(),
        accountId: z.string().optional(),
      })
    ),
    clerkMiddleware(),
    async (c) => {
      const auth = getAuth(c);
      const {from,to,accountId} = c.req.valid("query");

      if (!auth?.userId) {
        const response = c.json(
          {
            error: "Unauthorize",
          },
          401
        );
        return response;
      }

      const defaultTo = new Date();
      const defaultFrom = subDays(defaultTo,30);

      const startDate = from ? parse(from,"yyyy-MM-dd",new Date())
      : defaultFrom;

      const endDate = to ? parse(to,"yyyy-MM-dd",new Date())
      : defaultTo;

      const results = await db
        .select({
          id: transactions.id,
          date: transactions.date,
          categoryId: transactions.categoryId,
          categoryName: categories.name,
          payee: transactions.payee,
          amount: transactions.amount,
          notes: transactions.notes,
          accountId: transactions.accountId,
          accountName: accounts.name       
        })
        .from(transactions)
        .innerJoin(accounts,eq(transactions.accountId,accounts.id))
        .leftJoin(categories,eq(transactions.categoryId,categories.id))
        .where(
          and(
            accountId ? eq(transactions.accountId,accounts.id) : undefined,
            eq(accounts.userId,auth.userId),
            gte(transactions.date,startDate),
            lte(transactions.date,endDate),
          )
        )
        .orderBy(desc(transactions.date));

      return c.json({ data: results });
    }
  )
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
          id: transactions.id,
          date: transactions.date,
          categoryId: transactions.categoryId,
          payee: transactions.payee,
          amount: transactions.amount,
          notes: transactions.notes,
          accountId: transactions.accountId,
        })
        .from(transactions)
        .innerJoin(accounts,eq(transactions.accountId,accounts.id))
        .where(
          and(
            eq(accounts.userId, auth.userId), 
            eq(transactions.id, id))
        );

      if (!data) {
        return c.json({ error: "Not found" }, 400);
      }

      return c.json({ data });
    }
  )
  .post(
    "/",
    clerkMiddleware(),
    zValidator("json", transactionSchema.omit({ id: true })),
    async (c) => {
      const auth = getAuth(c);

      if (!auth?.userId) {
        const response = c.json({ error: "Unauthorize" }, 401);
        throw new HTTPException(401, { res: response });
      }

      const data = c.req.valid("json");

      const insertValues = {
        id: createId(),
        ...data,
      };

      const insertedData = await db
        .insert(transactions)
        .values(insertValues)
        .returning();
      return c.json({
        data: insertedData[0],
      });
    }
  )
  .post("/bulk-create",
    clerkMiddleware(),
    zValidator("json",z.array(
      transactionSchema.omit({
        id:true
      })
    )),
    async (c)=>{
      const auth = getAuth(c);
      const values = c.req.valid("json");

      if (!auth?.userId){
        return c.json({error:"Unauthorized"},401);
      }

      const data = await db.insert(transactions).values(
        values.map(value=>({
          id:createId(),
          ...value
        }))).returning();

        return c.json({data});
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

      const transactionsToDelete = db.$with("trasaction_to_delete").as(
        db.select({id: transactions.id}).from(transactions)
        .innerJoin(accounts,eq(transactions.accountId,accounts.id))
        .where(
          and(
            inArray(transactions.id,data.ids),
            eq(accounts.userId,auth.userId)
          )
        )
      )

      const deletedData = await db
        .with(transactionsToDelete)
        .delete(transactions)
        .where(
          inArray(transactions.id,sql`(select id from ${
            transactionsToDelete
          })`)
        )
        .returning({ id: transactions.id });

      return c.json({
        data: deletedData,
      });
    }
  )
  .patch(
    "/:id",
    clerkMiddleware(),
    zValidator("param", z.object({ id: z.string().optional() })),
    zValidator("json", transactionSchema.omit({ id: true })),
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

      const transactionsToUpdate = db.$with("trasaction_to_update").as(
        db.select({id: transactions.id})
        .from(transactions)
        .innerJoin(accounts,eq(transactions.accountId,accounts.id))
        .where(
          and(
            eq(transactions.id,id),
            eq(accounts.userId,auth.userId)
          )
        )
      )

      const [data] = await db
        .with(transactionsToUpdate)
        .update(transactions)
        .set(values)
        .where(
          inArray(transactions.id,sql`(select id from ${
            transactionsToUpdate
          })`)
        )
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

      const transactionsToDelete = db.$with("trasaction_to_delte").as(
        db.select({id: transactions.id})
        .from(transactions)
        .innerJoin(accounts,eq(transactions.accountId,accounts.id))
        .where(
          and(
            eq(transactions.id,id),
            eq(accounts.userId,auth.userId)
          )
        )
      )


      const [data] = await db
        .with(transactionsToDelete)
        .delete(transactions)
        .where(
          inArray(transactions.id,sql`(select id from ${
            transactionsToDelete
          })`)
        )
        .returning({ id: transactions.id });

      if (!data) {
        return c.json({ error: "Could not find transcation" }, 404);
      }

      return c.json({ data });
    }
  );

export default app;
