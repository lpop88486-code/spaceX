import { Router } from "express";
import { db } from "@workspace/db";
import { walletsTable, walletTransactionsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

async function getOrCreateWallet(email: string) {
  const existing = await db
    .select()
    .from(walletsTable)
    .where(eq(walletsTable.email, email))
    .limit(1);

  if (existing[0]) return existing[0];

  const [created] = await db
    .insert(walletsTable)
    .values({ email, balance: 0 })
    .returning();

  return created;
}

function formatWallet(wallet: typeof walletsTable.$inferSelect) {
  return {
    id: wallet.id,
    email: wallet.email,
    balance: wallet.balance,
    createdAt: wallet.createdAt,
    updatedAt: wallet.updatedAt,
  };
}

function formatTransaction(tx: typeof walletTransactionsTable.$inferSelect) {
  return {
    id: tx.id,
    walletId: tx.walletId,
    type: tx.type,
    amount: tx.amount,
    description: tx.description,
    reference: tx.reference,
    status: tx.status,
    metadata: tx.metadata,
    createdAt: tx.createdAt,
  };
}

// GET /api/wallet/:email — get or create wallet
router.get("/wallet/:email", async (req, res): Promise<void> => {
  try {
    const { email } = req.params;
    if (!email) {
      res.status(400).json({ error: "Email is required" });
      return;
    }
    const wallet = await getOrCreateWallet(email);
    res.json(formatWallet(wallet));
  } catch (err) {
    req.log.error({ err }, "Failed to get wallet");
    res.status(500).json({ error: "Failed to get wallet" });
  }
});

// GET /api/wallet/:email/transactions — transaction history
router.get("/wallet/:email/transactions", async (req, res): Promise<void> => {
  try {
    const { email } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = (page - 1) * limit;

    const wallet = await getOrCreateWallet(email);

    const transactions = await db
      .select()
      .from(walletTransactionsTable)
      .where(eq(walletTransactionsTable.walletId, wallet.id))
      .orderBy(desc(walletTransactionsTable.createdAt))
      .limit(limit)
      .offset(offset);

    res.json({
      transactions: transactions.map(formatTransaction),
      page,
      limit,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get transactions");
    res.status(500).json({ error: "Failed to get transactions" });
  }
});

// POST /api/wallet/credit — add credits
router.post("/wallet/credit", async (req, res): Promise<void> => {
  try {
    const { email, amount, description, reference, metadata } = req.body as {
      email: string;
      amount: number;
      description: string;
      reference?: string;
      metadata?: Record<string, unknown>;
    };

    if (!email || !amount || amount <= 0) {
      res.status(400).json({ error: "email and a positive amount are required" });
      return;
    }
    if (!description) {
      res.status(400).json({ error: "description is required" });
      return;
    }

    const wallet = await getOrCreateWallet(email);

    const [updated] = await db
      .update(walletsTable)
      .set({ balance: wallet.balance + amount, updatedAt: new Date() })
      .where(eq(walletsTable.id, wallet.id))
      .returning();

    const [tx] = await db
      .insert(walletTransactionsTable)
      .values({
        walletId: wallet.id,
        type: "credit",
        amount,
        description,
        reference: reference ?? null,
        status: "completed",
        metadata: metadata ?? null,
      })
      .returning();

    res.status(201).json({
      wallet: formatWallet(updated),
      transaction: formatTransaction(tx),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to credit wallet");
    res.status(500).json({ error: "Failed to credit wallet" });
  }
});

// POST /api/wallet/debit — deduct credits
router.post("/wallet/debit", async (req, res): Promise<void> => {
  try {
    const { email, amount, description, reference, metadata } = req.body as {
      email: string;
      amount: number;
      description: string;
      reference?: string;
      metadata?: Record<string, unknown>;
    };

    if (!email || !amount || amount <= 0) {
      res.status(400).json({ error: "email and a positive amount are required" });
      return;
    }
    if (!description) {
      res.status(400).json({ error: "description is required" });
      return;
    }

    const wallet = await getOrCreateWallet(email);

    if (wallet.balance < amount) {
      res.status(400).json({ error: "Insufficient balance", balance: wallet.balance });
      return;
    }

    const [updated] = await db
      .update(walletsTable)
      .set({ balance: wallet.balance - amount, updatedAt: new Date() })
      .where(eq(walletsTable.id, wallet.id))
      .returning();

    const [tx] = await db
      .insert(walletTransactionsTable)
      .values({
        walletId: wallet.id,
        type: "debit",
        amount,
        description,
        reference: reference ?? null,
        status: "completed",
        metadata: metadata ?? null,
      })
      .returning();

    res.status(201).json({
      wallet: formatWallet(updated),
      transaction: formatTransaction(tx),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to debit wallet");
    res.status(500).json({ error: "Failed to debit wallet" });
  }
});

// POST /api/wallet/transfer — transfer credits between wallets
router.post("/wallet/transfer", async (req, res): Promise<void> => {
  try {
    const { fromEmail, toEmail, amount, description } = req.body as {
      fromEmail: string;
      toEmail: string;
      amount: number;
      description?: string;
    };

    if (!fromEmail || !toEmail || !amount || amount <= 0) {
      res.status(400).json({ error: "fromEmail, toEmail and a positive amount are required" });
      return;
    }
    if (fromEmail === toEmail) {
      res.status(400).json({ error: "Cannot transfer to the same wallet" });
      return;
    }

    const fromWallet = await getOrCreateWallet(fromEmail);

    if (fromWallet.balance < amount) {
      res.status(400).json({ error: "Insufficient balance", balance: fromWallet.balance });
      return;
    }

    const toWallet = await getOrCreateWallet(toEmail);
    const note = description ?? `Transfer to ${toEmail}`;

    const [updatedFrom] = await db
      .update(walletsTable)
      .set({ balance: fromWallet.balance - amount, updatedAt: new Date() })
      .where(eq(walletsTable.id, fromWallet.id))
      .returning();

    const [updatedTo] = await db
      .update(walletsTable)
      .set({ balance: toWallet.balance + amount, updatedAt: new Date() })
      .where(eq(walletsTable.id, toWallet.id))
      .returning();

    const ref = `TRF-${Date.now()}`;

    const [txOut] = await db
      .insert(walletTransactionsTable)
      .values({
        walletId: fromWallet.id,
        type: "transfer_out",
        amount,
        description: note,
        reference: ref,
        status: "completed",
        metadata: { toEmail },
      })
      .returning();

    const [txIn] = await db
      .insert(walletTransactionsTable)
      .values({
        walletId: toWallet.id,
        type: "transfer_in",
        amount,
        description: description ?? `Transfer from ${fromEmail}`,
        reference: ref,
        status: "completed",
        metadata: { fromEmail },
      })
      .returning();

    res.status(201).json({
      from: formatWallet(updatedFrom),
      to: formatWallet(updatedTo),
      transactions: {
        out: formatTransaction(txOut),
        in: formatTransaction(txIn),
      },
    });
  } catch (err) {
    req.log.error({ err }, "Failed to transfer credits");
    res.status(500).json({ error: "Failed to transfer credits" });
  }
});

export default router;
